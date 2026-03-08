"use client";
import { useState, useEffect } from "react";

const DEMO_STAFF_MONTH = [
    { rank: 1, name: "Sarah Jenkins", role: "Sr. Server", totalSales: 18500, checkAvg: 85, turnTime: 45, tipPct: 22.4, trend: "up" },
    { rank: 2, name: "Marcus Torres", role: "Server", totalSales: 16200, checkAvg: 72, turnTime: 42, tipPct: 19.8, trend: "up" },
    { rank: 3, name: "Lisa Park", role: "Bartender", totalSales: 14800, checkAvg: 95, turnTime: 30, tipPct: 24.1, trend: "flat" },
    { rank: 4, name: "David Chen", role: "Server", totalSales: 12100, checkAvg: 68, turnTime: 48, tipPct: 18.5, trend: "down" },
    { rank: 5, name: "Emily Watson", role: "Server", totalSales: 9400, checkAvg: 65, turnTime: 50, tipPct: 17.2, trend: "flat" },
];

const DEMO_STAFF_YEAR = [
    { rank: 1, name: "Marcus Torres", role: "Server", totalSales: 212000, checkAvg: 68, turnTime: 44, tipPct: 19.2, trend: "up" },
    { rank: 2, name: "Sarah Jenkins", role: "Sr. Server", totalSales: 208500, checkAvg: 82, turnTime: 46, tipPct: 21.8, trend: "up" },
    { rank: 3, name: "Lisa Park", role: "Bartender", totalSales: 185000, checkAvg: 92, turnTime: 32, tipPct: 23.5, trend: "up" },
    { rank: 4, name: "David Chen", role: "Server", totalSales: 145000, checkAvg: 65, turnTime: 47, tipPct: 18.2, trend: "flat" },
    { rank: 5, name: "Emily Watson", role: "Server", totalSales: 110000, checkAvg: 62, turnTime: 49, tipPct: 16.8, trend: "down" },
];

export default function TeamPerformancePage() {
    const [period, setPeriod] = useState<"month" | "year">("month");
    const [isDemo, setIsDemo] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(restName.toLowerCase() === "meyhouse");
            })
            .catch(() => { });
    }, []);

    const data = period === "month" ? DEMO_STAFF_MONTH : DEMO_STAFF_YEAR;
    const topServer = data[0];

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🏆 Staff Performance & Sales</div>
                <div className="topbar-right">
                    <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: "8px", padding: "4px" }}>
                        <button
                            onClick={() => setPeriod("month")}
                            style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: period === "month" ? 700 : 500, background: period === "month" ? "rgba(255,255,255,0.1)" : "transparent", color: period === "month" ? "#fff" : "var(--text-muted)" }}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setPeriod("year")}
                            style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: period === "year" ? 700 : 500, background: period === "year" ? "rgba(255,255,255,0.1)" : "transparent", color: period === "year" ? "#fff" : "var(--text-muted)" }}
                        >
                            This Year
                        </button>
                    </div>
                </div>
            </div>

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
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Avg Tip %</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: selectedStaff.tipPct > 20 ? "var(--green)" : "#fff", marginTop: 4 }}>{selectedStaff.tipPct}%</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Check Avg</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 4 }}>${selectedStaff.checkAvg}</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Turn Time</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 4 }}>{selectedStaff.turnTime}m</div>
                                </div>
                            </div>

                            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: 16, borderRadius: 12, display: "flex", gap: 12 }}>
                                <div style={{ fontSize: 20 }}>💡</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa", marginBottom: 2 }}>AI Recommendation</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                        {selectedStaff.checkAvg > 75
                                            ? `${selectedStaff.name.split(' ')[0]} excels at upselling and premium check averages. Schedule them on high-volume weekend shifts for maximum revenue.`
                                            : `${selectedStaff.name.split(' ')[0]} could benefit from wine pairing training to boost their ${selectedStaff.checkAvg}$ check average closer to the floor target.`}
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
                                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                    <strong>{topServer.name}</strong> is leading {period === "month" ? "this month" : "this year"} with <strong>${topServer.totalSales.toLocaleString()}</strong> in sales. <br />
                                    <strong>Insight:</strong> Sarah has an exceptional check average (${period === "month" ? 85 : 82}) compared to the floor average (~$75). She effectively up-sells premium wines and appetizers. <br />
                                    <strong>Actionable Tip:</strong> Consider pairing under-performing servers with Sarah for a weekend shadow shift to improve their up-sell techniques.
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
