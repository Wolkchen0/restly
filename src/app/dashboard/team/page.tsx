"use client";
import { useState, useEffect } from "react";
import { useIsDemo } from "@/lib/use-demo";

const DEMO_STAFF_TODAY = [
    { rank: 1, name: "Lisa Park", role: "Bartender", daysWorked: 1, totalSales: 1420, foodSales: 280, drinkSales: 1140, checkAvg: 102, turnTime: 28, tipPct: 26.5, trend: "up", topItems: ["Espresso Martini", "Negroni"], upsellRate: 82 },
    { rank: 2, name: "Sarah Jenkins", role: "Sr. Server", daysWorked: 1, totalSales: 1180, foodSales: 820, drinkSales: 360, checkAvg: 90, turnTime: 40, tipPct: 23.0, trend: "up", topItems: ["Truffle Burger", "Lobster Risotto"], upsellRate: 72 },
    { rank: 3, name: "Marcus Torres", role: "Server", daysWorked: 1, totalSales: 960, foodSales: 710, drinkSales: 250, checkAvg: 74, turnTime: 38, tipPct: 20.5, trend: "up", topItems: ["NY Strip", "House Red"], upsellRate: 58 },
    { rank: 4, name: "David Chen", role: "Server", daysWorked: 1, totalSales: 620, foodSales: 490, drinkSales: 130, checkAvg: 62, turnTime: 52, tipPct: 16.8, trend: "flat", topItems: ["Avocado Toast", "Iced Tea"], upsellRate: 25 },
    { rank: 5, name: "Emily Watson", role: "Server", daysWorked: 1, totalSales: 480, foodSales: 360, drinkSales: 120, checkAvg: 60, turnTime: 55, tipPct: 15.2, trend: "down", topItems: ["Club Sandwich", "Lemonade"], upsellRate: 20 },
];

const DEMO_STAFF_MONTH = [
    { rank: 1, name: "Sarah Jenkins", role: "Sr. Server", daysWorked: 21, totalSales: 18500, foodSales: 12400, drinkSales: 6100, checkAvg: 85, turnTime: 45, tipPct: 22.4, trend: "up", topItems: ["Truffle Burger", "Lobster Risotto"], upsellRate: 68 },
    { rank: 2, name: "Marcus Torres", role: "Server", daysWorked: 18, totalSales: 16200, foodSales: 11800, drinkSales: 4400, checkAvg: 72, turnTime: 42, tipPct: 19.8, trend: "up", topItems: ["NY Strip", "Caesar Salad"], upsellRate: 52 },
    { rank: 3, name: "Lisa Park", role: "Bartender", daysWorked: 20, totalSales: 14800, foodSales: 3200, drinkSales: 11600, checkAvg: 95, turnTime: 30, tipPct: 24.1, trend: "flat", topItems: ["Spicy Marg", "Old Fashioned"], upsellRate: 74 },
    { rank: 4, name: "David Chen", role: "Server", daysWorked: 15, totalSales: 12100, foodSales: 9200, drinkSales: 2900, checkAvg: 68, turnTime: 48, tipPct: 18.5, trend: "down", topItems: ["Avocado Toast", "House Salad"], upsellRate: 31 },
    { rank: 5, name: "Emily Watson", role: "Server", daysWorked: 14, totalSales: 9400, foodSales: 6800, drinkSales: 2600, checkAvg: 65, turnTime: 50, tipPct: 17.2, trend: "flat", topItems: ["Club Sandwich", "Soup of Day"], upsellRate: 28 },
];

const DEMO_STAFF_YEAR = [
    { rank: 1, name: "Marcus Torres", role: "Server", daysWorked: 214, totalSales: 212000, foodSales: 152400, drinkSales: 59600, checkAvg: 68, turnTime: 44, tipPct: 19.2, trend: "up", topItems: ["NY Strip", "Pan-Seared Duck"], upsellRate: 55 },
    { rank: 2, name: "Sarah Jenkins", role: "Sr. Server", daysWorked: 210, totalSales: 208500, foodSales: 139700, drinkSales: 68800, checkAvg: 82, turnTime: 46, tipPct: 21.8, trend: "up", topItems: ["Truffle Burger", "Wine Flights"], upsellRate: 70 },
    { rank: 3, name: "Lisa Park", role: "Bartender", daysWorked: 220, totalSales: 185000, foodSales: 37000, drinkSales: 148000, checkAvg: 92, turnTime: 32, tipPct: 23.5, trend: "up", topItems: ["Craft Cocktails", "Premium Wines"], upsellRate: 76 },
    { rank: 4, name: "David Chen", role: "Server", daysWorked: 185, totalSales: 145000, foodSales: 113100, drinkSales: 31900, checkAvg: 65, turnTime: 47, tipPct: 18.2, trend: "flat", topItems: ["Avocado Toast", "Grilled Chicken"], upsellRate: 33 },
    { rank: 5, name: "Emily Watson", role: "Server", daysWorked: 160, totalSales: 110000, foodSales: 82500, drinkSales: 27500, checkAvg: 62, turnTime: 49, tipPct: 16.8, trend: "down", topItems: ["Club Sandwich", "House Wine"], upsellRate: 26 },
];

type Period = "today" | "yesterday" | "week" | "month" | "year" | "custom";

function getAIRecommendation(staff: any, allStaff: any[]) {
    const firstName = staff.name.split(" ")[0];
    const avgSales = allStaff.reduce((a: number, s: any) => a + s.totalSales, 0) / allStaff.length;
    const avgCheck = allStaff.reduce((a: number, s: any) => a + s.checkAvg, 0) / allStaff.length;
    const avgTip = allStaff.reduce((a: number, s: any) => a + s.tipPct, 0) / allStaff.length;
    const drinkPct = Math.round((staff.drinkSales / staff.totalSales) * 100);
    const foodPct = 100 - drinkPct;

    if (staff.role === "Bartender") {
        if (staff.tipPct > avgTip + 2) {
            return `${firstName} leads in tip percentage at ${staff.tipPct}% (floor avg: ${avgTip.toFixed(1)}%). Drink sales are ${drinkPct}% of total revenue ($${staff.drinkSales.toLocaleString()}). Top sellers: ${staff.topItems.join(", ")}. Recommend scheduling ${firstName} on Fri/Sat nights for max cocktail revenue.`;
        }
        return `${firstName}'s drink-to-food ratio is ${drinkPct}/${foodPct}. Consider cross-training on food upsells — current upsell rate is ${staff.upsellRate}%. Adding appetizer pairings with cocktails could lift check avg from $${staff.checkAvg} toward $${Math.round(staff.checkAvg * 1.15)}.`;
    }
    if (staff.totalSales > avgSales * 1.1 && staff.upsellRate > 50) {
        return `${firstName} is outperforming the floor average by ${Math.round(((staff.totalSales - avgSales) / avgSales) * 100)}%. Food: $${staff.foodSales.toLocaleString()} (${foodPct}%), Drinks: $${staff.drinkSales.toLocaleString()} (${drinkPct}%). Upsell rate: ${staff.upsellRate}%. Schedule on high-cover nights.`;
    }
    if (staff.trend === "down") {
        return `${firstName}'s performance is trending downward. Check avg ($${staff.checkAvg}) is ${Math.round(avgCheck - staff.checkAvg)} below floor average. Drink sales only $${staff.drinkSales.toLocaleString()} (${drinkPct}%). Recommend wine/cocktail pairing training and a shadow shift with a top performer.`;
    }
    if (staff.upsellRate < 35) {
        return `${firstName} has a ${staff.upsellRate}% upsell rate — well below 50% target. Mostly selling ${staff.topItems.join(" and ")}. Drink contribution is only ${drinkPct}%. Training on beverage pairings could increase check avg from $${staff.checkAvg} to ~$${Math.round(staff.checkAvg * 1.2)}.`;
    }
    return `${firstName} is performing at floor average. Food: $${staff.foodSales.toLocaleString()} (${foodPct}%), Drinks: $${staff.drinkSales.toLocaleString()} (${drinkPct}%). Turn time: ${staff.turnTime}min. Focus on increasing drink attachment from ${staff.upsellRate}% to 50%+.`;
}

function getPerformanceBreakdown(staff: any, allStaff: any[]) {
    const avgCheck = allStaff.reduce((a: number, s: any) => a + s.checkAvg, 0) / allStaff.length;
    const avgTip = allStaff.reduce((a: number, s: any) => a + s.tipPct, 0) / allStaff.length;
    const avgUpsell = allStaff.reduce((a: number, s: any) => a + s.upsellRate, 0) / allStaff.length;
    const avgDrinkPct = allStaff.reduce((a: number, s: any) => a + (s.drinkSales / s.totalSales) * 100, 0) / allStaff.length;
    const drinkPct = (staff.drinkSales / staff.totalSales) * 100;

    const strengths: string[] = [];
    const opportunities: string[] = [];
    const focusAreas: string[] = [];

    if (staff.checkAvg > avgCheck) strengths.push(`Above-average check at $${staff.checkAvg} (avg: $${Math.round(avgCheck)})`);
    if (staff.tipPct > avgTip) strengths.push(`Strong tip % at ${staff.tipPct}% (avg: ${avgTip.toFixed(1)}%)`);
    if (staff.upsellRate > avgUpsell) strengths.push(`Good upsell rate: ${staff.upsellRate}% (avg: ${Math.round(avgUpsell)}%)`);
    if (staff.totalSales > allStaff.reduce((a: number, s: any) => a + s.totalSales, 0) / allStaff.length * 1.05)
        strengths.push(`Solid total sales: $${staff.totalSales.toLocaleString()}`);

    if (drinkPct < avgDrinkPct - 5) opportunities.push(`Bev mix ${Math.round(drinkPct)}% is below avg ${Math.round(avgDrinkPct)}% — recommend pairings`);
    if (staff.upsellRate < avgUpsell) opportunities.push(`Upsell rate ${staff.upsellRate}% below avg ${Math.round(avgUpsell)}%`);
    if (staff.turnTime > 45) opportunities.push(`Turn time ${staff.turnTime}m — faster table turns = more covers`);

    if (staff.trend === "down") focusAreas.push("Performance trending downward — needs coaching");
    if (staff.tipPct < avgTip - 2) focusAreas.push(`Tips ${staff.tipPct}% below avg — work on guest engagement`);
    if (drinkPct < 20) focusAreas.push("Prioritise beverage-first greetings: offer cocktails on arrival");
    if (staff.upsellRate < 30) focusAreas.push("Track weekly bev mix trends to measure improvement");

    if (strengths.length === 0) strengths.push("Consistent attendance");
    if (opportunities.length === 0) opportunities.push("Continue current trajectory");
    if (focusAreas.length === 0) focusAreas.push("Maintain strong fundamentals");

    // Calculate overall score (weighted KPI)
    const checkScore = Math.min(25, (staff.checkAvg / avgCheck) * 20);           // 20% weight
    const bevGuestScore = Math.min(37.5, (drinkPct / avgDrinkPct) * 30);          // 30% weight
    const bevMixScore = Math.min(37.5, (drinkPct / Math.max(avgDrinkPct, 1)) * 30); // 30% weight
    const salesDayScore = Math.min(25, ((staff.totalSales / Math.max(staff.daysWorked, 1)) / (allStaff.reduce((a: number, s: any) => a + s.totalSales / Math.max(s.daysWorked, 1), 0) / allStaff.length)) * 20); // 20% weight
    const overallScore = Math.min(100, checkScore + bevGuestScore + bevMixScore + salesDayScore);

    return { strengths, opportunities, focusAreas, overallScore };
}

// Generate day-specific data with deterministic variations
function getSeededData(base: any[], seed: number, dayScale = 1) {
    const vary = (val: number, pct: number) => {
        const h = ((seed * 1237 + Math.round(val * 31)) % 100) / 100;
        return Math.round(val * dayScale * (1 + (h - 0.5) * pct * 2));
    };
    return base.map((s, i) => ({
        ...s,
        rank: i + 1,
        daysWorked: Math.max(1, vary(s.daysWorked, 0.15)),
        totalSales: vary(s.totalSales, 0.2),
        foodSales: vary(s.foodSales, 0.2),
        drinkSales: vary(s.drinkSales, 0.2),
        checkAvg: vary(s.checkAvg, 0.1),
        turnTime: vary(s.turnTime, 0.08),
        tipPct: Math.round((s.tipPct + ((seed * (i + 1) * 17) % 40 - 20) / 10) * 10) / 10,
        upsellRate: Math.min(100, vary(s.upsellRate, 0.15)),
    })).sort((a, b) => b.totalSales - a.totalSales).map((s, i) => ({ ...s, rank: i + 1 }));
}

export default function TeamPerformancePage() {
    const [period, setPeriod] = useState<Period>("today");
    const isDemo = useIsDemo();
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [restaurantName, setRestaurantName] = useState("Restaurant");
    const [emailModal, setEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [emailSending, setEmailSending] = useState(false);

    // Real POS data state
    const [posData, setPosData] = useState<any[] | null>(null);
    const [posConnected, setPosConnected] = useState<boolean | null>(null);
    const [posLoading, setPosLoading] = useState(false);
    const [posError, setPosError] = useState("");

    const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const showToast = (text: string, type: "success" | "error" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 4000);
    };

    useEffect(() => {
        fetch("/api/locations").then(r => r.json()).then(d => {
            setRestaurantName(d.restaurantName || "Restaurant");
        }).catch(() => {});
    }, []);

    // Fetch real POS data for non-demo accounts
    useEffect(() => {
        if (isDemo === true) return; // demo uses hardcoded data
        if (isDemo === null) return; // still loading demo check

        setPosLoading(true);
        setPosError("");
        const params = new URLSearchParams({ period });
        if (period === "custom") params.set("date", selectedDate);

        fetch(`/api/team/performance?${params}`)
            .then(r => r.json())
            .then(d => {
                setPosConnected(d.connected);
                if (d.connected && d.staff) {
                    setPosData(d.staff);
                } else if (d.connected && d.error) {
                    setPosError(d.error);
                    setPosData([]);
                } else {
                    setPosData(null);
                }
            })
            .catch(() => setPosError("Failed to load staff data"))
            .finally(() => setPosLoading(false));
    }, [isDemo, period, selectedDate]);

    const handleExportStaff = () => {
        import("@/utils/pdf-export").then(({ exportToPDF }) => {
            exportToPDF({
                title: `Staff Performance — ${period.charAt(0).toUpperCase() + period.slice(1)}`,
                subtitle: "Restly AI Restaurant Manager",
                headers: ["Rank", "Name", "Role", "Shifts", "Total Sales", "Check Avg", "Turn Time", "Tip %"],
                rows: data.map(s => [s.rank, s.name, s.role, s.daysWorked, `$${s.totalSales.toLocaleString()}`, `$${s.checkAvg}`, `${s.turnTime}m`, `${s.tipPct}%`]),
                orientation: "landscape",
                fileName: `Staff_Leaderboard_${period}_${new Date().toISOString().split('T')[0]}`,
            });
            showToast("📥 Staff PDF exported!");
        });
    };

    const handleEmailReport = async (staff: any) => {
        if (!emailTo.trim()) return;
        setEmailSending(true);
        const perf = getPerformanceBreakdown(staff, data);
        try {
            const res = await fetch("/api/team/report-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    staffName: staff.name,
                    role: staff.role,
                    email: emailTo,
                    restaurantName,
                    period: periodLabel,
                    metrics: {
                        totalSales: staff.totalSales,
                        foodSales: staff.foodSales,
                        drinkSales: staff.drinkSales,
                        checkAvg: staff.checkAvg,
                        turnTime: staff.turnTime,
                        tipPct: staff.tipPct,
                        upsellRate: staff.upsellRate,
                        daysWorked: staff.daysWorked,
                        rank: staff.rank,
                        totalStaff: data.length,
                        overallScore: perf.overallScore,
                        strengths: perf.strengths,
                        opportunities: perf.opportunities,
                        focusAreas: perf.focusAreas,
                    },
                }),
            });
            const d = await res.json();
            if (res.ok) {
                showToast(`📧 Report sent to ${emailTo}!`);
                setEmailModal(false);
                setEmailTo("");
            } else {
                showToast(d.error || "Failed to send email", "error");
            }
        } catch {
            showToast("Network error", "error");
        }
        setEmailSending(false);
    };

    // Get data based on period
    const getYesterdaySeed = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
    };
    const getWeekSeed = () => {
        const d = new Date();
        const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000);
        return d.getFullYear() * 52 + week;
    };
    const getDateSeed = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return y * 400 + m * 31 + d;
    };

    // Period label mapping
    const periodLabels: Record<string, string> = {
        today: "Today", yesterday: "Yesterday", week: "This Week",
        month: "This Month", year: "This Year", custom: selectedDate,
    };
    const periodLabel = periodLabels[period] || "Today";

    // Data source: real POS data for real accounts, demo data for demo
    let data: any[];
    if (!isDemo && posData !== null) {
        data = posData;
    } else {
        // Demo data fallback
        switch (period) {
            case "today":
                data = DEMO_STAFF_TODAY;
                break;
            case "yesterday":
                data = getSeededData(DEMO_STAFF_TODAY, getYesterdaySeed());
                break;
            case "week":
                data = getSeededData(DEMO_STAFF_MONTH, getWeekSeed(), 0.25);
                break;
            case "month":
                data = DEMO_STAFF_MONTH;
                break;
            case "year":
                data = DEMO_STAFF_YEAR;
                break;
            case "custom":
                data = getSeededData(DEMO_STAFF_TODAY, getDateSeed(selectedDate));
                break;
            default:
                data = DEMO_STAFF_TODAY;
        }
    }

    const topServer = data[0];

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🏆 Staff Performance & Sales</div>
                <div className="topbar-right">
                    <button className="btn-secondary" onClick={handleExportStaff} style={{ fontSize: 13 }}>Export Leaderboard ↗</button>
                    <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: "8px", padding: "4px", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                        {(["today", "yesterday", "week", "month", "year"] as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: period === p ? 700 : 500, background: period === p ? "rgba(255,255,255,0.1)" : "transparent", color: period === p ? "#fff" : "var(--text-muted)", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                                {p === "today" ? "Today" : p === "yesterday" ? "Yesterday" : p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
                            </button>
                        ))}
                        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => { setSelectedDate(e.target.value); setPeriod("custom"); }}
                            max={new Date().toISOString().split('T')[0]}
                            min="2025-01-01"
                            style={{
                                padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                fontSize: 12, fontWeight: period === "custom" ? 700 : 500,
                                background: period === "custom" ? "rgba(201,168,76,0.15)" : "transparent",
                                color: period === "custom" ? "#C9A84C" : "var(--text-muted)",
                                fontFamily: "inherit", outline: "none", colorScheme: "dark",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: `1px solid ${toastMsg.type === "success" ? "#4ade80" : "#ef4444"}`, color: toastMsg.type === "success" ? "#4ade80" : "#ef4444", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    {toastMsg.type === "success" ? "✓" : "✗"} {toastMsg.text}
                </div>
            )}

            <div className="page-content fade-in">

                {/* STAFF DETAIL MODAL */}
                {selectedStaff && !emailModal && (() => {
                    const perf = getPerformanceBreakdown(selectedStaff, data);
                    const avgCheck = data.reduce((a: number, s: any) => a + s.checkAvg, 0) / data.length;
                    const avgDrinkPct = data.reduce((a: number, s: any) => a + (s.drinkSales / s.totalSales) * 100, 0) / data.length;
                    const drinkPct = Math.round((selectedStaff.drinkSales / selectedStaff.totalSales) * 100);
                    const salesPerDay = selectedStaff.daysWorked > 0 ? Math.round(selectedStaff.totalSales / selectedStaff.daysWorked) : 0;
                    const avgSalesPerDay = data.reduce((a: number, s: any) => a + s.totalSales / Math.max(s.daysWorked, 1), 0) / data.length;
                    const scoreColor = perf.overallScore >= 80 ? "var(--green)" : perf.overallScore >= 60 ? "#E8C96E" : "var(--red)";

                    return (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(5px)" }}>
                            <div className="card" style={{ width: 560, padding: 32, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
                                <button onClick={() => setSelectedStaff(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-muted)", fontSize: 24, cursor: "pointer" }}>×</button>

                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-secondary)", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                                            {selectedStaff.name.split(" ").map((n: string) => n[0]).join("")}
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>{selectedStaff.name}</h2>
                                            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{restaurantName} | {selectedStaff.role} | {periodLabel}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                                {selectedStaff.daysWorked} shifts | ${selectedStaff.totalSales.toLocaleString()} sales | {drinkPct}% bev mix
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor }}>{perf.overallScore.toFixed(1)}</div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Score</div>
                                    </div>
                                </div>

                                {/* Rank Badge */}
                                <div style={{
                                    background: selectedStaff.rank <= 3 ? "rgba(34,197,94,0.1)" : "rgba(232,201,110,0.1)",
                                    border: `1px solid ${selectedStaff.rank <= 3 ? "rgba(34,197,94,0.2)" : "rgba(232,201,110,0.2)"}`,
                                    borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700,
                                    color: selectedStaff.rank <= 3 ? "var(--green)" : "#E8C96E",
                                    textAlign: "center", marginBottom: 20
                                }}>
                                    {selectedStaff.role} | Rank #{selectedStaff.rank} of {data.length} | {perf.overallScore >= 80 ? "Top performer" : perf.overallScore >= 60 ? "Solid contributor" : "Major opportunity"}
                                </div>

                                {/* KPI Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                                    {[
                                        { label: "Sales / guest", weight: "20%", value: `$${selectedStaff.checkAvg}`, avg: `$${Math.round(avgCheck)}`, pct: ((selectedStaff.checkAvg / avgCheck - 1) * 100) },
                                        { label: "Bev / guest", weight: "30%", value: `$${Math.round(selectedStaff.drinkSales / Math.max(selectedStaff.daysWorked, 1))}`, avg: `$${Math.round(data.reduce((a: number, s: any) => a + s.drinkSales / Math.max(s.daysWorked, 1), 0) / data.length)}`, pct: 0 },
                                        { label: "Bev mix %", weight: "30%", value: `${drinkPct}%`, avg: `${Math.round(avgDrinkPct)}%`, pct: ((drinkPct / avgDrinkPct - 1) * 100) },
                                        { label: "Sales / day", weight: "20%", value: `$${salesPerDay.toLocaleString()}`, avg: `$${Math.round(avgSalesPerDay).toLocaleString()}`, pct: ((salesPerDay / avgSalesPerDay - 1) * 100) },
                                    ].map((kpi, i) => (
                                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.weight} weight</div>
                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, marginTop: 2 }}>{kpi.label}</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 4 }}>{kpi.value}</div>
                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>avg: {kpi.avg}</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: kpi.pct > 0 ? "var(--green)" : kpi.pct < -5 ? "var(--red)" : "rgba(255,255,255,0.5)" }}>
                                                {kpi.pct > 0 ? "+" : ""}{kpi.pct.toFixed(1)}% vs avg
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Metric Bars */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Your Metrics vs. Average</div>
                                    {[
                                        { label: "Sales/guest", val: selectedStaff.checkAvg, avg: avgCheck },
                                        { label: "Bev mix %", val: drinkPct, avg: avgDrinkPct },
                                        { label: "Sales/day", val: salesPerDay, avg: avgSalesPerDay },
                                        { label: "Upsell rate", val: selectedStaff.upsellRate, avg: data.reduce((a: number, s: any) => a + s.upsellRate, 0) / data.length },
                                    ].map((m, i) => {
                                        const ratio = m.avg > 0 ? m.val / m.avg : 1;
                                        const barW = Math.min(100, ratio * 60);
                                        const diffPct = ((ratio - 1) * 100);
                                        return (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                                <div style={{ width: 90, fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "right" }}>{m.label}</div>
                                                <div style={{ flex: 1, height: 16, background: "rgba(255,255,255,0.04)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                                                    <div style={{ position: "absolute", left: "60%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.15)" }} />
                                                    <div style={{ height: "100%", width: `${barW}%`, background: ratio >= 1 ? "linear-gradient(90deg, #3b82f6, #60a5fa)" : "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: 4, transition: "width 0.5s" }} />
                                                </div>
                                                <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: diffPct >= 0 ? "var(--green)" : "var(--red)", textAlign: "right" }}>
                                                    {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Performance Summary */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>+ Strengths</div>
                                        {perf.strengths.map((s, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4, lineHeight: 1.4 }}>• {s}</div>)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#E8C96E", marginBottom: 8 }}>! Opportunities</div>
                                        {perf.opportunities.map((s, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4, lineHeight: 1.4 }}>• {s}</div>)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>&gt; Focus Areas</div>
                                        {perf.focusAreas.map((s, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4, lineHeight: 1.4 }}>• {s}</div>)}
                                    </div>
                                </div>

                                {/* AI Recommendation */}
                                <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 14, borderRadius: 12, display: "flex", gap: 12, marginBottom: 20 }}>
                                    <div style={{ fontSize: 18 }}>💡</div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>AI Recommendation</div>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{getAIRecommendation(selectedStaff, data)}</div>
                                    </div>
                                </div>

                                {/* Email Button */}
                                <button
                                    className="btn-gold"
                                    style={{ width: "100%", fontSize: 14, padding: "12px" }}
                                    onClick={() => { setEmailModal(true); }}
                                >
                                    📧 Email Report to {selectedStaff.name.split(" ")[0]}
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* EMAIL MODAL */}
                {emailModal && selectedStaff && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(5px)" }}>
                        <div className="card" style={{ width: 420, padding: 28 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>📧 Send Performance Report</h3>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>Send {selectedStaff.name}'s report to their email. They'll receive a styled performance summary.</p>

                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Recipient Email</div>
                            <input
                                autoFocus
                                type="email"
                                value={emailTo}
                                onChange={e => setEmailTo(e.target.value)}
                                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 20 }}
                                placeholder={`${selectedStaff.name.split(" ")[0].toLowerCase()}@example.com`}
                            />

                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button className="btn-secondary" onClick={() => { setEmailModal(false); setEmailTo(""); }}>Cancel</button>
                                <button className="btn-primary" onClick={() => handleEmailReport(selectedStaff)} disabled={emailSending || !emailTo.trim()}>
                                    {emailSending ? "Sending..." : "Send Report →"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isDemo ? (
                    <>
                        {/* AI SUMMARY */}
                        <div style={{ background: "rgba(201, 168, 76, 0.1)", border: "1px solid rgba(201, 168, 76, 0.25)", borderRadius: 16, padding: "20px", marginBottom: 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div style={{ fontSize: 24 }}>🧠</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#E8C96E", marginBottom: 4 }}>Restly AI Performance Insights — {periodLabel}</div>
                                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                                    <strong>{topServer.name}</strong> leads {periodLabel.toLowerCase()} with <strong>${topServer.totalSales.toLocaleString()}</strong> in total sales — Food: ${topServer.foodSales?.toLocaleString()} ({Math.round((topServer.foodSales / topServer.totalSales) * 100)}%), Drinks: ${topServer.drinkSales?.toLocaleString()} ({Math.round((topServer.drinkSales / topServer.totalSales) * 100)}%). <br />
                                    <strong>Analysis:</strong> {topServer.name.split(' ')[0]}'s top items are {topServer.topItems?.join(' and ')} with a {topServer.upsellRate}% upsell rate and ${topServer.checkAvg} avg check (floor avg: ${Math.round(data.reduce((a: number, s: any) => a + s.checkAvg, 0) / data.length)}). <br />
                                    <strong>Action:</strong> {data[data.length - 1].name.split(' ')[0]} ({data[data.length - 1].upsellRate}% upsell, ${data[data.length - 1].checkAvg} check avg) should shadow {topServer.name.split(' ')[0]} on a weekend shift to learn drink pairing techniques.
                                </div>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-label">🏆 Top Seller</div>
                                <div className="kpi-value" style={{ color: "#E8C96E", fontSize: 24 }}>{topServer.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>${topServer.totalSales.toLocaleString()} generated</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">💸 Highest Avg Check</div>
                                <div className="kpi-value" style={{ color: "var(--green)" }}>${[...data].sort((a, b) => b.checkAvg - a.checkAvg)[0].checkAvg}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{[...data].sort((a, b) => b.checkAvg - a.checkAvg)[0].name}</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">⚡ Fastest Turn Time</div>
                                <div className="kpi-value" style={{ color: "var(--blue)" }}>{[...data].sort((a, b) => a.turnTime - b.turnTime)[0].turnTime}m</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{[...data].sort((a, b) => a.turnTime - b.turnTime)[0].name}</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">⭐ Highest Tip Average</div>
                                <div className="kpi-value" style={{ color: "#fff" }}>{[...data].sort((a, b) => b.tipPct - a.tipPct)[0].tipPct}%</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{[...data].sort((a, b) => b.tipPct - a.tipPct)[0].name}</div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Server Leaderboard & Analytics — {periodLabel}</span>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Staff Name</th>
                                            <th>Role</th>
                                            <th>Shifts</th>
                                            <th>Total Sales</th>
                                            <th>Check Avg</th>
                                            <th>Turn Time</th>
                                            <th>Avg Tip %</th>
                                            <th>Trend</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(staff => (
                                            <tr key={staff.name} style={{ cursor: "pointer", transition: "background 0.15s" }} onClick={() => setSelectedStaff(staff)} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <td style={{ fontWeight: 800, color: staff.rank === 1 ? "#E8C96E" : staff.rank === 2 ? "#C0C0C0" : staff.rank === 3 ? "#CD7F32" : "var(--text-muted)" }}>
                                                    #{staff.rank}
                                                </td>
                                                <td style={{ fontWeight: 600, color: "#60a5fa", textDecoration: "underline", textUnderlineOffset: 3 }}>{staff.name}</td>
                                                <td><span className={`badge ${staff.role === "Bartender" ? "badge-blue" : "badge-yellow"}`}>{staff.role}</span></td>
                                                <td>{period === "today" || period === "yesterday" ? periodLabel : `${staff.daysWorked}d`}</td>
                                                <td style={{ fontWeight: 600 }}>${staff.totalSales.toLocaleString()}</td>
                                                <td>${staff.checkAvg}</td>
                                                <td>{staff.turnTime}m</td>
                                                <td style={{ color: staff.tipPct > 20 ? "var(--green)" : "inherit" }}>{staff.tipPct}%</td>
                                                <td>
                                                    {staff.trend === "up" && <span style={{ color: "var(--green)" }}>↗</span>}
                                                    {staff.trend === "down" && <span style={{ color: "var(--red)" }}>↘</span>}
                                                    {staff.trend === "flat" && <span style={{ color: "var(--text-muted)" }}>→</span>}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSelectedStaff(staff); setEmailModal(true); }}
                                                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 14, opacity: 0.5, transition: "opacity 0.15s" }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                                                        title={`Email report to ${staff.name}`}
                                                    >📧</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : posLoading ? (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 16, animation: "spin 1s linear infinite" }}>⏳</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Loading POS Data...</h2>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Fetching staff performance from your POS system</p>
                    </div>
                ) : posConnected === false ? (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Staff Performance Not Tracked</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            See which servers are generating the most revenue, have the highest check averages, and flip tables the fastest. Connect your POS system to let AI automatically pull and rank these metrics.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Connect POS System
                        </button>
                    </div>
                ) : posError ? (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>POS Connection Error</h2>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 500, marginBottom: 16 }}>{posError}</p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>Check Settings</button>
                            <button className="btn-primary" onClick={() => { setPosLoading(true); setPosError(''); fetch(`/api/team/performance?period=${period}`).then(r => r.json()).then(d => { setPosConnected(d.connected); setPosData(d.staff || []); if (d.error) setPosError(d.error); }).catch(() => setPosError('Retry failed')).finally(() => setPosLoading(false)); }}>Retry</button>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No Staff Data for {periodLabel}</h2>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 500 }}>No orders were found for this period. Staff metrics will appear once orders are processed through your POS.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Staff Performance Not Tracked</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            See which servers are generating the most revenue, have the highest check averages, and flip tables the fastest. Connect your POS system to let AI automatically pull and rank these metrics.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Connect POS System
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
