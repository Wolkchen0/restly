// Yelp Fusion Reviews API Route
// Fetches real reviews from Yelp Business API
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
        return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            reviews: [
                { id: "yd1", platform: "Yelp", author: "Anna L.", rating: 4, text: "Great food but wait time was long. The lobster risotto is a must-try.", date: "1 week ago", sentiment: "positive" },
                { id: "yd2", platform: "Yelp", author: "Tom H.", rating: 5, text: "Incredible experience from start to finish. The cocktails are world-class.", date: "2 weeks ago", sentiment: "positive" },
                { id: "yd3", platform: "Yelp", author: "Jamie S.", rating: 2, text: "Overpriced for what you get. Expected more from the hype.", date: "3 weeks ago", sentiment: "negative" },
            ],
            source: "demo",
            note: "Set YELP_API_KEY in .env.local for real reviews",
        });
    }

    try {
        const url = `https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=10&sort_by=newest`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = await res.json();

        if (!data.reviews) {
            return NextResponse.json({ error: "No reviews found", reviews: [] }, { status: 502 });
        }

        const reviews = data.reviews.map((r: any, i: number) => ({
            id: `y_${i}`,
            platform: "Yelp" as const,
            author: r.user?.name || "Anonymous",
            rating: r.rating,
            text: r.text,
            date: r.time_created ? new Date(r.time_created).toLocaleDateString() : "Recently",
            profileUrl: r.user?.profile_url,
            sentiment: r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
        }));

        return NextResponse.json({ reviews, source: "api" });
    } catch (error: any) {
        console.error("Yelp API error:", error);
        return NextResponse.json({ error: error.message, reviews: [] }, { status: 500 });
    }
}
