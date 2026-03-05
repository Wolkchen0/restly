import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET  /api/restaurant  — fetch current tenant's profile
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const r = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        select: {
            id: true, name: true, email: true, plan: true,
            location: true, timezone: true, primaryColor: true,
            openaiKey: true,
            // Custom fields stored in the JSON-like way via notes field
            // We store opentable/toast keys in dedicated columns (added below)
            trialEndsAt: true, isActive: true, createdAt: true,
        },
    });

    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(r);
}

// PATCH /api/restaurant  — update tenant settings (name, keys, color, etc.)
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();

        // Only allow safe fields (never update email/password here)
        const allowed = [
            "name", "location", "timezone", "primaryColor", "openaiKey",
            "opentableClientId", "opentableClientSecret", "opentableRestaurantId",
            "toastApiKey", "toastRestaurantGuid",
        ] as const;
        const data: Record<string, string> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        const updated = await prisma.restaurant.update({
            where: { id: session.user.id },
            data,
        });

        return NextResponse.json({ success: true, name: updated.name, primaryColor: updated.primaryColor });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
