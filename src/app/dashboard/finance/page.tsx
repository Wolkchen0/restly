"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const MONTHLY_DATA = [
    { name: "Week 1", revenue: 42000, cogs: 12500, labor: 14000, profit: 15500 },
    { name: "Week 2", revenue: 45000, cogs: 13000, labor: 14200, profit: 17800 },
    { name: "Week 3", revenue: 38000, cogs: 11000, labor: 13800, profit: 13200 },
    { name: "Week 4", revenue: 51000, cogs: 14800, labor: 15100, profit: 21100 },
];

export default function FinancePage() {
    const [period, setPeriod] = useState("Month-to-Date");
    const [isDemo, setIsDemo] = useState(true);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(restName.toLowerCase() === "meyhouse");
            })
            .catch(() => { });
    }, []);

    const stats = {
        totalRevenue: 176000,
        cogs: 51300,
        cogsPct: ((51300 / 176000) * 100).toFixed(1),
        labor: 57100,
        laborPct: ((57100 / 176000) * 100).toFixed(1),
        operatingEx: 15000,
        operatingExPct: ((15000 / 176000) * 100).toFixed(1),
    };

    const netProfit = stats.totalRevenue - stats.cogs - stats.labor - stats.operatingEx;
    const profitMargin = ((netProfit / stats.totalRevenue) * 100).toFixed(1);

    const handleExportCSV = () => {
        showToast("Generating CSV... The file will start downloading shortly.");
        setTimeout(() => {
            // Generate real CSV content
            const headers = ["Period", "Gross Revenue", "COGS", "Labor", "Operating Expenses", "Net Profit"];
            const rows = [
                headers.join(","),
                [`Current (${period})`, stats.totalRevenue, stats.cogs, stats.labor, stats.operatingEx, netProfit].join(",")
            ];

            // Add historical weeks from the mock data
            MONTHLY_DATA.forEach(d => {
                rows.push([d.name, d.revenue, d.cogs, d.labor, "N/A", d.profit].join(","));
            });

            // Trigger actual browser download
            const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Restly_Finance_Export_${new Date().getFullYear()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(`Restly_Finance_Export_${new Date().getFullYear()}.csv downloaded successfully.`);
        }, 1000);
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📈 Profit & Loss (P&L)</div>
                <div className="topbar-right">
                    <select value={period} onChange={e => setPeriod(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8C96E", fontWeight: 700, padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", outline: "none" }}>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Today</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Yesterday</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Week-to-Date</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Month-to-Date</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Last Month</option>
                    </select>
                    <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleExportCSV}>Export CSV ↗</button>
                </div>
            </div>

            <div className="page-content fade-in">
                {/* HERO KPI */}
                <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: "32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Net Profit ({period})</div>
                        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", letterSpacing: "-2px", lineHeight: 1 }}>
                            ${isDemo ? netProfit.toLocaleString() : "0"}
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
                            {isDemo ? (
                                <><span style={{ color: "#4ade80", fontWeight: 700 }}>+{profitMargin}%</span> Profit Margin • Target: 15.0%</>
                            ) : (
                                "Connect your POS and Payroll to see profit margins"
                            )}
                        </div>
                    </div>
                </div>

                {isDemo ? (
                    <div className="grid-2">
                        {/* INCOME STATEMENT BREAKDOWN */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Income Statement Breakdown</span>
                            </div>
                            <div className="card-body" style={{ padding: "0" }}>
                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Gross Sales</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>${stats.totalRevenue.toLocaleString()}</div>
                                </div>

                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Cost of Goods Sold (COGS)</div>
                                        <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>Goal: &lt;30%</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${stats.cogs.toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{stats.cogsPct}% of Sales</div>
                                    </div>
                                </div>

                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Labor Cost (Prime)</div>
                                        <div style={{ fontSize: 12, color: "var(--yellow)", marginTop: 4 }}>Warning: Approaching 35% limit</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${stats.labor.toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{stats.laborPct}% of Sales</div>
                                    </div>
                                </div>

                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Operating Expenses</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Rent, Utilities, Utilities</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${stats.operatingEx.toLocaleString()}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{stats.operatingExPct}% of Sales</div>
                                    </div>
                                </div>

                                <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", background: "rgba(34,197,94,0.05)", borderRadius: "0 0 16px 16px" }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>NET INCOME</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>${netProfit.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* CHARTS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Profit Trend</span>
                                </div>
                                <div className="card-body" style={{ height: 200, padding: "10px 0 0 0" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={v => `$${v / 1000}k`} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                                            <Area type="monotone" dataKey="profit" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#profitGrad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Cost Distribution (COGS vs Labor)</span>
                                </div>
                                <div className="card-body" style={{ height: 200, padding: "10px 0 0 0" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={v => `$${v / 1000}k`} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                            <Bar dataKey="labor" stackId="a" fill="#eab308" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="cogs" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Finance & KDS Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            To view your Live P&L, COGS vs Labor breakdown, and net profit margins, please sync your POS system.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Go to Integrations
                        </button>
                    </div>
                )}
            </div>

            {/* CUSTOM TOAST NOTIFICATION */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}
        </>
    );
}
