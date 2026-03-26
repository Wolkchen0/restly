// Google Places Reviews API Route
// Fetches real reviews from Google Places API (requires API key)
// Only returns demo reviews for demo accounts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
        return NextResponse.json({ error: "placeId required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        // Check if this is a demo account before returning demo reviews
        const session = await auth();
        let isDemoAccount = false;
        if (session?.user?.id) {
            try {
                const restaurant = await prisma.restaurant.findUnique({ where: { id: session.user.id } });
                if (restaurant) {
                    isDemoAccount = restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
                }
            } catch { /* ignore */ }
        }

        if (isDemoAccount) {
            return NextResponse.json({
                reviews: [
                    { id: "gd1", platform: "Google", author: "Mike R.", rating: 5, text: "Exceptional dining experience. The truffle burger was outstanding, service attentive.", date: "2 days ago", sentiment: "positive" },
                    { id: "gd2", platform: "Google", author: "Elena R.", rating: 4, text: "Great atmosphere and solid cocktails. The Spicy Marg is a must-try.", date: "3 days ago", sentiment: "positive" },
                    { id: "gd3", platform: "Google", author: "Chris W.", rating: 3, text: "Food was decent but wait time was too long on a Friday night.", date: "5 days ago", sentiment: "neutral" },
                ],
                source: "demo",
                note: "Set GOOGLE_PLACES_API_KEY in .env.local for real reviews",
            });
        }

        // Real user without API key — return empty
        return NextResponse.json({
            reviews: [],
            source: "none",
            note: "Connect Google Business in Settings to see reviews here.",
        });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "OK" || !data.result?.reviews) {
            return NextResponse.json({ error: `Google API: ${data.status}`, reviews: [] }, { status: 502 });
        }

        const reviews = data.result.reviews.map((r: any, i: number) => ({
            id: `g_${i}`,
            platform: "Google" as const,
            author: r.author_name,
            rating: r.rating,
            text: r.text,
            date: r.relative_time_description,
            profileUrl: r.author_url,
            sentiment: r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
        }));

        return NextResponse.json({
            reviews,
            source: "api",
            overallRating: data.result.rating,
            totalReviews: data.result.user_ratings_total,
            restaurantName: data.result.name,
        });
    } catch (error: any) {
        console.error("Google Places API error:", error);
        return NextResponse.json({ error: error.message, reviews: [] }, { status: 500 });
    }
}
