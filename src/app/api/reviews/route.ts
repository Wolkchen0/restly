import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        include: { locations: true }
    });

    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const activeLoc = restaurant.locations.find(l => l.isDefault) || restaurant.locations[0];

    const isConnected = !!(activeLoc?.googleBusinessToken || activeLoc?.yelpApiKey || activeLoc?.opentableRestaurantId);

    if (!isConnected) {
        return NextResponse.json({ connected: false, reviews: [] });
    }

    // IF PRODUCTION => Fetch from real Google Maps / Yelp API here using the token

    return NextResponse.json({
        connected: true,
        reviews: [
            { id: 1, platform: "Google Business", icon: "🌐", author: "Raj. K", rating: 5, date: "Today", text: "The tasting menu was phenomenal. Service impeccable." },
            { id: 2, platform: "Yelp", icon: "🔴", author: "Sarah M.", rating: 4, date: "Yesterday", text: "Lovely ambiance and great cocktails, but the main course took a bit long." },
            { id: 3, platform: "OpenTable", icon: "🍽️", author: "David Brooks", rating: 5, date: "2 days ago", text: "Best anniversary dinner we've ever had. Highly recommend the lamb chops." }
        ]
    });
}
