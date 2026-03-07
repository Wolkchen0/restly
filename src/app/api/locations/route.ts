import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/locations — fetch all locations for the current restaurant
export async function GET() {
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
        locations: restaurant.locations.map(l => ({
            id: l.id,
            name: l.name,
            address: l.address,
            city: l.city,
            timezone: l.timezone,
            isDefault: l.isDefault,
            isActive: l.isActive,
            posProvider: l.posProvider,
        })),
    });
}

// POST /api/locations — add a new location
export async function POST(req: Request) {
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
}

// PATCH /api/locations — update a location
export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { locationId, ...updates } = body;

    if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

    const allowed = ["name", "address", "city", "timezone", "posProvider", "posApiKey", "posSecretKey", "posLocationId", "opentableClientId", "opentableClientSecret", "opentableRestaurantId", "isDefault", "isActive", "primaryColor"];
    const data = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

    const location = await prisma.location.update({
        where: { id: locationId },
        data,
    });

    return NextResponse.json({ location });
}
