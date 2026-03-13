"use client";
import { useState, useEffect } from "react";

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

function getAIRecommendation(staff: any, allStaff: any[]) {
    const firstName = staff.name.split(" ")[0];
    const avgSales = allStaff.reduce((a: number, s: any) => a + s.totalSales, 0) / allStaff.length;
    const avgCheck = allStaff.reduce((a: number, s: any) => a + s.checkAvg, 0) / allStaff.length;
    const avgTip = allStaff.reduce((a: number, s: any) => a + s.tipPct, 0) / allStaff.length;
    const drinkPct = Math.round((staff.drinkSales / staff.totalSales) * 100);
    const foodPct = 100 - drinkPct;

    // Role-based analysis
    if (staff.role === "Bartender") {
        if (staff.tipPct > avgTip + 2) {
            return `${firstName} leads in tip percentage at ${staff.tipPct}% (floor avg: ${avgTip.toFixed(1)}%). Drink sales are ${drinkPct}% of total revenue ($${staff.drinkSales.toLocaleString()}). Top sellers: ${staff.topItems.join(", ")}. Recommend scheduling ${firstName} on Fri/Sat nights for max cocktail revenue.`;
        }
        return `${firstName}'s drink-to-food ratio is ${drinkPct}/${foodPct}. Consider cross-training on food upsells — current upsell rate is ${staff.upsellRate}%. Adding appetizer pairings with cocktails could lift check avg from $${staff.checkAvg} toward $${Math.round(staff.checkAvg * 1.15)}.`;
    }

    // High performer
    if (staff.totalSales > avgSales * 1.1 && staff.upsellRate > 50) {
        return `${firstName} is outperforming the floor average by ${Math.round(((staff.totalSales - avgSales) / avgSales) * 100)}%. Food sales: $${staff.foodSales.toLocaleString()} (${foodPct}%), Drink sales: $${staff.drinkSales.toLocaleString()} (${drinkPct}%). Upsell rate: ${staff.upsellRate}%. Top items sold: ${staff.topItems.join(", ")}. Schedule on high-cover nights.`;
    }

    // Declining trend
    if (staff.trend === "down") {
        return `${firstName}'s performance is trending downward. Check avg ($${staff.checkAvg}) is ${Math.round(avgCheck - staff.checkAvg)} below floor average. Drink sales only $${staff.drinkSales.toLocaleString()} (${drinkPct}% of total). Upsell rate: ${staff.upsellRate}%. Recommend wine/cocktail pairing training and a shadow shift with a top performer.`;
    }

    // Low upsell
    if (staff.upsellRate < 35) {
        return `${firstName} has a ${staff.upsellRate}% upsell rate — well below the team target of 50%. Mostly selling ${staff.topItems.join(" and ")}. Drink contribution is only ${drinkPct}% ($${staff.drinkSales.toLocaleString()}). Training on beverage pairings could increase check avg from $${staff.checkAvg} to ~$${Math.round(staff.checkAvg * 1.2)}.`;
    }

    // Default
    return `${firstName} is performing at floor average. Food: $${staff.foodSales.toLocaleString()} (${foodPct}%), Drinks: $${staff.drinkSales.toLocaleString()} (${drinkPct}%). Turn time: ${staff.turnTime}min. Focus on increasing drink attachment rate from ${staff.upsellRate}% to 50%+.`;
}

export default function TeamPerformancePage() {
    const [period, setPeriod] = useState<"today" | "month" | "year">("today");
    const [isDemo, setIsDemo] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(!!restName);
            })
            .catch(() => { });
    }, []);

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleExportStaff = () => {
        const data = period === "month" ? DEMO_STAFF_MONTH : DEMO_STAFF_YEAR;
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

    const data = period === "today" ? DEMO_STAFF_TODAY : period === "month" ? DEMO_STAFF_MONTH : DEMO_STAFF_YEAR;
    const topServer = data[0];

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🏆 Staff Performance & Sales</div>
                <div className="topbar-right">
                    <button className="btn-secondary" onClick={handleExportStaff} style={{ fontSize: 13 }}>Export Leaderboard ↗</button>
                    <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: "8px", padding: "4px" }}>
                        {(["today", "month", "year"] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: period === p ? 700 : 500, background: period === p ? "rgba(255,255,255,0.1)" : "transparent", color: period === p ? "#fff" : "var(--text-muted)", fontFamily: "inherit" }}
                            >
                                {p === "today" ? "Today" : p === "month" ? "This Month" : "This Year"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            <div className="page-content fade-in">
                {selectedStaff && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(5px)" }}>
                        <div className="card" style={{ width: 500, padding: 32, position: "relative" }}>
                            <button onClick={() => setSelectedStaff(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-muted)", fontSize: 24, cursor: "pointer" }}>×</button>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-secondary)", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                                    {selectedStaff.name.split(" ").map((n: string) => n[0]).join("")}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{selectedStaff.name}</h2>
                                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedStaff.role} • Rank #{selectedStaff.rank}</div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Sales</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#E8C96E", marginTop: 4 }}>${selectedStaff.totalSales.toLocaleString()}</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Days Worked</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 4 }}>{selectedStaff.daysWorked} Shifts</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Avg Tip %</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: selectedStaff.tipPct > 20 ? "var(--green)" : "#fff", marginTop: 4 }}>{selectedStaff.tipPct}%</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Turn Time & Check Avg</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 4 }}>{selectedStaff.turnTime}m / ${selectedStaff.checkAvg}</div>
                                </div>
                            </div>

                            {/* Sales Breakdown */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div style={{ background: "rgba(232,201,110,0.06)", padding: 12, borderRadius: 10, border: "1px solid rgba(232,201,110,0.1)" }}>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Food Sales</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: "#E8C96E" }}>${selectedStaff.foodSales?.toLocaleString() || "—"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selectedStaff.foodSales ? Math.round((selectedStaff.foodSales / selectedStaff.totalSales) * 100) : 0}% of total</div>
                                </div>
                                <div style={{ background: "rgba(96,165,250,0.06)", padding: 12, borderRadius: 10, border: "1px solid rgba(96,165,250,0.1)" }}>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Drink Sales</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>${selectedStaff.drinkSales?.toLocaleString() || "—"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{selectedStaff.drinkSales ? Math.round((selectedStaff.drinkSales / selectedStaff.totalSales) * 100) : 0}% of total</div>
                                </div>
                            </div>
                            {selectedStaff.topItems && (
                                <div style={{ marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                                    <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontSize: 10 }}>Top Sellers: </span>
                                    {selectedStaff.topItems.join(", ")} • <span style={{ color: "#E8C96E" }}>Upsell Rate: {selectedStaff.upsellRate}%</span>
                                </div>
                            )}

                            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 16, borderRadius: 12, display: "flex", gap: 12 }}>
                                <div style={{ fontSize: 20 }}>💡</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>AI Recommendation</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                                        {getAIRecommendation(selectedStaff, data)}
                                    </div>
                                </div>
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
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#E8C96E", marginBottom: 4 }}>Restly AI Performance Insights</div>
                                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                                    <strong>{topServer.name}</strong> leads {period === "month" ? "this month" : "this year"} with <strong>${topServer.totalSales.toLocaleString()}</strong> in total sales — Food: ${topServer.foodSales?.toLocaleString()} ({Math.round((topServer.foodSales / topServer.totalSales) * 100)}%), Drinks: ${topServer.drinkSales?.toLocaleString()} ({Math.round((topServer.drinkSales / topServer.totalSales) * 100)}%). <br />
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
                                <div className="kpi-value" style={{ color: "var(--green)" }}>${data[2].checkAvg}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{data[2].name}</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">⚡ Fastest Turn Time</div>
                                <div className="kpi-value" style={{ color: "var(--blue)" }}>{data[2].turnTime}m</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{data[2].name}</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">⭐ Highest Tip Average</div>
                                <div className="kpi-value" style={{ color: "#fff" }}>{data[2].tipPct}%</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{data[2].name}</div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Server Leaderboard & Analytics</span>
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
                                                <td>{period === "today" ? "Today" : `${staff.daysWorked}d`}</td>
                                                <td style={{ fontWeight: 600 }}>${staff.totalSales.toLocaleString()}</td>
                                                <td>${staff.checkAvg}</td>
                                                <td>{staff.turnTime}m</td>
                                                <td style={{ color: staff.tipPct > 20 ? "var(--green)" : "inherit" }}>{staff.tipPct}%</td>
                                                <td>
                                                    {staff.trend === "up" && <span style={{ color: "var(--green)" }}>↗</span>}
                                                    {staff.trend === "down" && <span style={{ color: "var(--red)" }}>↘</span>}
                                                    {staff.trend === "flat" && <span style={{ color: "var(--text-muted)" }}>→</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
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
