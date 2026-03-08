import { NextResponse } from "next/server";
import { getRecentReviews, getReviewStats } from "@/services/reviews";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    const restName = session?.user?.name || "";

    return NextResponse.json({
        stats: getReviewStats(restName),
        reviews: getRecentReviews(restName),
        aiInsight: restName?.toLowerCase() === "meyhouse"
            ? "Your Truffle Burger is highly rated on Google. A recurring Yelp complaint mentions wait times during Friday rush."
            : "Connect your Google and Yelp accounts in settings to start analyzing reviews."
    });
}
