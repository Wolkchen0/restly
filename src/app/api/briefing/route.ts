import { NextResponse } from "next/server";
import { getTodayReservations } from "@/services/opentable";
import { getLowStockItems, getOutOfStockItems, getInventoryStats } from "@/services/toast";

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
    if (outOfStockItems.length > 0) tips.push(`⚠️ ${outOfStockItems.length} ürün stokta kalmamış — acil sipariş gerekebilir.`);
    if (equipmentIssues.some(e => e.severity === "critical")) tips.push("🔧 Pitco Fryer #2 hâlâ arızalı — servis çağırılmalı.");
    if (parseFloat(laborPct) > 33) tips.push(`📊 Labor cost %${laborPct} — hedef %30'un üstünde, vardiya optimizasyonu düşünün.`);
    if (vipGuests.length > 0) tips.push(`⭐ ${vipGuests.length} VIP misafir bu akşam için rezerve — özel hazırlıkları kontrol edin.`);
    if (tips.length === 0) tips.push("✅ Her şey yolunda görünüyor. Harika bir gün olsun!");

    return NextResponse.json({
        greeting,
        shiftLabel: hour < 15 ? "Lunch" : "Dinner",
        timestamp: new Date().toISOString(),
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
