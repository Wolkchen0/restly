import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllRecommendations, getPricingStats, getTopInsights } from "@/services/pricing";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if this is a demo account
    let isDemoAccount = false;
    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { id: session.user.id } });
        if (restaurant) {
            isDemoAccount = restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
        }
    } catch (e) { /* ignore */ }

    if (!isDemoAccount) {
        // Real users: return empty data (no fake recommendations)
        return NextResponse.json({
            recommendations: [],
            stats: { totalItems: 0, avgMargin: 0, underpricedCount: 0, highDemandCount: 0, monthlyRevenueImpact: 0, optimalCount: 0 },
            insights: [],
            isDemo: false,
        });
    }

    const recommendations = getAllRecommendations();
    const stats = getPricingStats();
    const insights = getTopInsights();

    return NextResponse.json({ recommendations, stats, insights, isDemo: true });
}
