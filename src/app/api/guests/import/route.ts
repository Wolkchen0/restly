// Guest CSV Import API — parses OpenTable CSV exports, smart merges into DB
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ParsedGuest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    visitCount: number;
    lastVisit: string;
    averagePartySize: number;
    tags: string[];
    notes: string;
    dietaryNotes: string;
    isVip: boolean;
}

// Smart column mapper — handles different CSV formats
function mapColumns(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    const lower = headers.map(h => h.toLowerCase().trim().replace(/['"]/g, ""));
    
    const mappings: Record<string, string[]> = {
        firstName: ["first name", "firstname", "first", "guest first name", "name"],
        lastName: ["last name", "lastname", "last", "guest last name", "surname"],
        email: ["email", "e-mail", "email address", "guest email"],
        phone: ["phone", "phone number", "telephone", "mobile", "cell", "guest phone"],
        visitCount: ["visits", "total visits", "visit count", "# visits", "number of visits", "covers"],
        lastVisit: ["last visit", "last visited", "last visit date", "most recent visit", "date"],
        partySize: ["party size", "avg party size", "average party size", "avg covers", "guests"],
        tags: ["tags", "labels", "categories", "guest tags"],
        notes: ["notes", "guest notes", "comments", "special requests"],
        dietary: ["dietary", "dietary notes", "allergies", "dietary restrictions", "food allergies"],
    };

    for (const [key, aliases] of Object.entries(mappings)) {
        const idx = lower.findIndex(h => aliases.some(a => h.includes(a)));
        if (idx !== -1) map[key] = idx;
    }

    return map;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseGuests(csvText: string): { guests: ParsedGuest[]; errors: string[] } {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { guests: [], errors: ["CSV must have a header row and at least one data row."] };

    const headers = parseCSVLine(lines[0]);
    const colMap = mapColumns(headers);
    const errors: string[] = [];
    const guests: ParsedGuest[] = [];

    // If we can't find firstName, try "name" column and split
    const hasName = colMap.firstName !== undefined;
    if (!hasName && colMap.firstName === undefined) {
        // Try to find a generic "name" column
        const nameIdx = headers.findIndex(h => h.toLowerCase().trim() === "name" || h.toLowerCase().trim() === "guest name");
        if (nameIdx !== -1) colMap.firstName = nameIdx;
    }

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 2) continue;

        let firstName = cols[colMap.firstName] || "";
        let lastName = cols[colMap.lastName] || "";

        // If no lastName column, try splitting firstName
        if (!lastName && firstName.includes(" ")) {
            const parts = firstName.split(/\s+/);
            firstName = parts[0];
            lastName = parts.slice(1).join(" ");
        }

        if (!firstName) {
            errors.push(`Row ${i + 1}: No name found, skipped.`);
            continue;
        }

        const tags = cols[colMap.tags]?.split(/[,;]/).map(t => t.trim()).filter(Boolean) || [];
        const isVip = tags.some(t => t.toLowerCase().includes("vip")) || 
                      (cols[colMap.notes] || "").toLowerCase().includes("vip");

        guests.push({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: (cols[colMap.email] || "").trim(),
            phone: (cols[colMap.phone] || "").trim(),
            visitCount: parseInt(cols[colMap.visitCount]) || 1,
            lastVisit: (cols[colMap.lastVisit] || "").trim(),
            averagePartySize: parseInt(cols[colMap.partySize]) || 2,
            tags,
            notes: (cols[colMap.notes] || "").trim(),
            dietaryNotes: (cols[colMap.dietary] || "").trim(),
            isVip,
        });
    }

    return { guests, errors };
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const csvText = formData.get("csvText") as string | null;

        let content = "";
        if (file) {
            content = await file.text();
        } else if (csvText) {
            content = csvText;
        } else {
            return NextResponse.json({ error: "No CSV file or text provided." }, { status: 400 });
        }

        const { guests, errors } = parseGuests(content);
        if (guests.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: "No valid guests found in CSV.", 
                parseErrors: errors 
            }, { status: 400 });
        }

        // Smart merge: upsert each guest
        let created = 0, updated = 0, skipped = 0;

        for (const g of guests) {
            try {
                const existing = await prisma.guest.findUnique({
                    where: {
                        restaurantId_firstName_lastName: {
                            restaurantId: session.user.id,
                            firstName: g.firstName,
                            lastName: g.lastName,
                        },
                    },
                });

                if (existing) {
                    // Smart merge — keep higher values, merge notes
                    await prisma.guest.update({
                        where: { id: existing.id },
                        data: {
                            email: g.email || existing.email,
                            phone: g.phone || existing.phone,
                            visitCount: Math.max(g.visitCount, existing.visitCount),
                            lastVisit: g.lastVisit || existing.lastVisit,
                            averagePartySize: g.averagePartySize || existing.averagePartySize,
                            dietaryNotes: g.dietaryNotes || existing.dietaryNotes,
                            notes: g.notes && g.notes !== existing.notes 
                                ? (existing.notes ? `${existing.notes}\n${g.notes}` : g.notes)
                                : existing.notes,
                            isVip: g.isVip || existing.isVip,
                            preferences: g.tags.length > 0 
                                ? [...new Set([...existing.preferences, ...g.tags])]
                                : existing.preferences,
                            source: "opentable",
                        },
                    });
                    updated++;
                } else {
                    // Create new guest
                    await prisma.guest.create({
                        data: {
                            restaurantId: session.user.id,
                            firstName: g.firstName,
                            lastName: g.lastName,
                            email: g.email,
                            phone: g.phone,
                            visitCount: g.visitCount,
                            lastVisit: g.lastVisit || null,
                            averagePartySize: g.averagePartySize,
                            dietaryNotes: g.dietaryNotes,
                            notes: g.notes,
                            isVip: g.isVip,
                            preferences: g.tags,
                            source: "opentable",
                        },
                    });
                    created++;
                }
            } catch (err: any) {
                skipped++;
                errors.push(`${g.firstName} ${g.lastName}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            summary: { total: guests.length, created, updated, skipped },
            parseErrors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        console.error("CSV import error:", err);
        return NextResponse.json({ error: `Import failed: ${err.message}` }, { status: 500 });
    }
}
