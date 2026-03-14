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

    const allReviews: any[] = [];

    // ── Google Places API ───────────────────────────────────────
    // googleBusinessToken is treated as Google Place ID
    // Requires GOOGLE_PLACES_API_KEY env var to be set
    if (activeLoc?.googleBusinessToken) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (apiKey) {
            try {
                const placeId = activeLoc.googleBusinessToken;
                const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === "OK" && data.result?.reviews) {
                    data.result.reviews.forEach((r: any, i: number) => {
                        allReviews.push({
                            id: `g_${i}`,
                            platform: "Google",
                            icon: "🌐",
                            author: r.author_name,
                            rating: r.rating,
                            text: r.text,
                            date: r.relative_time_description || "Recently",
                            sentiment: r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
                        });
                    });
                }
            } catch (e) { console.error("Google Reviews fetch error:", e); }
        }
    }

    // ── Yelp Fusion API ─────────────────────────────────────────
    // yelpApiKey is used as the Bearer token, need YELP_BUSINESS_ID or use search
    if (activeLoc?.yelpApiKey) {
        try {
            // Use Yelp API key to search for the business by name + location
            const searchQuery = encodeURIComponent(restaurant.name);
            const searchLocation = encodeURIComponent(activeLoc.city || "");
            const searchUrl = `https://api.yelp.com/v3/businesses/search?term=${searchQuery}&location=${searchLocation}&limit=1`;
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${activeLoc.yelpApiKey}` },
            });
            const searchData = await searchRes.json();
            const bizId = searchData.businesses?.[0]?.id;
            
            if (bizId) {
                const reviewUrl = `https://api.yelp.com/v3/businesses/${bizId}/reviews?limit=10&sort_by=newest`;
                const reviewRes = await fetch(reviewUrl, {
                    headers: { Authorization: `Bearer ${activeLoc.yelpApiKey}` },
                });
                const reviewData = await reviewRes.json();
                if (reviewData.reviews) {
                    reviewData.reviews.forEach((r: any, i: number) => {
                        allReviews.push({
                            id: `y_${i}`,
                            platform: "Yelp",
                            icon: "🔴",
                            author: r.user?.name || "Anonymous",
                            rating: r.rating,
                            text: r.text,
                            date: r.time_created ? new Date(r.time_created).toLocaleDateString() : "Recently",
                            sentiment: r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral",
                        });
                    });
                }
            }
        } catch (e) { console.error("Yelp Reviews fetch error:", e); }
    }

    // ── OpenTable (no public reviews API — just flag as connected) ──
    // OpenTable doesn't have a public reviews API, so we note connection status

    return NextResponse.json({
        connected: true,
        reviews: allReviews,
        sources: {
            google: !!activeLoc?.googleBusinessToken,
            yelp: !!activeLoc?.yelpApiKey,
            opentable: !!activeLoc?.opentableRestaurantId,
        },
    });
}
