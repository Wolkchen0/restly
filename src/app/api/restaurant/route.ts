import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/restaurant — fetch current tenant's brand profile
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const r = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        select: {
            id: true, name: true, email: true, plan: true,
            primaryColor: true, openaiKey: true,
            trialEndsAt: true, isActive: true, createdAt: true,
            // Include default location info
            locations: {
                where: { isDefault: true },
                take: 1,
                select: { timezone: true, city: true },
            },
        },
    });

    if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Flatten first location's timezone for backward compat
    const defaultLoc = r.locations?.[0];
    return NextResponse.json({
        ...r,
        timezone: defaultLoc?.timezone || "America/Los_Angeles",
        city: defaultLoc?.city || null,
        locations: undefined,
    });
}

// PATCH /api/restaurant — update brand-level settings
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const allowed = ["name", "primaryColor", "openaiKey"] as const;
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
