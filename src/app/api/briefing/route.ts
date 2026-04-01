import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayReservations } from "@/services/opentable";
import { getLowStockItems, getOutOfStockItems, getInventoryStats } from "@/services/toast";

// ── Real Weather via OpenWeatherMap API ──
interface WeatherData {
    condition: string;
    icon: string;
    temp: number;
    feelsLike: number;
    humidity: number;
    wind: number;
    rainChance: number;
    forecast: string;
}

async function fetchRealWeather(city: string): Promise<WeatherData | null> {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
        const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
        if (!res.ok) return null;
        const data = await res.json();

        const main = data.weather?.[0];
        const conditionId = main?.id || 800;
        const condition = main?.main || "Clear";
        const description = main?.description || "clear sky";

        // Map OpenWeatherMap condition codes to icons
        let icon = "☀️";
        if (conditionId >= 200 && conditionId < 300) icon = "⛈️";      // Thunderstorm
        else if (conditionId >= 300 && conditionId < 400) icon = "🌦️";  // Drizzle
        else if (conditionId >= 500 && conditionId < 600) icon = "🌧️";  // Rain
        else if (conditionId >= 600 && conditionId < 700) icon = "❄️";   // Snow
        else if (conditionId >= 700 && conditionId < 800) icon = "🌫️";  // Fog/Mist
        else if (conditionId === 800) icon = "☀️";                       // Clear
        else if (conditionId === 801) icon = "🌤️";                      // Few clouds
        else if (conditionId === 802) icon = "⛅";                       // Scattered clouds
        else if (conditionId >= 803) icon = "☁️";                        // Overcast

        // Estimate rain chance from clouds + conditions
        let rainChance = 0;
        if (conditionId >= 200 && conditionId < 600) rainChance = 80;
        else if (data.clouds?.all > 80) rainChance = 40;
        else if (data.clouds?.all > 50) rainChance = 20;
        else rainChance = 5;

        // Build forecast string
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
        const forecast = capitalize(description);

        return {
            condition,
            icon,
            temp: Math.round(data.main?.temp || 65),
            feelsLike: Math.round(data.main?.feels_like || 63),
            humidity: data.main?.humidity || 50,
            wind: Math.round(data.wind?.speed || 5),
            rainChance,
            forecast,
        };
    } catch (err) {
        console.error("Weather fetch error:", err);
        return null;
    }
}

function getFallbackWeather(): WeatherData {
    const scenarios: WeatherData[] = [
        { condition: "Sunny", icon: "☀️", temp: 72, feelsLike: 74, humidity: 35, wind: 8, rainChance: 5, forecast: "Clear skies all day" },
        { condition: "Partly Cloudy", icon: "⛅", temp: 65, feelsLike: 63, humidity: 55, wind: 12, rainChance: 20, forecast: "Clouds building in the afternoon" },
        { condition: "Rainy", icon: "🌧️", temp: 58, feelsLike: 54, humidity: 82, wind: 15, rainChance: 85, forecast: "Rain expected through evening" },
        { condition: "Overcast", icon: "☁️", temp: 61, feelsLike: 59, humidity: 65, wind: 10, rainChance: 40, forecast: "Cloudy with possible light showers" },
    ];
    return scenarios[new Date().getDate() % scenarios.length];
}

function getWeatherInsights(weather: WeatherData): string[] {
    const insights: string[] = [];
    if (weather.rainChance > 60) {
        insights.push("🌧️ Rain expected — prepare for fewer patio guests, increase indoor seating.");
        insights.push("☂️ Delivery orders may spike — alert the kitchen.");
    } else if (weather.temp > 85) {
        insights.push("🌡️ Very hot day — expect higher demand for cold drinks and salads.");
        insights.push("🍹 Consider promoting frozen cocktails and draft beers.");
    } else if (weather.temp > 65 && weather.rainChance < 30) {
        insights.push("☀️ Great patio weather! Set up outdoor tables.");
        insights.push("🥗 Light and fresh menu items will be popular today.");
    } else if (weather.temp < 50) {
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

    // Get user info + location
    let isDemoAccount = true;
    let locationCity = "";
    if (session?.user?.id) {
        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: session.user.id },
                select: { name: true, email: true, locations: { where: { isDefault: true }, select: { city: true }, take: 1 } },
            });
            isDemoAccount = !restaurant || restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
            locationCity = restaurant?.locations?.[0]?.city || "";
        } catch { /* default to demo */ }
    }

    // Fetch real weather (for both demo and real accounts)
    let weather: WeatherData;
    const realWeather = await fetchRealWeather(locationCity || "San Francisco");
    weather = realWeather || getFallbackWeather();

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
        const tips = getWeatherInsights(weather);
        if (outOfStockItems.length > 0) tips.push(`⚠️ ${outOfStockItems.length} items out of stock — order urgently.`);
        if (equipmentIssues.some(e => e.severity === "critical")) tips.push("🔧 Pitco Fryer #2 is still broken — call service.");
        if (parseFloat(laborPct) > 33) tips.push(`📊 Labor cost ${laborPct}% — above 30% target, consider shift optimization.`);
        if (vipGuests.length > 0) tips.push(`⭐ ${vipGuests.length} VIP guests tonight — review special preparations.`);

        return NextResponse.json({
            greeting, shiftLabel: hour < 15 ? "Lunch" : "Dinner", timestamp: new Date().toISOString(),
            weather,
            kpis: { reservations: reservations.length, covers: totalCovers, vipCount: vipReservations.length, yesterdayRevenue: "$" + daily.revenue.toLocaleString(), yesterdayProfit: "$" + netProfit.toLocaleString(), profitMargin: profitMargin + "%", laborPercent: laborPct + "%" },
            vipGuests,
            alerts: { outOfStock: outOfStockItems.length, lowStock: lowStockItems.length, equipmentIssues: equipmentIssues.length, criticalItems: [...outOfStockItems.slice(0, 3).map(i => `🔴 ${i.name} — out of stock`), ...equipmentIssues.filter(e => e.severity === "critical").map(e => `🔧 ${e.name} — ${e.status}`)] },
            staff: todayStaff, aiTips: tips,
        });
    }

    // ── REAL ACCOUNT: return real weather + empty states for POS data ──
    const tips = getWeatherInsights(weather);

    return NextResponse.json({
        greeting,
        shiftLabel: hour < 15 ? "Lunch" : "Dinner",
        timestamp: new Date().toISOString(),
        weather,
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
