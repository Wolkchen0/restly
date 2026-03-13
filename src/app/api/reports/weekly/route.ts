import { NextResponse } from "next/server";
import { getInventoryStats } from "@/services/toast";
import { getTodayReservations, getAllGuests } from "@/services/opentable";

export async function GET() {
    // Generate weekly report data
    const dayOfMonth = new Date().getDate();
    const daily = { revenue: 5867, cogs: 1710, labor: 1903, opex: 500 };
    const weekDays = Math.min(dayOfMonth, 7);
    const stats = getInventoryStats();
    const guests = getAllGuests();
    const reservations = getTodayReservations();

    const weeklyRevenue = daily.revenue * weekDays;
    const weeklyCogs = daily.cogs * weekDays;
    const weeklyLabor = daily.labor * weekDays;
    const weeklyOpex = daily.opex * weekDays;
    const weeklyProfit = weeklyRevenue - weeklyCogs - weeklyLabor - weeklyOpex;
    const profitMargin = ((weeklyProfit / weeklyRevenue) * 100).toFixed(1);
    const laborPct = ((weeklyLabor / weeklyRevenue) * 100).toFixed(1);
    const cogsPct = ((weeklyCogs / weeklyRevenue) * 100).toFixed(1);

    // Staff performance data
    const topPerformers = [
        { name: "Sarah Jenkins", role: "Sr. Server", sales: 8430, tipPct: 22.4 },
        { name: "Lisa Park", role: "Bartender", sales: 7100, tipPct: 24.1 },
        { name: "Marcus Torres", role: "Server", sales: 6480, tipPct: 19.8 },
    ];

    // Menu engineering highlights
    const menuHighlights = [
        { item: "Truffle Burger", category: "Star ⭐", sales: 142, margin: "68%" },
        { item: "Wagyu Tenderloin", category: "Puzzle ❓", sales: 28, margin: "72%" },
        { item: "Lobster Bisque", category: "Cash Cow 🐄", sales: 98, margin: "45%" },
    ];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weekDays + 1);
    const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const report = {
        subject: `Restly Weekly Report — ${formatDate(weekStart)} to ${formatDate(now)}`,
        period: `${formatDate(weekStart)} – ${formatDate(now)} (${weekDays} days)`,
        generatedAt: now.toISOString(),
        financialSummary: {
            revenue: { value: weeklyRevenue, formatted: "$" + weeklyRevenue.toLocaleString(), changeFromLastWeek: "+3.2%" },
            cogs: { value: weeklyCogs, formatted: "$" + weeklyCogs.toLocaleString(), percent: cogsPct + "%" },
            labor: { value: weeklyLabor, formatted: "$" + weeklyLabor.toLocaleString(), percent: laborPct + "%" },
            opex: { value: weeklyOpex, formatted: "$" + weeklyOpex.toLocaleString() },
            netProfit: { value: weeklyProfit, formatted: "$" + weeklyProfit.toLocaleString(), margin: profitMargin + "%" },
            primeCost: ((weeklyCogs + weeklyLabor) / weeklyRevenue * 100).toFixed(1) + "%",
        },
        inventory: {
            totalItems: stats.total,
            inStock: stats.inStock,
            lowStock: stats.lowStock,
            outOfStock: stats.outOfStock,
            totalValue: "$" + stats.totalValue.toLocaleString(),
        },
        staffPerformance: {
            topPerformers,
            totalStaffSales: "$" + topPerformers.reduce((a, s) => a + s.sales, 0).toLocaleString(),
        },
        guests: {
            totalGuests: guests.length,
            vipGuests: guests.filter(g => g.isVip).length,
            avgReservationsPerDay: reservations.length,
        },
        equipmentAlerts: [
            { name: "Hobart Dishwasher", status: "Needs Maintenance", daysPending: 3 },
            { name: "Pitco Fryer #2", status: "Broken", daysPending: 5 },
        ],
        menuHighlights,
        aiRecommendations: [
            "Labor cost %32.4 son 2 haftadır hedefin üstünde. Salı ve Çarşamba öğlen shift'lerinde 1 server azaltmayı düşünün — tahmini haftalık tasarruf: $380.",
            "Wagyu Tenderloin %72 marjla Puzzle kategorisinde — satışı haftada sadece 28. Server'lara $50 upsell bonusu verin, $1,600/hafta ek gelir potansiyeli.",
            "3 ürün out of stock — Black Truffle, Crème Brûlée Mix, Aperol. Bu 3 ürün 4 menü itemını etkiliyor.",
            "Pitco Fryer #2 arızası 5. gününde. Garanti süresi dolmuş. Yeni fryer maliyeti vs. tamir maliyetini değerlendirin.",
        ],
    };

    return NextResponse.json(report);
}

export async function POST(req: Request) {
    // In production: send the report via email using the configured email service
    const { email } = await req.json().catch(() => ({ email: "" }));

    // Generate the same report
    const reportRes = await GET();
    const report = await reportRes.json();

    // For demo: simulate sending email
    console.log(`📧 Weekly report would be sent to: ${email || "owner@restaurant.com"}`);

    return NextResponse.json({
        success: true,
        message: `Weekly report sent to ${email || "owner@restaurant.com"}`,
        report,
    });
}
