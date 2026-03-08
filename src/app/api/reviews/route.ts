import { NextResponse } from "next/server";
import { getRecentReviews, getReviewStats } from "@/services/reviews";

export async function GET() {
    return NextResponse.json({
        stats: getReviewStats(),
        reviews: getRecentReviews(),
        aiInsight: "Your Truffle Burger is highly rated on Google. A recurring Yelp complaint mentions wait times during Friday rush."
    });
}
