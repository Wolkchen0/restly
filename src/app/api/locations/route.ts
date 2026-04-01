import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/locations — fetch all locations for the current restaurant
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: {
                locations: {
                    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
                },
            },
        });

        if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({
            restaurantName: restaurant.name,
            plan: restaurant.plan,
            email: restaurant.email,
            emailVerified: restaurant.emailVerified,
            createdAt: restaurant.createdAt,
            locations: restaurant.locations.map(l => ({
                id: l.id,
                name: l.name,
                address: l.address,
                city: l.city,
                timezone: l.timezone,
                isDefault: l.isDefault,
                isActive: l.isActive,
                posProvider: l.posProvider,
                instagramToken: !!l.instagramToken,
                facebookToken: !!l.facebookToken,
                tiktokToken: !!l.tiktokToken,
                xToken: !!l.xToken,
                googleBusinessToken: !!l.googleBusinessToken,
                yelpApiKey: !!l.yelpApiKey,
                opentableRestaurantId: !!l.opentableRestaurantId,
                emailConnected: !!(l.emailImapHost && l.emailUser && l.emailPass),
                emailAddress: l.emailAddress || null,
            })),
        });
    } catch (err: any) {
        console.error("GET /api/locations error:", err?.message || err);
        return NextResponse.json({ error: "Failed to load locations" }, { status: 500 });
    }
}

// POST /api/locations — add a new location
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, address, city, timezone, posProvider } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const location = await prisma.location.create({
            data: {
                restaurantId: session.user.id,
                name,
                address: address || null,
                city: city || null,
                timezone: timezone || "America/Los_Angeles",
                posProvider: posProvider || null,
            },
        });

        return NextResponse.json({ location }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/locations error:", err?.message || err);
        return NextResponse.json({ error: err?.message || "Failed to create location" }, { status: 500 });
    }
}

// PATCH /api/locations — update a location
export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { locationId, ...updates } = body;

        if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

        const allowed = ["name", "address", "city", "timezone", "posProvider", "posApiKey", "posSecretKey", "posLocationId", "opentableClientId", "opentableClientSecret", "opentableRestaurantId", "isDefault", "isActive", "primaryColor", "instagramToken", "facebookToken", "tiktokToken", "xToken", "googleBusinessToken", "yelpApiKey", "emailAddress", "emailImapHost", "emailImapPort", "emailSmtpHost", "emailSmtpPort", "emailUser", "emailPass"];
        const data = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

        const location = await prisma.location.update({
            where: { id: locationId },
            data,
        });

        return NextResponse.json({ location });
    } catch (err: any) {
        console.error("PATCH /api/locations error:", err?.message || err);
        return NextResponse.json({ error: err?.message || "Failed to update location" }, { status: 500 });
    }
}
