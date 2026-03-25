// Social Monitor API - Fetches real social mentions for each customer's restaurant
// Uses Google Custom Search API, restaurant reviews, and web scraping
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface SocialMention {
    id: string;
    source: string;
    sourceIcon: string;
    title: string;
    snippet: string;
    sentiment: "positive" | "neutral" | "negative";
    date: string;
    url: string;
    isNew: boolean;
    engagement?: { likes: number; comments: number; shares: number };
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
    const lower = text.toLowerCase();
    const positiveWords = ["great", "amazing", "excellent", "best", "love", "perfect", "outstanding", "fantastic", "wonderful", "delicious", "incredible", "recommend", "favorite", "must-try", "beautiful", "awesome", "top", "superb"];
    const negativeWords = ["bad", "terrible", "worst", "awful", "horrible", "disgusting", "disappointing", "poor", "never", "overpriced", "rude", "dirty", "slow", "cold", "stale", "avoid"];

    let score = 0;
    for (const w of positiveWords) if (lower.includes(w)) score++;
    for (const w of negativeWords) if (lower.includes(w)) score--;

    return score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
}

// Format relative date from ISO date string
function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

// Fetch Google Custom Search results for restaurant mentions
async function fetchGoogleMentions(restaurantName: string, city: string): Promise<SocialMention[]> {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) return [];

    try {
        const query = encodeURIComponent(`"${restaurantName}" ${city} restaurant`);
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}&num=5&dateRestrict=m1&sort=date`;

        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour
        const data = await res.json();

        if (!data.items) return [];

        return data.items.map((item: any, i: number) => {
            const snippet = item.snippet || "";
            const sentiment = analyzeSentiment(snippet);
            const source = new URL(item.link).hostname.replace("www.", "");
            const sourceMap: Record<string, { icon: string; name: string }> = {
                "yelp.com": { icon: "🔴", name: "Yelp" },
                "tripadvisor.com": { icon: "🟢", name: "TripAdvisor" },
                "google.com": { icon: "🌐", name: "Google" },
                "instagram.com": { icon: "📸", name: "Instagram" },
                "facebook.com": { icon: "👤", name: "Facebook" },
                "twitter.com": { icon: "🐦", name: "X/Twitter" },
                "x.com": { icon: "🐦", name: "X" },
                "reddit.com": { icon: "💬", name: "Reddit" },
                "eater.com": { icon: "📰", name: "Eater" },
                "timeout.com": { icon: "📰", name: "TimeOut" },
                "infatuation.com": { icon: "📰", name: "Infatuation" },
                "tiktok.com": { icon: "🎬", name: "TikTok" },
            };
            const matched = Object.entries(sourceMap).find(([domain]) => source.includes(domain));

            return {
                id: `gcs_${i}_${Date.now()}`,
                source: matched ? matched[1].name : source,
                sourceIcon: matched ? matched[1].icon : "🔗",
                title: item.title || "Mention found",
                snippet: snippet.substring(0, 200),
                sentiment,
                date: item.pagemap?.metatags?.[0]?.["article:published_time"]
                    ? formatRelativeDate(item.pagemap.metatags[0]["article:published_time"])
                    : `${i + 1}d ago`,
                url: item.link,
                isNew: i < 2,
                engagement: undefined,
            };
        });
    } catch (e) {
        console.error("Google Custom Search error:", e);
        return [];
    }
}

// Fetch Google Places reviews as social mentions
async function fetchGoogleReviewMentions(placeId: string): Promise<SocialMention[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !placeId) return [];

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        if (data.status !== "OK" || !data.result?.reviews) return [];

        return data.result.reviews.slice(0, 5).map((r: any, i: number) => ({
            id: `gpr_${i}_${Date.now()}`,
            source: "Google Reviews",
            sourceIcon: "⭐",
            title: `${r.rating}★ Review by ${r.author_name}`,
            snippet: r.text?.substring(0, 200) || "No text",
            sentiment: r.rating >= 4 ? "positive" as const : r.rating <= 2 ? "negative" as const : "neutral" as const,
            date: r.relative_time_description || "Recently",
            url: r.author_url || "#",
            isNew: i < 2,
            engagement: undefined,
        }));
    } catch (e) {
        console.error("Google Places reviews error:", e);
        return [];
    }
}

// Fetch Yelp reviews as social mentions
async function fetchYelpMentions(businessName: string, city: string, apiKey: string): Promise<SocialMention[]> {
    if (!apiKey) return [];

    try {
        let key = apiKey;
        if (key.toLowerCase().startsWith("bearer ")) key = key.substring(7).trim();

        const searchUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(businessName)}&location=${encodeURIComponent(city)}&limit=1`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } });
        const searchData = await searchRes.json();
        const biz = searchData.businesses?.[0];

        if (!biz) return [];

        const reviewUrl = `https://api.yelp.com/v3/businesses/${biz.id}/reviews?limit=5&sort_by=newest`;
        const reviewRes = await fetch(reviewUrl, { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } });
        const reviewData = await reviewRes.json();

        const mentions: SocialMention[] = [];

        // Add business stats as a mention
        mentions.push({
            id: `yelp_biz_${Date.now()}`,
            source: "Yelp Business",
            sourceIcon: "🔴",
            title: `Yelp Rating: ${biz.rating}★ (${biz.review_count} reviews)`,
            snippet: `${biz.name} is rated ${biz.rating}/5 on Yelp with ${biz.review_count} total reviews. Categories: ${biz.categories?.map((c: any) => c.title).join(", ") || "Restaurant"}`,
            sentiment: biz.rating >= 4 ? "positive" : biz.rating <= 2.5 ? "negative" : "neutral",
            date: "Live",
            url: biz.url,
            isNew: false,
            engagement: { likes: biz.review_count, comments: 0, shares: 0 },
        });

        // Add individual reviews
        if (reviewData.reviews) {
            reviewData.reviews.forEach((r: any, i: number) => {
                mentions.push({
                    id: `yelp_r_${i}_${Date.now()}`,
                    source: "Yelp Reviews",
                    sourceIcon: "🔴",
                    title: `${r.rating}★ Review by ${r.user?.name || "Anonymous"}`,
                    snippet: r.text?.substring(0, 200) || "No text",
                    sentiment: r.rating >= 4 ? "positive" as const : r.rating <= 2 ? "negative" as const : "neutral" as const,
                    date: r.time_created ? formatRelativeDate(r.time_created) : "Recently",
                    url: r.url || "#",
                    isNew: i < 1,
                    engagement: undefined,
                });
            });
        }

        return mentions;
    } catch (e) {
        console.error("Yelp mentions error:", e);
        return [];
    }
}

// Generate demo data based on restaurant location
function getDemoMentions(restaurantName: string, city: string): SocialMention[] {
    const cityShort = city.split(",")[0].trim();
    return [
        {
            id: "demo_1",
            source: `Eater ${cityShort}`,
            sourceIcon: "📰",
            title: `Best New Restaurants in ${cityShort} — ${restaurantName} Makes the List`,
            snippet: `${restaurantName} has quickly become one of the most talked-about dining destinations in ${cityShort}. The innovative menu and stunning ambiance have earned rave reviews from critics and diners alike.`,
            sentiment: "positive",
            date: "2h ago",
            url: "#",
            isNew: true,
            engagement: { likes: 342, comments: 28, shares: 15 },
        },
        {
            id: "demo_2",
            source: "Instagram",
            sourceIcon: "📸",
            title: `@foodie_adventures tagged ${restaurantName} in a story`,
            snippet: `"Just had the most incredible dining experience at ${restaurantName}! The presentation was stunning and every dish was perfectly seasoned. This place is a MUST visit if you're in ${cityShort}!"`,
            sentiment: "positive",
            date: "4h ago",
            url: "#",
            isNew: true,
            engagement: { likes: 1240, comments: 89, shares: 34 },
        },
        {
            id: "demo_3",
            source: `Reddit r/${cityShort.replace(/\s/g, "")}food`,
            sourceIcon: "💬",
            title: `Thread: Best date night spots in ${cityShort}?`,
            snippet: `"${restaurantName} hands down! Went there for our anniversary last week. The lamb chops were incredible, cocktails were perfectly crafted, and the staff went above and beyond. Highly recommend the tasting menu."`,
            sentiment: "positive",
            date: "6h ago",
            url: "#",
            isNew: true,
            engagement: { likes: 156, comments: 42, shares: 8 },
        },
        {
            id: "demo_4",
            source: "Google Trends",
            sourceIcon: "📈",
            title: `Search interest for "${restaurantName}" rising +23%`,
            snippet: `Google search volume for "${restaurantName} ${cityShort}" has increased 23% over the past 7 days. Related searches include "${restaurantName} menu", "${restaurantName} reservations", and "${restaurantName} reviews".`,
            sentiment: "positive",
            date: "1d ago",
            url: "#",
            isNew: false,
            engagement: undefined,
        },
        {
            id: "demo_5",
            source: "TikTok",
            sourceIcon: "🎬",
            title: `Viral video featuring ${restaurantName}: 45K views`,
            snippet: `A TikTok food reviewer posted a walk-through of ${restaurantName}'s signature dishes, garnering over 45,000 views in 24 hours. Comments are overwhelmingly positive with many users tagging friends.`,
            sentiment: "positive",
            date: "1d ago",
            url: "#",
            isNew: false,
            engagement: { likes: 4520, comments: 312, shares: 198 },
        },
        {
            id: "demo_6",
            source: "Yelp Trending",
            sourceIcon: "⭐",
            title: `Now #4 in "Best Dinner in ${cityShort}" category`,
            snippet: `${restaurantName} has climbed to #4 in Yelp's "Best Dinner" category for ${cityShort}. Current rating: 4.5★ with 127 reviews. Notable strengths: food quality, ambiance, and cocktails.`,
            sentiment: "positive",
            date: "2d ago",
            url: "#",
            isNew: false,
            engagement: { likes: 127, comments: 0, shares: 0 },
        },
        {
            id: "demo_7",
            source: "X/Twitter",
            sourceIcon: "🐦",
            title: `Local food blogger @${cityShort.toLowerCase().replace(/\s/g, "")}eats review`,
            snippet: `"Had dinner at ${restaurantName} last night. The service was good but our food took 45 minutes to arrive on a Tuesday. When it did arrive, everything was delicious though. Will definitely go back."`,
            sentiment: "neutral",
            date: "2d ago",
            url: "#",
            isNew: false,
            engagement: { likes: 89, comments: 12, shares: 3 },
        },
        {
            id: "demo_8",
            source: "Google Reviews AI",
            sourceIcon: "📝",
            title: `AI Alert: Wait time feedback pattern detected`,
            snippet: `Restly AI has detected 3 mentions of "wait time" in recent reviews across Google and Yelp. Average sentiment on this topic is neutral. Consider reviewing kitchen workflow during peak Friday/Saturday service.`,
            sentiment: "negative",
            date: "3d ago",
            url: "#",
            isNew: false,
            engagement: undefined,
        },
    ];
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        include: { locations: { where: { isDefault: true }, take: 1 } },
    });

    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const activeLoc = restaurant.locations[0];
    const restaurantName = restaurant.name;
    const city = activeLoc?.city || "San Francisco, CA";
    const isDemoAccount = restaurantName.toLowerCase().includes("sample") || restaurant.email.startsWith("demo");

    // For demo accounts, return demo data customized to restaurant info
    if (isDemoAccount) {
        const mentions = getDemoMentions(
            activeLoc?.name || restaurantName,
            city
        );

        // Calculate brand health metrics
        const positiveCount = mentions.filter(m => m.sentiment === "positive").length;
        const sentimentPercent = Math.round((positiveCount / mentions.length) * 100);

        return NextResponse.json({
            mentions,
            metrics: {
                brandHealth: Math.min(96, sentimentPercent + 5),
                sentimentPercent,
                totalMentions: mentions.length,
                newAlerts: mentions.filter(m => m.isNew).length,
            },
            sources: { google: true, yelp: true, social: true },
            lastScan: new Date().toISOString(),
            mode: "demo",
        });
    }

    // ── Real data for authenticated customers ──
    const allMentions: SocialMention[] = [];

    // 1. Google Custom Search mentions
    const googleMentions = await fetchGoogleMentions(restaurantName, city);
    allMentions.push(...googleMentions);

    // 2. Google Places reviews
    if (activeLoc?.googleBusinessToken) {
        const googleReviews = await fetchGoogleReviewMentions(activeLoc.googleBusinessToken);
        allMentions.push(...googleReviews);
    }

    // 3. Yelp mentions
    if (activeLoc?.yelpApiKey) {
        const yelpMentions = await fetchYelpMentions(restaurantName, city, activeLoc.yelpApiKey);
        allMentions.push(...yelpMentions);
    }

    // Sort by newness (isNew first, then by date order in the array)
    allMentions.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

    // Calculate metrics
    const positiveCount = allMentions.filter(m => m.sentiment === "positive").length;
    const sentimentPercent = allMentions.length > 0 ? Math.round((positiveCount / allMentions.length) * 100) : 0;

    return NextResponse.json({
        mentions: allMentions,
        metrics: {
            brandHealth: allMentions.length > 0 ? Math.min(100, sentimentPercent + 5) : 0,
            sentimentPercent,
            totalMentions: allMentions.length,
            newAlerts: allMentions.filter(m => m.isNew).length,
        },
        sources: {
            google: !!activeLoc?.googleBusinessToken || googleMentions.length > 0,
            yelp: !!activeLoc?.yelpApiKey,
            social: false, // Will be true when social tokens are connected
        },
        lastScan: new Date().toISOString(),
        mode: "live",
    });
}
