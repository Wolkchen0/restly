"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const WEEKLY_DATA = [
    { name: "Week 1", revenue: 42000, cogs: 12500, labor: 14000, profit: 15500 },
    { name: "Week 2", revenue: 45000, cogs: 13000, labor: 14200, profit: 17800 },
    { name: "Week 3", revenue: 38000, cogs: 11000, labor: 13800, profit: 13200 },
    { name: "Week 4", revenue: 51000, cogs: 14800, labor: 15100, profit: 21100 },
];

const DAILY_REVENUE = [
    { day: "Mon", revenue: 5800, orders: 142 },
    { day: "Tue", revenue: 5200, orders: 128 },
    { day: "Wed", revenue: 6100, orders: 155 },
    { day: "Thu", revenue: 6800, orders: 168 },
    { day: "Fri", revenue: 9200, orders: 224 },
    { day: "Sat", revenue: 11500, orders: 285 },
    { day: "Sun", revenue: 8400, orders: 198 },
];

// Editable operating expenses
const DEFAULT_OPEX = [
    { id: "rent", label: "Rent", amount: 6500, category: "fixed" },
    { id: "utilities", label: "Utilities", amount: 2800, category: "fixed" },
    { id: "insurance", label: "Insurance", amount: 1200, category: "fixed" },
    { id: "marketing", label: "Marketing & Ads", amount: 1500, category: "variable" },
    { id: "supplies", label: "Supplies & Cleaning", amount: 1400, category: "variable" },
    { id: "tech", label: "Technology & POS Fees", amount: 900, category: "fixed" },
    { id: "misc", label: "Miscellaneous", amount: 700, category: "variable" },
];

// AI Financial Advisor insights
function getAIInsights(stats: { totalRevenue: number; cogs: number; labor: number; opex: number; primeCostPct: number; cogsRatio: number; laborRatio: number; profitMargin: number }) {
    const insights: { type: "success" | "warning" | "danger" | "info"; title: string; detail: string }[] = [];

    if (stats.cogsRatio > 32) {
        insights.push({ type: "danger", title: "COGS Too High", detail: `Food cost at ${stats.cogsRatio.toFixed(1)}% exceeds 30% target. Review menu pricing or negotiate with suppliers for better rates. Consider reducing portion sizes on low-margin items.` });
    } else if (stats.cogsRatio > 28) {
        insights.push({ type: "warning", title: "COGS Approaching Target", detail: `Food cost at ${stats.cogsRatio.toFixed(1)}% is nearing 30%. Watch high-cost ingredients like Wagyu and Truffle Oil.` });
    } else {
        insights.push({ type: "success", title: "COGS Well Controlled", detail: `Food cost at ${stats.cogsRatio.toFixed(1)}% is healthy. Keep up the good purchasing discipline.` });
    }

    if (stats.laborRatio > 33) {
        insights.push({ type: "danger", title: "Labor Cost Critical", detail: `Labor at ${stats.laborRatio.toFixed(1)}% exceeds the 33% benchmark. Consider adjusting shift schedules — check Schedule page for overtime staff.` });
    } else if (stats.laborRatio > 28) {
        insights.push({ type: "warning", title: "Labor Near Threshold", detail: `Labor at ${stats.laborRatio.toFixed(1)}% is within range but trending up. Monitor overtime hours this week.` });
    } else {
        insights.push({ type: "success", title: "Labor Costs Optimized", detail: `Labor at ${stats.laborRatio.toFixed(1)}% is well within the 25-33% benchmark. Great scheduling.` });
    }

    if (stats.primeCostPct > 65) {
        insights.push({ type: "danger", title: "Prime Cost Alert", detail: `Combined COGS + Labor at ${stats.primeCostPct.toFixed(1)}% exceeds the 60-65% industry standard. Immediate action needed.` });
    } else if (stats.primeCostPct > 60) {
        insights.push({ type: "info", title: "Prime Cost Acceptable", detail: `Prime Cost at ${stats.primeCostPct.toFixed(1)}% is at the upper end of acceptable range. Room for improvement.` });
    } else {
        insights.push({ type: "success", title: "Prime Cost Excellent", detail: `Prime Cost at ${stats.primeCostPct.toFixed(1)}% is below 60% — very efficient operations.` });
    }

    if (stats.profitMargin > 20) {
        insights.push({ type: "success", title: "Strong Profit Margin", detail: `Net margin at ${stats.profitMargin.toFixed(1)}% excellently exceeds the 10-15% restaurant average. Consider reinvesting in equipment upgrades.` });
    } else if (stats.profitMargin > 10) {
        insights.push({ type: "info", title: "Profit on Track", detail: `Net margin at ${stats.profitMargin.toFixed(1)}% is in line with industry average (10-15%).` });
    } else {
        insights.push({ type: "danger", title: "Low Profit Margin", detail: `Net margin at ${stats.profitMargin.toFixed(1)}% is below industry average. Review all cost categories for savings.` });
    }

    // Revenue trend
    const lastWeek = WEEKLY_DATA[WEEKLY_DATA.length - 1].revenue;
    const prevWeek = WEEKLY_DATA[WEEKLY_DATA.length - 2].revenue;
    const change = ((lastWeek - prevWeek) / prevWeek * 100).toFixed(1);
    if (parseFloat(change) > 0) {
        insights.push({ type: "success", title: "Revenue Trending Up", detail: `Revenue increased ${change}% from Week 3 to Week 4. Saturday ($11,500) is your strongest day — consider special events on Saturdays.` });
    }

    return insights;
}

const INSIGHT_STYLES = {
    success: { bg: "rgba(74,222,128,0.04)", border: "rgba(74,222,128,0.15)", icon: "✅", color: "#4ade80" },
    warning: { bg: "rgba(250,204,21,0.04)", border: "rgba(250,204,21,0.15)", icon: "⚠️", color: "#facc15" },
    danger: { bg: "rgba(248,113,113,0.04)", border: "rgba(248,113,113,0.15)", icon: "🚨", color: "#f87171" },
    info: { bg: "rgba(96,165,250,0.04)", border: "rgba(96,165,250,0.15)", icon: "💡", color: "#60a5fa" },
};

export default function FinancePage() {
    const [period, setPeriod] = useState("Month-to-Date");
    const [isDemo, setIsDemo] = useState(true);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [opex, setOpex] = useState(DEFAULT_OPEX);
    const [laborOverride, setLaborOverride] = useState<string>("");
    const [editingOpex, setEditingOpex] = useState(false);
    const [showAllInsights, setShowAllInsights] = useState(false);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(!!restName);
            })
            .catch(() => { });
    }, []);

    const totalOpex = opex.reduce((a, e) => a + e.amount, 0);

    // Period multipliers based on daily averages
    // Monthly baseline: Revenue=176000, COGS=51300, Labor=57100, OpEx=15000
    // Daily baseline (30-day month): Revenue≈5867, COGS≈1710, Labor≈1903
    const DAILY_BASE = { revenue: 5867, cogs: 1710, labor: 1903 };
    const periodMultiplier: Record<string, number> = {
        "Today": 1,
        "Yesterday": 1,
        "Week-to-Date": new Date().getDay() || 7, // days so far this week (1-7)
        "Month-to-Date": new Date().getDate(),     // day of month (1-31)
        "Last Month": 30,
    };
    const mult = periodMultiplier[period] || 30;

    const periodRevenue = Math.round(DAILY_BASE.revenue * mult);
    const periodCogs = Math.round(DAILY_BASE.cogs * mult);
    const laborDefault = Math.round(DAILY_BASE.labor * mult);
    const laborTotal = laborOverride ? parseFloat(laborOverride) || 0 : laborDefault;
    const periodOpex = Math.round(totalOpex * (mult / 30)); // scale opex proportionally

    const stats = {
        totalRevenue: periodRevenue,
        cogs: periodCogs,
        cogsRatio: periodRevenue > 0 ? (periodCogs / periodRevenue) * 100 : 0,
        labor: laborTotal,
        laborRatio: periodRevenue > 0 ? (laborTotal / periodRevenue) * 100 : 0,
        opex: periodOpex,
        opexRatio: periodRevenue > 0 ? (periodOpex / periodRevenue) * 100 : 0,
        primeCostPct: periodRevenue > 0 ? ((periodCogs + laborTotal) / periodRevenue) * 100 : 0,
        profitMargin: 0,
    };

    const netProfit = stats.totalRevenue - stats.cogs - stats.labor - periodOpex;
    stats.profitMargin = periodRevenue > 0 ? (netProfit / periodRevenue) * 100 : 0;

    const aiInsights = getAIInsights(stats);
    const visibleInsights = showAllInsights ? aiInsights : aiInsights.slice(0, 3);

    // Pie chart data
    const pieData = [
        { name: "COGS", value: stats.cogs, color: "#ef4444" },
        { name: "Labor", value: stats.labor, color: "#4ade80" },
        { name: "Operating", value: totalOpex, color: "#60a5fa" },
        { name: "Profit", value: Math.max(0, netProfit), color: "#E8C96E" },
    ];

    const handleExportPDF = () => {
        import("@/utils/pdf-export").then(({ exportToPDF }) => {
            exportToPDF({
                title: `P&L Report — ${period}`,
                subtitle: "Generated by Restly AI Restaurant Manager",
                headers: ["Category", "Amount", "% of Sales", "Notes"],
                rows: [
                    ["Gross Sales", `$${stats.totalRevenue.toLocaleString()}`, "100%", ""],
                    ["Cost of Goods Sold", `-$${stats.cogs.toLocaleString()}`, `${stats.cogsRatio.toFixed(1)}%`, "From POS"],
                    ["Labor Cost", `-$${stats.labor.toLocaleString()}`, `${stats.laborRatio.toFixed(1)}%`, laborOverride ? "Manual Entry" : "From Schedule"],
                    ...opex.map(e => [`  ${e.label}`, `-$${e.amount.toLocaleString()}`, `${((e.amount / stats.totalRevenue) * 100).toFixed(1)}%`, e.category]),
                    ["Total Operating", `-$${totalOpex.toLocaleString()}`, `${stats.opexRatio.toFixed(1)}%`, ""],
                    ["", "", "", ""],
                    ["NET INCOME", `$${netProfit.toLocaleString()}`, `${stats.profitMargin.toFixed(1)}%`, netProfit > 0 ? "Profitable" : "LOSS"],
                    ["", "", "", ""],
                    ["Prime Cost", `$${(stats.cogs + stats.labor).toLocaleString()}`, `${stats.primeCostPct.toFixed(1)}%`, "Target: <65%"],
                    ["", "", "", ""],
                    ["WEEKLY BREAKDOWN", "", "", ""],
                    ...WEEKLY_DATA.map(d => [d.name, `$${d.revenue.toLocaleString()}`, `$${d.cogs.toLocaleString()} COGS`, `$${d.profit.toLocaleString()} Profit`]),
                ],
                sectionRows: [6, 10],
                orientation: "portrait",
                fileName: `Restly_Finance_${new Date().getFullYear()}`,
            });
            showToast("📥 Finance PDF exported!");
        });
    };

    const handleDownloadCSV = () => {
        const rows = [
            ["Restly — Weekly P&L Report"],
            [`Period: ${period}`],
            [`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`],
            [],
            ["=== FINANCIAL SUMMARY ==="],
            ["Category", "Amount", "% of Sales"],
            ["Gross Revenue", `$${stats.totalRevenue.toLocaleString()}`, "100%"],
            ["COGS", `-$${stats.cogs.toLocaleString()}`, `${stats.cogsRatio.toFixed(1)}%`],
            ["Labor", `-$${stats.labor.toLocaleString()}`, `${stats.laborRatio.toFixed(1)}%`],
            ["Operating Expenses", `-$${totalOpex.toLocaleString()}`, `${(totalOpex / stats.totalRevenue * 100).toFixed(1)}%`],
            ["Net Profit", `$${netProfit.toLocaleString()}`, `${stats.profitMargin.toFixed(1)}%`],
            [],
            ["=== DAILY REVENUE ==="],
            ["Day", "Revenue", "Orders"],
            ...DAILY_REVENUE.map(d => [d.day, `$${d.revenue.toLocaleString()}`, String(d.orders)]),
            [],
            ["=== WEEKLY TREND ==="],
            ["Week", "Revenue", "COGS", "Labor", "Profit"],
            ...WEEKLY_DATA.map(w => [w.name, `$${w.revenue.toLocaleString()}`, `$${w.cogs.toLocaleString()}`, `$${w.labor.toLocaleString()}`, `$${w.profit.toLocaleString()}`]),
            [],
            ["=== OPERATING EXPENSES ==="],
            ["Item", "Amount", "Type"],
            ...opex.map(e => [e.label, `$${e.amount.toLocaleString()}`, e.category]),
            [],
            ["=== KEY METRICS ==="],
            ["Prime Cost %", `${stats.primeCostPct.toFixed(1)}%`],
            ["Food Cost %", `${stats.cogsRatio.toFixed(1)}%`],
            ["Labor Cost %", `${stats.laborRatio.toFixed(1)}%`],
            ["Avg Check", `$${Math.round(stats.totalRevenue / 1300)}`],
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Restly_PL_Report_${period.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("📥 Report downloaded!");
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">Profit & Loss (P&L)</div>
                <div className="topbar-right">
                    <select value={period} onChange={e => setPeriod(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8C96E", fontWeight: 700, padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", outline: "none" }}>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Today</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Yesterday</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Week-to-Date</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Month-to-Date</option>
                        <option style={{ background: "#0d0d1a", color: "#fff" }}>Last Month</option>
                    </select>
                    <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleExportPDF}>Export PDF ↗</button>
                    <button className="btn-primary" style={{ fontSize: 13, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }} onClick={handleDownloadCSV}>📥 Download Report</button>
                </div>
            </div>

            <div className="page-content fade-in">
                {/* HERO KPI */}
                <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: "32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Net Profit ({period})</div>
                        <div style={{ fontSize: 56, fontWeight: 900, color: netProfit >= 0 ? "#fff" : "#f87171", letterSpacing: "-2px", lineHeight: 1 }}>
                            {netProfit >= 0 ? "$" : "-$"}{isDemo ? Math.abs(netProfit).toLocaleString() : "0"}
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>
                            {isDemo ? (
                                <>
                                    <span style={{ color: stats.profitMargin >= 15 ? "#4ade80" : "#facc15", fontWeight: 700 }}>{stats.profitMargin >= 0 ? "+" : ""}{stats.profitMargin.toFixed(1)}%</span> Profit Margin
                                    <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.2)" }}>•</span>
                                    <span style={{ color: "#ef4444", fontWeight: 600 }}>Food Cost: {stats.cogsRatio.toFixed(1)}%</span>
                                    <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.2)" }}>•</span>
                                    <span style={{ color: "#4ade80", fontWeight: 600 }}>Labor: {stats.laborRatio.toFixed(1)}%</span>
                                    <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.2)" }}>•</span>
                                    <span style={{ color: "#a78bfa", fontWeight: 600 }}>Prime: {stats.primeCostPct.toFixed(1)}%</span>
                                </>
                            ) : (
                                "Connect your POS and Payroll to see profit margins"
                            )}
                        </div>
                    </div>
                    {isDemo && (
                        <div style={{ width: 140, height: 140 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {isDemo ? (
                    <>
                        {/* AI FINANCIAL ADVISOR */}
                        <div style={{ background: "rgba(167,139,250,0.03)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "#a78bfa" }}>AI Financial Advisor</div>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Real-time analysis of your P&L metrics</div>
                                    </div>
                                </div>
                                {aiInsights.length > 3 && (
                                    <button onClick={() => setShowAllInsights(!showAllInsights)} style={{ fontSize: 11, padding: "6px 12px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6, color: "#a78bfa", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                                        {showAllInsights ? "Show Less" : `Show All (${aiInsights.length})`}
                                    </button>
                                )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {visibleInsights.map((insight, i) => {
                                    const s = INSIGHT_STYLES[insight.type];
                                    return (
                                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: "14px 16px" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.icon} {insight.title}</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{insight.detail}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid-2">
                            {/* INCOME STATEMENT BREAKDOWN */}
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Income Statement</span>
                                </div>
                                <div className="card-body" style={{ padding: "0" }}>
                                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Gross Sales</div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>${stats.totalRevenue.toLocaleString()}</div>
                                    </div>

                                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Cost of Goods Sold (COGS)</div>
                                            <div style={{ fontSize: 11, color: stats.cogsRatio > 30 ? "var(--red)" : "#4ade80", marginTop: 3 }}>
                                                {stats.cogsRatio > 30 ? "⚠️" : "✅"} {stats.cogsRatio.toFixed(1)}% of Sales • Target: &lt;30%
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${stats.cogs.toLocaleString()}</div>
                                            <div style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", marginTop: 3, background: "rgba(96,165,250,0.06)", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>From POS</div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(250,204,21,0.02)" }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Labor Cost</div>
                                            <div style={{ fontSize: 11, color: stats.laborRatio > 33 ? "var(--red)" : stats.laborRatio > 28 ? "var(--yellow)" : "#4ade80", marginTop: 3 }}>
                                                {stats.laborRatio > 33 ? "🚨" : stats.laborRatio > 28 ? "⚠️" : "✅"} {stats.laborRatio.toFixed(1)}% of Sales • Target: 25-33%
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            {laborOverride ? (
                                                <input type="number" value={laborOverride} onChange={e => setLaborOverride(e.target.value)} style={{ width: 100, background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.2)", borderRadius: 6, padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#facc15", textAlign: "right", outline: "none", fontFamily: "inherit" }} />
                                            ) : (
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${stats.labor.toLocaleString()}</div>
                                            )}
                                            <button onClick={() => setLaborOverride(laborOverride ? "" : String(laborDefault))} style={{ fontSize: 10, color: "#facc15", background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)", padding: "2px 8px", borderRadius: 4, cursor: "pointer", marginTop: 4, fontFamily: "inherit", fontWeight: 600 }}>
                                                {laborOverride ? "✓ Use Default" : "✏️ Manual Entry"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Prime Cost Subtotal */}
                                    <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(167,139,250,0.03)" }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Prime Cost (COGS + Labor)</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>${(stats.cogs + stats.labor).toLocaleString()} • {stats.primeCostPct.toFixed(1)}%</div>
                                    </div>

                                    {/* Operating Expenses - Expandable */}
                                    <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setEditingOpex(!editingOpex)}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginRight: 6 }}>{editingOpex ? "▼" : "▶"}</span>
                                                    Operating Expenses ({opex.length} items)
                                                </div>
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Rent, Utilities, Insurance, Marketing, Tech</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>-${totalOpex.toLocaleString()}</div>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{stats.opexRatio.toFixed(1)}% of Sales</div>
                                            </div>
                                        </div>
                                        {editingOpex && (
                                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                                {opex.map((e, i) => (
                                                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{e.label}</span>
                                                        <span style={{ fontSize: 9, color: e.category === "fixed" ? "#60a5fa" : "#facc15", background: e.category === "fixed" ? "rgba(96,165,250,0.08)" : "rgba(250,204,21,0.08)", padding: "2px 6px", borderRadius: 3 }}>{e.category}</span>
                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginRight: 2 }}>$</span>
                                                            <input type="number" value={e.amount} onChange={ev => { const u = [...opex]; u[i].amount = parseFloat(ev.target.value) || 0; setOpex(u); }} style={{ width: 70, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "right", outline: "none", fontFamily: "inherit" }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                                                    Fixed: ${opex.filter(e => e.category === "fixed").reduce((a, e) => a + e.amount, 0).toLocaleString()} • Variable: ${opex.filter(e => e.category === "variable").reduce((a, e) => a + e.amount, 0).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", background: netProfit >= 0 ? "rgba(34,197,94,0.05)" : "rgba(248,113,113,0.05)", borderRadius: "0 0 16px 16px" }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: netProfit >= 0 ? "#4ade80" : "#f87171" }}>NET INCOME</div>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: netProfit >= 0 ? "#4ade80" : "#f87171" }}>{netProfit >= 0 ? "$" : "-$"}{Math.abs(netProfit).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN — CHARTS AND STATS */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {/* Profit Trend Chart */}
                                <div className="card">
                                    <div className="card-header">
                                        <span className="card-title">Profit Trend</span>
                                    </div>
                                    <div className="card-body" style={{ height: 180, padding: "10px 0 0 0" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

                                {/* Daily Revenue */}
                                <div className="card">
                                    <div className="card-header">
                                        <span className="card-title">Daily Revenue (This Week)</span>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>${DAILY_REVENUE.reduce((a, d) => a + d.revenue, 0).toLocaleString()} total</span>
                                    </div>
                                    <div className="card-body" style={{ height: 160, padding: "10px 0 0 0" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={DAILY_REVENUE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={v => `$${v / 1000}k`} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                                <Bar dataKey="revenue" fill="#E8C96E" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Cost Breakdown Stacked */}
                                <div className="card">
                                    <div className="card-header">
                                        <span className="card-title">Cost Distribution (COGS vs Labor)</span>
                                    </div>
                                    <div className="card-body" style={{ height: 160, padding: "10px 0 0 0" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={8} axisLine={false} tickLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={v => `$${v / 1000}k`} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                                <Bar dataKey="labor" stackId="a" fill="#4ade80" radius={[0, 0, 4, 4]} />
                                                <Bar dataKey="cogs" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BENCHMARKS */}
                        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                            {[
                                { label: "Revenue / Day", value: `$${Math.round(stats.totalRevenue / 28).toLocaleString()}`, sub: "avg", color: "#fff" },
                                { label: "Food Cost %", value: `${stats.cogsRatio.toFixed(1)}%`, sub: "target <30%", color: stats.cogsRatio > 30 ? "#f87171" : "#4ade80" },
                                { label: "Labor Cost %", value: `${stats.laborRatio.toFixed(1)}%`, sub: "target <33%", color: stats.laborRatio > 33 ? "#f87171" : stats.laborRatio > 28 ? "#facc15" : "#4ade80" },
                                { label: "Prime Cost %", value: `${stats.primeCostPct.toFixed(1)}%`, sub: "target <65%", color: stats.primeCostPct > 65 ? "#f87171" : stats.primeCostPct > 60 ? "#facc15" : "#4ade80" },
                                { label: "Avg Check", value: `$${Math.round(DAILY_REVENUE.reduce((a, d) => a + d.revenue, 0) / DAILY_REVENUE.reduce((a, d) => a + d.orders, 0))}`, sub: `${DAILY_REVENUE.reduce((a, d) => a + d.orders, 0)} covers`, color: "#E8C96E" },
                            ].map(m => (
                                <div key={m.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{m.label}</div>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.sub}</div>
                                </div>
                            ))}
                        </div>
                    </>
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

            {/* ── ANOMALY DETECTION ── */}
            {isDemo && (
                <div className="card" style={{ marginTop: 20 }}>
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>🔍</span>
                            <div>
                                <span className="card-title" style={{ display: "block" }}>AI Anomaly Detection</span>
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Real-time pattern analysis across revenue, costs, and operations</span>
                            </div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.1)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.2)" }}>
                            LIVE
                        </div>
                    </div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px" }}>
                        {(() => {
                            const anomalies: { severity: "critical" | "warning" | "info"; title: string; detail: string; metric: string; action: string }[] = [];

                            // Revenue spike/drop detection
                            const avgRevenue = DAILY_REVENUE.reduce((a, d) => a + d.revenue, 0) / DAILY_REVENUE.length;
                            DAILY_REVENUE.forEach(d => {
                                if (d.revenue < avgRevenue * 0.7) {
                                    anomalies.push({
                                        severity: "warning",
                                        title: `Revenue Drop on ${d.day}`,
                                        detail: `$${d.revenue.toLocaleString()} is ${((1 - d.revenue / avgRevenue) * 100).toFixed(0)}% below daily average ($${Math.round(avgRevenue).toLocaleString()}).`,
                                        metric: `$${d.revenue.toLocaleString()} vs $${Math.round(avgRevenue).toLocaleString()} avg`,
                                        action: "Review that day's staffing, weather, and special events."
                                    });
                                }
                                if (d.revenue > avgRevenue * 1.45) {
                                    anomalies.push({
                                        severity: "info",
                                        title: `Revenue Spike on ${d.day}`,
                                        detail: `$${d.revenue.toLocaleString()} is ${((d.revenue / avgRevenue - 1) * 100).toFixed(0)}% above daily average. Look for replicable factors.`,
                                        metric: `$${d.revenue.toLocaleString()} vs $${Math.round(avgRevenue).toLocaleString()} avg`,
                                        action: "Analyze that day's menu specials, events, or marketing."
                                    });
                                }
                            });

                            // Week-over-week revenue volatility
                            const w3 = WEEKLY_DATA[2].revenue;
                            const w4 = WEEKLY_DATA[3].revenue;
                            const weekChange = ((w4 - w3) / w3) * 100;
                            if (Math.abs(weekChange) > 25) {
                                anomalies.push({
                                    severity: weekChange < 0 ? "critical" : "info",
                                    title: weekChange < 0 ? "Weekly Revenue Crash" : "Exceptional Weekly Growth",
                                    detail: `Week 4 (${weekChange > 0 ? "+" : ""}${weekChange.toFixed(1)}%) vs Week 3. ${weekChange > 0 ? "Great trend! Identify what drove this growth." : "Investigate root cause immediately."}`,
                                    metric: `$${w4.toLocaleString()} vs $${w3.toLocaleString()}`,
                                    action: weekChange < 0 ? "Check for delivery issues, negative reviews, or staffing problems." : "Replicate successful marketing, menu items, or events."
                                });
                            }

                            // COGS anomaly
                            if (stats.cogsRatio > 35) {
                                anomalies.push({
                                    severity: "critical",
                                    title: "COGS Ratio Critical",
                                    detail: `Food cost at ${stats.cogsRatio.toFixed(1)}% is far above the 30% target. Possible waste, theft, or supplier price increase.`,
                                    metric: `${stats.cogsRatio.toFixed(1)}% vs 30% target`,
                                    action: "Audit inventory counts, check for waste, review supplier invoices."
                                });
                            }

                            // Labor anomaly
                            if (stats.laborRatio > 35) {
                                anomalies.push({
                                    severity: "critical",
                                    title: "Labor Overrun Detected",
                                    detail: `Labor cost ${stats.laborRatio.toFixed(1)}% exceeds safe threshold. Possible overtime, overstaffing, or scheduling errors.`,
                                    metric: `${stats.laborRatio.toFixed(1)}% vs 30% target`,
                                    action: "Review schedule page for overtime employees and optimize shifts."
                                });
                            }

                            // Orders per dollar anomaly
                            const avgOrderValue = Math.round(DAILY_REVENUE.reduce((a, d) => a + d.revenue, 0) / DAILY_REVENUE.reduce((a, d) => a + d.orders, 0));
                            if (avgOrderValue < 35) {
                                anomalies.push({
                                    severity: "warning",
                                    title: "Low Average Order Value",
                                    detail: `Average ticket is $${avgOrderValue} — below the $40 industry benchmark for full-service restaurants.`,
                                    metric: `$${avgOrderValue} vs $40 benchmark`,
                                    action: "Train staff on upselling, add combo deals, or review menu pricing."
                                });
                            }

                            // If no anomalies, show all clear
                            if (anomalies.length === 0) {
                                return (
                                    <div style={{ textAlign: "center", padding: "24px 16px" }}>
                                        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>No Anomalies Detected</div>
                                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>All financial metrics are within normal operating ranges.</div>
                                    </div>
                                );
                            }

                            const sevColors = {
                                critical: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", color: "#f87171", icon: "🚨", badge: "CRITICAL" },
                                warning: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)", color: "#fbbf24", icon: "⚠️", badge: "WARNING" },
                                info: { bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)", color: "#60a5fa", icon: "📊", badge: "INSIGHT" },
                            };

                            return anomalies.map((a, i) => {
                                const sev = sevColors[a.severity];
                                return (
                                    <div key={i} style={{ background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 14, padding: "16px 18px" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>{sev.icon}</span>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: sev.color }}>{a.title}</span>
                                            </div>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: sev.color, background: `${sev.color}15`, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>{sev.badge}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 8 }}>{a.detail}</div>
                                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                            <div style={{ fontSize: 11, color: sev.color, fontWeight: 600 }}>📐 {a.metric}</div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>💡 {a.action}</div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* CUSTOM TOAST NOTIFICATION */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}


        </>
    );
}
