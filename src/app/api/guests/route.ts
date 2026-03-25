import { NextResponse, NextRequest } from "next/server";
import { getAllGuests, getStats, getTodayReservations, getVipGuests } from "@/services/opentable";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
    });
    const isDemoAccount = restaurant?.name?.toLowerCase().includes("sample") || restaurant?.email?.startsWith("demo");

    if (isDemoAccount) {
        // Demo account — return mock data from opentable service
        const guests = getAllGuests();
        const stats = getStats();
        const todayRes = getTodayReservations();
        const vips = getVipGuests();
        return NextResponse.json({ guests, stats, todayReservations: todayRes, vipGuests: vips });
    }

    // ── REAL ACCOUNT: Load guests from database ──
    const dbGuests = await prisma.guest.findMany({
        where: { restaurantId: session.user.id },
        orderBy: { updatedAt: "desc" },
    });

    const guests = dbGuests.map(g => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        visitCount: g.visitCount,
        lastVisit: g.lastVisit,
        preferences: g.preferences,
        dietaryNotes: g.dietaryNotes,
        averageSpend: g.averageSpend,
        isVip: g.isVip,
        favoriteItems: g.favoriteItems,
        specialOccasions: g.specialOccasions,
        averagePartySize: g.averagePartySize,
        notes: g.notes,
        source: g.source,
    }));

    const vips = guests.filter(g => g.isVip);
    const stats = {
        totalGuests: guests.length,
        vipGuests: vips.length,
        coversToday: 0, // Will come from POS/OpenTable when connected
        reservationsToday: 0,
        avgSpend: guests.length > 0 ? Math.round(guests.reduce((a, g) => a + g.averageSpend, 0) / guests.length) : 0,
    };

    return NextResponse.json({
        guests,
        stats,
        todayReservations: [], // Will come from POS/OpenTable
        vipGuests: vips,
    });
}

// POST — Add or update a guest (used by chatbot and manual entry)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, isVip, notes, dietaryNotes, preferences } = body;
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || name;
        const lastName = parts.slice(1).join(" ") || "";

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
        });
        const isDemoAccount = restaurant?.name?.toLowerCase().includes("sample") || restaurant?.email?.startsWith("demo");

        if (isDemoAccount) {
            // Demo: use in-memory mock — handled client-side via sessionStorage
            return NextResponse.json({ success: true, guest: { firstName, lastName, isVip, dietaryNotes, notes } });
        }

        // ── REAL ACCOUNT: Upsert guest in database ──
        const guest = await prisma.guest.upsert({
            where: {
                restaurantId_firstName_lastName: {
                    restaurantId: session.user.id,
                    firstName,
                    lastName,
                },
            },
            update: {
                ...(isVip !== undefined && { isVip }),
                ...(notes && { notes }),
                ...(dietaryNotes && { dietaryNotes }),
                ...(preferences && preferences.length > 0 && { preferences }),
                source: "chatbot",
            },
            create: {
                restaurantId: session.user.id,
                firstName,
                lastName,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@guest.com`,
                isVip: isVip ?? false,
                notes: notes || "",
                dietaryNotes: dietaryNotes || "",
                preferences: preferences || [],
                source: "chatbot",
            },
        });

        return NextResponse.json({
            success: true,
            guest: {
                id: guest.id,
                name: `${guest.firstName} ${guest.lastName}`,
                firstName: guest.firstName,
                lastName: guest.lastName,
                isVip: guest.isVip,
                dietaryNotes: guest.dietaryNotes,
                notes: guest.notes,
                preferences: guest.preferences,
            },
        });
    } catch (error: any) {
        console.error("Guest POST error:", error?.message || error);
        return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
    }
}
