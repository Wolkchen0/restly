import { NextResponse } from "next/server";
import { getTodayReservations } from "@/services/opentable";
import { getLowStockItems, getOutOfStockItems, getInventoryStats } from "@/services/toast";

// Weather intelligence (demo data — swap with OpenWeatherMap API in production)
function getWeatherData() {
    const hour = new Date().getHours();
    // Simulate realistic weather patterns
    const scenarios = [
        { condition: "Sunny", icon: "☀️", temp: 72, feelsLike: 74, humidity: 35, wind: 8, rainChance: 5, forecast: "Clear skies all day" },
        { condition: "Partly Cloudy", icon: "⛅", temp: 65, feelsLike: 63, humidity: 55, wind: 12, rainChance: 20, forecast: "Clouds building in the afternoon" },
        { condition: "Rainy", icon: "🌧️", temp: 58, feelsLike: 54, humidity: 82, wind: 15, rainChance: 85, forecast: "Rain expected through evening" },
        { condition: "Overcast", icon: "☁️", temp: 61, feelsLike: 59, humidity: 65, wind: 10, rainChance: 40, forecast: "Cloudy with possible light showers" },
    ];
    // Use day of month to cycle through scenarios for demo
    const dayIndex = new Date().getDate() % scenarios.length;
    const weather = scenarios[dayIndex];

    // AI restaurant-specific weather insights
    const insights: string[] = [];
    if (weather.rainChance > 60) {
        insights.push("🌧️ Yağmur bekleniyor — dış mekan müşterileri azalabilir, iç mekana ekstra masa hazırlayın.");
        insights.push("☂️ Delivery siparişleri artabilir — mutfağı hazırlayın.");
    } else if (weather.temp > 75) {
        insights.push("🌡️ Sıcak bir gün — soğuk içecek ve salata talebinde artış bekleniyor.");
        insights.push("🍹 Bar'da frozen cocktail ve açık bira kampanyası düşünün.");
    } else if (weather.condition === "Sunny" && weather.temp > 65) {
        insights.push("☀️ Harika bir terası/patio günü! Dış mekan masalarını hazırlayın.");
        insights.push("🥗 Hafif ve taze menü öğeleri bugün popüler olacak.");
    } else if (weather.temp < 55) {
        insights.push("❄️ Soğuk hava — sıcak çorbalar ve comfort food talebinde artış bekleniyor.");
        insights.push("☕ Sıcak içecek çeşitlerini öne çıkarın.");
    } else {
        insights.push("🌤️ Güzel bir gün — dengeli müşteri trafiği bekleniyor.");
    }

    return { ...weather, insights };
}

export async function GET() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Günaydın ☀️" : hour < 17 ? "İyi günler 👋" : "İyi akşamlar 🌙";

    // ── Reservations ──
    const reservations = getTodayReservations();
    const totalCovers = reservations.reduce((acc, r) => acc + r.partySize, 0);
    const vipReservations = reservations.filter(r => r.isVip);

    // ── Inventory ──
    const lowStockItems = getLowStockItems();
    const outOfStockItems = getOutOfStockItems();
    const stats = getInventoryStats();

    // ── Weather ──
    const weather = getWeatherData();

    // ── Financial (yesterday summary) ──
    const daily = { revenue: 5867, cogs: 1710, labor: 1903, opex: 500 };
    const netProfit = daily.revenue - daily.cogs - daily.labor - daily.opex;
    const profitMargin = ((netProfit / daily.revenue) * 100).toFixed(1);
    const laborPct = ((daily.labor / daily.revenue) * 100).toFixed(1);

    // ── Equipment alerts ──
    const equipmentIssues = [
        { name: "Hobart Dishwasher", status: "Needs Maintenance", severity: "warning" as const },
        { name: "Pitco Fryer #2", status: "Broken", severity: "critical" as const },
    ];

    // ── Staff on duty ──
    const todayStaff = hour < 15
        ? { shift: "Lunch", members: ["Chef Antonio", "Mike Rodriguez", "Sarah Jenkins", "David Chen"], count: 4 }
        : { shift: "Dinner", members: ["Chef Antonio", "Rosa Hernandez", "Jake Thompson", "Lisa Park", "Marcus Torres", "Emily Watson", "Carlos Ramirez"], count: 7 };

    // ── VIP guests tonight ──
    const vipGuests = vipReservations.map(r => ({
        name: r.guestName,
        time: r.time,
        partySize: r.partySize,
        notes: r.notes,
    }));

    // ── AI smart tip (contextual) ──
    const tips: string[] = [];
    // Weather-based tips
    tips.push(...weather.insights);
    if (outOfStockItems.length > 0) tips.push(`⚠️ ${outOfStockItems.length} ürün stokta kalmamış — acil sipariş gerekebilir.`);
    if (equipmentIssues.some(e => e.severity === "critical")) tips.push("🔧 Pitco Fryer #2 hâlâ arızalı — servis çağırılmalı.");
    if (parseFloat(laborPct) > 33) tips.push(`📊 Labor cost %${laborPct} — hedef %30'un üstünde, vardiya optimizasyonu düşünün.`);
    if (vipGuests.length > 0) tips.push(`⭐ ${vipGuests.length} VIP misafir bu akşam için rezerve — özel hazırlıkları kontrol edin.`);

    return NextResponse.json({
        greeting,
        shiftLabel: hour < 15 ? "Lunch" : "Dinner",
        timestamp: new Date().toISOString(),
        weather: {
            condition: weather.condition,
            icon: weather.icon,
            temp: weather.temp,
            feelsLike: weather.feelsLike,
            humidity: weather.humidity,
            wind: weather.wind,
            rainChance: weather.rainChance,
            forecast: weather.forecast,
        },
        kpis: {
            reservations: reservations.length,
            covers: totalCovers,
            vipCount: vipReservations.length,
            yesterdayRevenue: "$" + daily.revenue.toLocaleString(),
            yesterdayProfit: "$" + netProfit.toLocaleString(),
            profitMargin: profitMargin + "%",
            laborPercent: laborPct + "%",
        },
        vipGuests,
        alerts: {
            outOfStock: outOfStockItems.length,
            lowStock: lowStockItems.length,
            equipmentIssues: equipmentIssues.length,
            criticalItems: [
                ...outOfStockItems.slice(0, 3).map(i => `🔴 ${i.name} — out of stock`),
                ...equipmentIssues.filter(e => e.severity === "critical").map(e => `🔧 ${e.name} — ${e.status}`),
            ],
        },
        staff: todayStaff,
        aiTips: tips,
    });
}

