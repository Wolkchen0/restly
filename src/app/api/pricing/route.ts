import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllRecommendations, getPricingStats, getTopInsights } from "@/services/pricing";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const recommendations = getAllRecommendations();
    const stats = getPricingStats();
    const insights = getTopInsights();

    return NextResponse.json({ recommendations, stats, insights });
}
