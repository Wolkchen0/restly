"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useIsDemo } from "@/lib/use-demo";
import { usePOSSync, centsToDisplay } from "@/lib/pos/use-pos-sync";
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
    const isDemo = useIsDemo();
    const pos = usePOSSync();
    const [isSyncing, setIsSyncing] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Derive real KPI values from POS data
    const hasLiveData = pos.connected && pos.data && !pos.loading;
    const rev = pos.data?.revenue;
    const liveGross = rev ? centsToDisplay(rev.grossSales) : "$0";
    const liveCovers = rev?.totalCovers || 0;
    const liveAvgSpend = rev && rev.totalCovers > 0 ? centsToDisplay(rev.avgSpendPerCover) : "$0.00";
    const liveLaborPct = pos.data?.laborPercentage || 0;
    const liveSalesData = rev?.salesByHour?.filter(h => h.revenue > 0).map(h => ({
        time: `${h.hour % 12 || 12}${h.hour < 12 ? 'am' : 'pm'}`,
        today: Math.round(h.revenue / 100),
        yesterday: 0,
    })) || [];

    // Derive floor metrics from POS orders
    const liveOrders = pos.data?.orders || [];
    const openOrders = liveOrders.filter(o => o.status === "open");
    const closedOrders = liveOrders.filter(o => o.status === "closed");
    const activeTables = openOrders.length;
    const totalTables = Math.max(activeTables + 4, 18); // assume some empty tables
    const capacityPct = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;
    // Avg ticket time from closed orders (open→close in minutes)
    const ticketTimes = closedOrders
        .filter(o => o.closedAt && o.createdAt)
        .map(o => (new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime()) / 60000)
        .filter(t => t > 0 && t < 180);
    const avgTicketMin = ticketTimes.length > 0 ? Math.round(ticketTimes.reduce((a, b) => a + b, 0) / ticketTimes.length) : 0;
    const avgTicketSec = ticketTimes.length > 0 ? Math.round(((ticketTimes.reduce((a, b) => a + b, 0) / ticketTimes.length) % 1) * 60) : 0;

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
                if (d.locations?.length > 0) {
                    const savedId = localStorage.getItem("restly_active_location");
                    const loc = d.locations.find((l: any) => l.id === savedId) || d.locations.find((l: any) => l.isDefault) || d.locations[0];
                    setActiveLoc(loc.name.split("— ").pop() || loc.name);
                } else {
                    setActiveLoc(restaurantName);
                }
            }).catch(() => {
                setActiveLoc("Setup Required");
            });



        return () => clearInterval(t);
    }, []);

    const handleExportDashboard = () => {
        import("@/utils/pdf-export").then(({ exportToPDF }) => {
            const metricRows: (string | number)[][] = [
                ["Gross Sales Today", hasLiveData ? liveGross : isDemo ? "$6,100" : "$0", hasLiveData ? `${rev!.totalOrders} orders` : isDemo ? "+14.5%" : "--"],
                ["Total Covers", hasLiveData ? liveCovers : isDemo ? "124" : "0", hasLiveData ? `via ${pos.provider}` : isDemo ? "+8%" : "--"],
                ["Avg Spend", hasLiveData ? liveAvgSpend : isDemo ? "$49.19" : "$0.00", hasLiveData ? "Live from POS" : isDemo ? "-2.1%" : "--"],
                ["Labour Cost %", hasLiveData ? `${liveLaborPct}%` : isDemo ? "28.4%" : "0%", hasLiveData ? (liveLaborPct <= 30 ? "Optimal" : "Above target") : isDemo ? "Optimal" : "--"],
                ["", "", ""],
                ["Hourly Sales Breakdown", "", ""],
                ...(hasLiveData && liveSalesData.length > 0 ? liveSalesData : salesData).map(s => [s.time, `$${s.today}`, `$${s.yesterday}`]),
            ];
            exportToPDF({
                title: "Executive Dashboard Overview",
                subtitle: `${new Date().toLocaleDateString()} — Restly AI`,
                headers: ["Metric", "Current", "Change / Yesterday"],
                rows: metricRows,
                sectionRows: [5],
                orientation: "portrait",
                fileName: `Restly_Overview_${new Date().toISOString().split('T')[0]}`,
            });
            showToast("📥 Overview PDF exported!");
        });
    };

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
                    <button onClick={handleExportDashboard} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Export Report ↗
                    </button>
                    <button onClick={async () => {
                        setIsSyncing(true);
                        try {
                            await pos.refresh("today");
                            showToast(hasLiveData ? "POS Data Sync Complete." : "POS sync attempted — check Settings if no data appears.");
                        } catch { showToast("Sync failed."); }
                        setIsSyncing(false);
                    }} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", color: "#1a1000", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                        {isSyncing || pos.loading ? "Syncing..." : "Sync POS"}
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
                    <div className="kpi-val">{isDemo ? "$6,100" : hasLiveData ? liveGross : "$0"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : hasLiveData ? 'diff-pos' : ''}`}>
                        {isDemo ? "↑ 14.5% vs yesterday" : hasLiveData ? `${rev!.totalOrders} orders today` : pos.loading ? "Syncing..." : "No POS connected"}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Total Covers</div>
                    <div className="kpi-val">{isDemo ? "124" : hasLiveData ? liveCovers : "0"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : hasLiveData ? 'diff-pos' : ''}`}>
                        {isDemo ? "↑ 8% vs yesterday" : hasLiveData ? `via ${pos.provider}` : "No POS connected"}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Avg Spend per Guest</div>
                    <div className="kpi-val">{isDemo ? "$49.19" : hasLiveData ? liveAvgSpend : "$0.00"}</div>
                    <div className={`kpi-diff ${hasLiveData && rev!.avgSpendPerCover > 4000 ? 'diff-pos' : isDemo ? 'diff-neg' : ''}`}>
                        {isDemo ? "↓ 2.1% vs yesterday" : hasLiveData ? "Live from POS" : "—"}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Labour Cost %</div>
                    <div className="kpi-val">{isDemo ? "28.4%" : hasLiveData ? `${liveLaborPct}%` : "0%"}</div>
                    <div className={`kpi-diff ${isDemo ? 'diff-pos' : hasLiveData && liveLaborPct <= 30 ? 'diff-pos' : hasLiveData ? 'diff-neg' : ''}`}>
                        {isDemo ? "Optimal (Target: 30%)" : hasLiveData ? (liveLaborPct <= 30 ? "Optimal" : "Above target") : "No Payroll connected"}
                    </div>
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
                            <AreaChart data={isDemo ? salesData : hasLiveData && liveSalesData.length > 0 ? liveSalesData : []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                                    <span style={{ fontWeight: 700, color: "#fff" }}>{isDemo ? "78%" : hasLiveData ? `${capacityPct}%` : "0%"}</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: isDemo ? "78%" : hasLiveData ? `${capacityPct}%` : "0%", height: "100%", background: capacityPct > 85 ? "#f87171" : capacityPct > 60 ? "#fbbf24" : "#4ade80", borderRadius: 4 }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Kitchen Ticket Time (Avg)</span>
                                    <span style={{ fontWeight: 700, color: "#fff" }}>{isDemo ? "14m 30s" : hasLiveData && avgTicketMin > 0 ? `${avgTicketMin}m ${avgTicketSec}s` : "0m 0s"}</span>
                                </div>
                                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: isDemo ? "45%" : hasLiveData ? `${Math.min(avgTicketMin * 3, 100)}%` : "0%", height: "100%", background: avgTicketMin > 20 ? "#f87171" : "#C9A84C", borderRadius: 4 }} />
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{isDemo ? "14" : hasLiveData ? activeTables : "0"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 2 }}>Active Tables</div>
                                </div>
                                <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "#E8C96E" }}>{isDemo ? "4" : hasLiveData ? openOrders.filter(o => o.guestCount >= 4).length : "0"}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: 2 }}>Large Parties</div>
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

                </div>
            </div>

            {/* ── DAILY REVIEWS & SENTIMENT INTELLIGENCE ── */}
            <div className="panel" style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Daily Reviews & Sentiment Intelligence</h2>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Aggregated from Google, Yelp, OpenTable, Instagram & more</p>
                    </div>
                    <Link href="/dashboard/inbox" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        View Inbox →
                    </Link>
                </div>

                {/* Sentiment KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Avg Rating", value: isDemo ? "4.6" : "—", icon: "★", color: "#E8C96E" },
                        { label: "Reviews Today", value: isDemo ? "7" : "0", icon: "◉", color: "#60a5fa" },
                        { label: "Positive", value: isDemo ? "5" : "0", icon: "↑", color: "#4ade80" },
                        { label: "Neutral", value: isDemo ? "1" : "0", icon: "→", color: "rgba(255,255,255,0.5)" },
                        { label: "Negative", value: isDemo ? "1" : "0", icon: "↓", color: "#f87171" },
                    ].map(k => (
                        <div key={k.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{k.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.icon} {k.value}</div>
                        </div>
                    ))}
                </div>

                {/* Latest Reviews */}
                {isDemo ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        {[
                            { platform: "Google", author: "Mike R.", rating: 5, text: "Exceptional dining experience. Truffle burger was outstanding and cocktail program is top-notch.", color: "#4285F4", time: "1h ago" },
                            { platform: "Yelp", author: "Anna L.", rating: 4, text: "Great food but wait time was long past our reservation. Once seated, everything was perfect.", color: "#D32323", time: "6h ago" },
                            { platform: "OpenTable", author: "Sarah M.", rating: 5, text: "Perfect anniversary dinner. Staff arranged a special dessert and wine pairing was spot-on.", color: "#DA3743", time: "1d ago" },
                            { platform: "Instagram", author: "@foodie.gal_ny", rating: 0, text: "DM: Looking for vegan options for a birthday party of 5. Two strict vegans in our group.", color: "#E1306C", time: "10m ago" },
                            { platform: "X", author: "@lafoodie", rating: 0, text: "Mention: Anyone tried the lamb chops? Absolutely insane. Best I've had in LA.", color: "#fff", time: "3h ago" },
                            { platform: "Email", author: "Jennifer Oaks", rating: 0, text: "Corporate dinner inquiry for 35 guests on March 28th. Needs private dining and set menu.", color: "#60a5fa", time: "5m ago" },
                        ].map((r, i) => (
                            <div key={i} style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.platform}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{r.author}</span>
                                    </div>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{r.time}</span>
                                </div>
                                {r.rating > 0 && (
                                    <div style={{ marginBottom: 6, fontSize: 12, color: "#E8C96E" }}>
                                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                    </div>
                                )}
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {r.text}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: "32px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Connect your Google Business, Yelp, OpenTable, and social accounts in Settings to see daily reviews and sentiment analysis here.</div>
                    </div>
                )}

                {/* AI Insight */}
                {isDemo && (
                    <div style={{ marginTop: 16, padding: "14px 20px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ fontSize: 18 }}>🧠</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                            AI Insight: Today's reviews are 71% positive. Guests are praising the truffle burger and cocktail program. One concern about reservation wait times — consider adding a 10-minute buffer between seatings on weekends.
                        </div>
                    </div>
                )}
            </div>

        </main>
    );
}
