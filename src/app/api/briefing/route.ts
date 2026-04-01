import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayReservations } from "@/services/opentable";
import { getLowStockItems, getOutOfStockItems, getInventoryStats } from "@/services/toast";

// Weather intelligence (demo data — swap with OpenWeatherMap API in production)
function getWeatherData() {
    const scenarios = [
        { condition: "Sunny", icon: "☀️", temp: 72, feelsLike: 74, humidity: 35, wind: 8, rainChance: 5, forecast: "Clear skies all day" },
        { condition: "Partly Cloudy", icon: "⛅", temp: 65, feelsLike: 63, humidity: 55, wind: 12, rainChance: 20, forecast: "Clouds building in the afternoon" },
        { condition: "Rainy", icon: "🌧️", temp: 58, feelsLike: 54, humidity: 82, wind: 15, rainChance: 85, forecast: "Rain expected through evening" },
        { condition: "Overcast", icon: "☁️", temp: 61, feelsLike: 59, humidity: 65, wind: 10, rainChance: 40, forecast: "Cloudy with possible light showers" },
    ];
    const dayIndex = new Date().getDate() % scenarios.length;
    return scenarios[dayIndex];
}

function getDemoWeatherInsights(weather: any): string[] {
    const insights: string[] = [];
    if (weather.rainChance > 60) {
        insights.push("🌧️ Rain expected — prepare for fewer patio guests, increase indoor seating.");
        insights.push("☂️ Delivery orders may spike — alert the kitchen.");
    } else if (weather.temp > 75) {
        insights.push("🌡️ Hot day — expect higher demand for cold drinks and salads.");
        insights.push("🍹 Consider promoting frozen cocktails and draft beers.");
    } else if (weather.condition === "Sunny" && weather.temp > 65) {
        insights.push("☀️ Great patio weather! Set up outdoor tables.");
        insights.push("🥗 Light and fresh menu items will be popular today.");
    } else if (weather.temp < 55) {
        insights.push("❄️ Cold weather — expect higher demand for soups and comfort food.");
        insights.push("☕ Promote hot beverages.");
    } else {
        insights.push("🌤️ Pleasant weather — expect balanced guest traffic.");
    }
    return insights;
}

export async function GET() {
    const session = await auth();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning ☀️" : hour < 17 ? "Good afternoon 👋" : "Good evening 🌙";

    // Check if demo account
    let isDemoAccount = true;
    if (session?.user?.id) {
        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: session.user.id },
                select: { name: true, email: true },
            });
            isDemoAccount = !restaurant || restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
        } catch { /* default to demo */ }
    }

    const weather = getWeatherData();

    // ── DEMO ACCOUNT: return full demo data ──
    if (isDemoAccount) {
        const reservations = getTodayReservations();
        const totalCovers = reservations.reduce((acc, r) => acc + r.partySize, 0);
        const vipReservations = reservations.filter(r => r.isVip);
        const lowStockItems = getLowStockItems();
        const outOfStockItems = getOutOfStockItems();
        const daily = { revenue: 5867, cogs: 1710, labor: 1903, opex: 500 };
        const netProfit = daily.revenue - daily.cogs - daily.labor - daily.opex;
        const profitMargin = ((netProfit / daily.revenue) * 100).toFixed(1);
        const laborPct = ((daily.labor / daily.revenue) * 100).toFixed(1);
        const equipmentIssues = [
            { name: "Hobart Dishwasher", status: "Needs Maintenance", severity: "warning" as const },
            { name: "Pitco Fryer #2", status: "Broken", severity: "critical" as const },
        ];
        const todayStaff = hour < 15
            ? { shift: "Lunch", members: ["Chef Antonio", "Mike Rodriguez", "Sarah Jenkins", "David Chen"], count: 4 }
            : { shift: "Dinner", members: ["Chef Antonio", "Rosa Hernandez", "Jake Thompson", "Lisa Park", "Marcus Torres", "Emily Watson", "Carlos Ramirez"], count: 7 };
        const vipGuests = vipReservations.map(r => ({
            name: r.guestName, time: r.time, partySize: r.partySize, notes: r.notes,
        }));
        const tips = getDemoWeatherInsights(weather);
        if (outOfStockItems.length > 0) tips.push(`⚠️ ${outOfStockItems.length} items out of stock — order urgently.`);
        if (equipmentIssues.some(e => e.severity === "critical")) tips.push("🔧 Pitco Fryer #2 is still broken — call service.");
        if (parseFloat(laborPct) > 33) tips.push(`📊 Labor cost ${laborPct}% — above 30% target, consider shift optimization.`);
        if (vipGuests.length > 0) tips.push(`⭐ ${vipGuests.length} VIP guests tonight — review special preparations.`);

        return NextResponse.json({
            greeting, shiftLabel: hour < 15 ? "Lunch" : "Dinner", timestamp: new Date().toISOString(),
            weather: { condition: weather.condition, icon: weather.icon, temp: weather.temp, feelsLike: weather.feelsLike, humidity: weather.humidity, wind: weather.wind, rainChance: weather.rainChance, forecast: weather.forecast },
            kpis: { reservations: reservations.length, covers: totalCovers, vipCount: vipReservations.length, yesterdayRevenue: "$" + daily.revenue.toLocaleString(), yesterdayProfit: "$" + netProfit.toLocaleString(), profitMargin: profitMargin + "%", laborPercent: laborPct + "%" },
            vipGuests,
            alerts: { outOfStock: outOfStockItems.length, lowStock: lowStockItems.length, equipmentIssues: equipmentIssues.length, criticalItems: [...outOfStockItems.slice(0, 3).map(i => `🔴 ${i.name} — out of stock`), ...equipmentIssues.filter(e => e.severity === "critical").map(e => `🔧 ${e.name} — ${e.status}`)] },
            staff: todayStaff, aiTips: tips,
        });
    }

    // ── REAL ACCOUNT: return only real data or empty states ──
    const tips = getDemoWeatherInsights(weather);

    return NextResponse.json({
        greeting,
        shiftLabel: hour < 15 ? "Lunch" : "Dinner",
        timestamp: new Date().toISOString(),
        weather: { condition: weather.condition, icon: weather.icon, temp: weather.temp, feelsLike: weather.feelsLike, humidity: weather.humidity, wind: weather.wind, rainChance: weather.rainChance, forecast: weather.forecast },
        kpis: {
            reservations: 0,
            covers: 0,
            vipCount: 0,
            yesterdayRevenue: "—",
            yesterdayProfit: "—",
            profitMargin: "—",
            laborPercent: "—",
        },
        vipGuests: [],
        alerts: { outOfStock: 0, lowStock: 0, equipmentIssues: 0, criticalItems: [] },
        staff: { shift: hour < 15 ? "Lunch" : "Dinner", members: [], count: 0 },
        aiTips: [
            "💡 Connect your POS system in Settings to see real-time revenue, reservations, and staff data.",
            "📥 Import your guest list from OpenTable to enable VIP tracking and guest intelligence.",
            ...tips,
        ],
    });
}
