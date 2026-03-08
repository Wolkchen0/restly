"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Dummy live sales data for the chart
const salesData = [
    { time: "10am", today: 120, yesterday: 90 },
    { time: "12pm", today: 850, yesterday: 700 },
    { time: "2pm", today: 1400, yesterday: 1100 },
    { time: "4pm", today: 1800, yesterday: 1600 },
    { time: "6pm", today: 3200, yesterday: 2900 },
    { time: "8pm", today: 5400, yesterday: 4800 },
    { time: "10pm", today: 6100, yesterday: 5500 },
];

export default function DashboardOverview() {
    const [activeLoc, setActiveLoc] = useState<string>("Loading...");
    const [currentTime, setCurrentTime] = useState("");
    const [reviewsData, setReviewsData] = useState<any>(null);
    const [isDemo, setIsDemo] = useState<boolean>(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    useEffect(() => {
        // Current time ticker
        const updateTime = () => setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
        updateTime();
        const t = setInterval(updateTime, 1000);

        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restaurantName = d.restaurantName || "No Location Setup";
                setIsDemo(restaurantName.toLowerCase() === "meyhouse");
                if (d.locations?.length > 0) {
                    const savedId = localStorage.getItem("restly_active_location");
                    const loc = d.locations.find((l: any) => l.id === savedId) || d.locations.find((l: any) => l.isDefault) || d.locations[0];
                    setActiveLoc(loc.name.split("— ").pop() || loc.name); // only branch name
                } else {
                    setActiveLoc(restaurantName);
                }
            }).catch(() => {
                setActiveLoc("Setup Required");
            });

        fetch("/api/reviews")
            .then(r => r.json())
            .then(d => setReviewsData(d));

        return () => clearInterval(t);
    }, []);

    return (
        <main style={{ padding: "32px 28px 80px", maxWidth: 1200, margin: "0 auto" }}>
            <style>{`
        .kpi-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:8px; transition:all 0.2s; }
        .kpi-card:hover { border-color:rgba(201,168,76,0.3); background:rgba(255,255,255,0.04); transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,0,0,0.2); }
        .kpi-val { font-size:32px; font-weight:900; color:#fff; letter-spacing:-1px; }
        .kpi-label { font-size:13px; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; }
        .kpi-diff { font-size:12px; font-weight:700; padding:4px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; }
        .diff-pos { background:rgba(74, 222, 128, 0.1); color:#4ade80; }
        .diff-neg { background:rgba(248, 113, 113, 0.1); color:#f87171; }
        .panel { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:20px; padding:28px; }
        .ai-pulse { animation:pulse 2s infinite; }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)} 70%{box-shadow:0 0 0 10px rgba(201,168,76,0)} 100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} }
      `}</style>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* ── HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                <div>
                    <div style={{ fontSize: 13, color: "#E8C96E", fontWeight: 700, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>
                        Live Dashboard • {currentTime}
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>
                        Overview: {activeLoc}
                    </h1>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => showToast("Downloading Dashboard_Report.csv...")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Export CSV
                    </button>
                    <button onClick={() => {
                        setIsSyncing(true);
                        setTimeout(() => setIsSyncing(false), 2000);
                    }} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", color: "#1a1000", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                        {isSyncing ? "Syncing..." : "Sync POS"}
                    </button>
                </div>
            </div>

            {/* ── AI PROACTIVE INSIGHT (Restoke-style smart actionable alert) ── */}
            <div className="panel" style={{ background: "linear-gradient(to right, rgba(201,168,76,0.1), rgba(201,168,76,0.02))", borderColor: "rgba(201,168,76,0.2)", marginBottom: 24, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="ai-pulse" style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1a24", border: "1px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        🤖
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#E8C96E", marginBottom: 4 }}>Restly AI Insight</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                            {isDemo
                                ? "Based on tonight's reservations (82 covers), you are projected to run out of Truffle Oil and Ribeye Steaks before 9 PM."
                                : "Please connect your Inventory Management software (e.g. Toast) to let AI predict your stock patterns."
                            }
                        </div>
                    </div>
                </div>
                {isDemo && (
                    <Link href="/dashboard/inventory" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                        Check Inventory →
                    </Link>
                )}
            </div>

            {/* ── KPI GRID ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                <div className="kpi-card">
                    <div className="kpi-label">Gross Sales (Today)</div>
                    <div className="kpi-val">{isDemo ? "$6,100" : "$0"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : ''}`}>{isDemo ? "↑ 14.5% vs yesterday" : "No POS connected"}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Total Covers</div>
                    <div className="kpi-val">{isDemo ? "124" : "0"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : ''}`}>{isDemo ? "↑ 8% vs yesterday" : "No OpenTable connected"}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Avg Spend per Guest</div>
                    <div className="kpi-val">{isDemo ? "$49.19" : "$0.00"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-neg' : ''}`}>{isDemo ? "↓ 2.1% vs yesterday" : "—"}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Labour Cost %</div>
                    <div className="kpi-val">{isDemo ? "28.4%" : "0%"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : ''}`}>{isDemo ? "Optimal (Target: 30%)" : "No Payroll connected"}</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                {/* ── LIVE SALES CHART ── */}
                <div className="panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Live Sales Trajectory</h2>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Cumulative hourly sales compared to yesterday</p>
                        </div>
                    </div>
                    <div style={{ height: 300, width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={isDemo ? salesData : []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                                    formatter={(value: any) => [`$${value}`, ""]}
                                />
                                <Area type="monotone" dataKey="yesterday" name="Yesterday" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="today" name="Today" stroke="#C9A84C" fillOpacity={1} fill="url(#colorToday)" strokeWidth={3} activeDot={{ r: 6, fill: "#E8C96E", stroke: "#1a1a24", strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── RIGHT COLUMN (Floor Status & Tasks) ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Floor Status */}
                    <div className="panel" style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Floor Status</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Dining Room Capacity</span>
                                    <span style={{ fontWeight: 700, color: "#fff" }}>{isDemo ? "78%" : "0%"}</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: isDemo ? "78%" : "0%", height: "100%", background: "#4ade80", borderRadius: 4 }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Kitchen Ticket Time (Avg)</span>
                                    <span style={{ fontWeight: 700, color: "#fff" }}>{isDemo ? "14m 30s" : "0m 0s"}</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: isDemo ? "45%" : "0%", height: "100%", background: "#C9A84C", borderRadius: 4 }} />
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{isDemo ? "14" : "0"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 2 }}>Active Tables</div>
                                </div>
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "#E8C96E" }}>{isDemo ? "4" : "0"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 2 }}>VIPs Seated</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tasks */}
                    <div className="panel" style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Pending Actions</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {isDemo ? (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <span style={{ background: "rgba(248, 113, 113, 0.1)", color: "#f87171", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Approve PO #1042</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>US Foods (Due tomorrow)</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <span style={{ background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⏱️</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Review Time-off</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Sarah M. (Chef) requested Friday</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" }}>
                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>No pending actions. Navigate to Integrations to connect your platforms.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Sentiment (New Widget) */}
                    {reviewsData && (
                        <div className="panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Live Social Sentiment</h2>
                                {isDemo && (
                                    <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(201,168,76,0.1)", color: "var(--gold-light)", padding: "4px 8px", borderRadius: 8 }}>
                                        ★ {reviewsData.stats?.averageRating} Avg
                                    </span>
                                )}
                            </div>

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                                {isDemo ? (
                                    reviewsData.reviews?.slice(0, 3).map((r: any) => (
                                        <div key={r.id} style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{r.platform} • {r.author}</div>
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.date}</div>
                                            </div>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                "{r.text}"
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: "24px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", flex: 1, display: "flex", alignItems: "center" }}>
                                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Link Google Business & Yelp to enable AI review summarization.</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 12, fontSize: 11, color: isDemo ? "#E8C96E" : "rgba(255,255,255,0.4)", fontStyle: "italic", textAlign: "center" }}>
                                ✨ AI Insight: {reviewsData.aiInsight}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </main>
    );
}
