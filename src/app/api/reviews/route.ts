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
    if (activeLoc?.yelpApiKey) {
        try {
            // Auto-strip "Bearer " if user pasted it with prefix
            let yelpKey = activeLoc.yelpApiKey;
            if (yelpKey.toLowerCase().startsWith("bearer ")) yelpKey = yelpKey.substring(7).trim();

            // Use Yelp API key to search for the business by name + location
            const searchQuery = encodeURIComponent(restaurant.name);
            const searchLocation = encodeURIComponent(activeLoc.city || "");
            const searchUrl = `https://api.yelp.com/v3/businesses/search?term=${searchQuery}&location=${searchLocation}&limit=1`;
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${yelpKey}` },
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

    const isDemoAccount = restaurant.name.toLowerCase().includes("sample") || restaurant.email.startsWith("demo");

    // If demo account AND no real reviews came from APIs, serve demo data
    if (isDemoAccount && allReviews.length === 0) {
        const restName = activeLoc?.name || restaurant.name;
        const cityShort = (activeLoc?.city || "San Francisco").split(",")[0].trim();
        const demoReviews = [
            { id: "dr_1", platform: "Google", icon: "🌐", author: "Rachel M.", rating: 5, text: `Best dining experience in ${cityShort}! The truffle burger was out of this world. Our server was incredibly knowledgeable about the wine pairings. Can't wait to come back for the tasting menu.`, date: "2 days ago", sentiment: "positive" },
            { id: "dr_2", platform: "Yelp", icon: "🔴", author: "David K.", rating: 4, text: `Really enjoyed the avocado toast and the ambiance. Only reason for 4 stars is the 20-minute wait even with a reservation. Food quality is easily 5 stars though. The pan-seared salmon is a must-try.`, date: "3 days ago", sentiment: "positive" },
            { id: "dr_3", platform: "OpenTable", icon: "🟢", author: "Jennifer L.", rating: 5, text: `Anniversary dinner was absolutely perfect. The staff surprised us with a complimentary dessert and a personalized card. The risotto was creamy and perfectly seasoned. VIP treatment all the way!`, date: "4 days ago", sentiment: "positive" },
            { id: "dr_4", platform: "Google", icon: "🌐", author: "Marcus T.", rating: 3, text: `Food was good but not great for the price point. The duck breast was overcooked and the sides were lukewarm. Service was friendly but slow — took 25 minutes to get our entrees. Cocktails were excellent though.`, date: "5 days ago", sentiment: "neutral" },
            { id: "dr_5", platform: "Yelp", icon: "🔴", author: "Sophie W.", rating: 5, text: `${restName} never disappoints! This is our go-to spot for date nights. The sourdough bread alone is worth the visit. The atmosphere is intimate and the staff always remembers our usual order. 10/10.`, date: "1 week ago", sentiment: "positive" },
            { id: "dr_6", platform: "Google", icon: "🌐", author: "Alex R.", rating: 2, text: `Disappointing visit this time. Had to wait 40 minutes past our reservation. When the food finally came, my steak was medium-well instead of medium-rare. Won't be rushing back.`, date: "1 week ago", sentiment: "negative" },
        ];

        const posCount = demoReviews.filter(r => r.sentiment === "positive").length;
        const sentimentScore = Math.round((posCount / demoReviews.length) * 100);

        return NextResponse.json({
            connected: true,
            reviews: demoReviews,
            sentimentScore,
            avgRating: (demoReviews.reduce((a, r) => a + r.rating, 0) / demoReviews.length).toFixed(1),
            totalReviews: demoReviews.length,
            sources: { google: true, yelp: true, opentable: true },
            mode: "demo",
        });
    }

    return NextResponse.json({
        connected: allReviews.length > 0 || isConnected,
        reviews: allReviews,
        sentimentScore: allReviews.length > 0 ? Math.round((allReviews.filter(r => r.sentiment === "positive").length / allReviews.length) * 100) : 0,
        avgRating: allReviews.length > 0 ? (allReviews.reduce((a: number, r: any) => a + r.rating, 0) / allReviews.length).toFixed(1) : "0",
        totalReviews: allReviews.length,
        sources: {
            google: !!activeLoc?.googleBusinessToken,
            yelp: !!activeLoc?.yelpApiKey,
            opentable: !!activeLoc?.opentableRestaurantId,
        },
    });
}
