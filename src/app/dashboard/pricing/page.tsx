"use client";
import { useState, useEffect } from "react";
import { useIsDemo } from "@/lib/use-demo";

interface PriceRec {
    recipeId: string;
    recipeName: string;
    category: string;
    type: "food" | "drink";
    currentPrice: number;
    currentCost: number;
    currentMargin: number;
    targetMargin: number;
    suggestedPrice: number;
    priceChange: number;
    reason: string;
    reasonText: string;
    reasonShort: string;
    dailySold: number;
    demandLevel: "hot" | "steady" | "cold";
    weeklyTrend: number[];
    monthlyRevenueImpact: number;
    confidence: string;
}

interface PricingData {
    recommendations: PriceRec[];
    stats: {
        totalItems: number;
        avgMargin: number;
        underpricedCount: number;
        highDemandCount: number;
        monthlyRevenueImpact: number;
        optimalCount: number;
    };
    insights: { type: string; text: string }[];
}

type FilterTab = "all" | "food" | "drink" | "action" | "optimal";

export default function PricingPage() {
    const [data, setData] = useState<PricingData | null>(null);
    const [filter, setFilter] = useState<FilterTab>("all");
    const [selected, setSelected] = useState<PriceRec | null>(null);
    const [simPrice, setSimPrice] = useState(0);
    const [appliedPrices, setAppliedPrices] = useState<Record<string, number>>({});
    const [toast, setToast] = useState<string | null>(null);
    const isDemo = useIsDemo();

    useEffect(() => {
        fetch("/api/pricing").then(r => r.json()).then(setData).catch(() => { });
    }, []);

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    function applyPrice(rec: PriceRec) {
        setAppliedPrices(prev => ({ ...prev, [rec.recipeId]: rec.suggestedPrice }));
        showToast(`✅ ${rec.recipeName} price updated: $${rec.currentPrice} → $${rec.suggestedPrice}`);
        // Dispatch event for recipe page sync
        window.dispatchEvent(new CustomEvent("price-updated", {
            detail: { recipeId: rec.recipeId, newPrice: rec.suggestedPrice }
        }));
    }

    function applySimPrice(rec: PriceRec) {
        setAppliedPrices(prev => ({ ...prev, [rec.recipeId]: simPrice }));
        showToast(`✅ ${rec.recipeName} price updated: $${rec.currentPrice} → $${simPrice}`);
        setSelected(null);
    }

    if (!data) {
        return (
            <div style={{ padding: "32px", color: "#fff" }}>
                <h1 style={{ fontSize: 24, marginBottom: 16 }}>💲 AI Dynamic Pricing</h1>
                <div style={{ color: "#9ca3af" }}>Loading pricing data...</div>
            </div>
        );
    }

    const { recommendations, stats, insights } = data;

    // If no recommendations (real user, no POS data), show empty state
    if (recommendations.length === 0) {
        return (
            <div style={{ padding: "24px 28px", color: "#fff", minHeight: "100vh" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                            💲 AI Dynamic Pricing
                        </h1>
                        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                            AI-powered price recommendations based on ingredient costs, demand patterns, and market signals
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ fontSize: 56, marginBottom: 20 }}>💲</div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Dynamic Pricing Engine</h2>
                    <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto 16px" }}>
                        Connect your POS system and add menu recipes to unlock AI-powered price recommendations.
                    </p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", maxWidth: 500, margin: "0 auto 28px" }}>
                        The AI engine analyzes ingredient costs, sales velocity, demand patterns, and market signals to suggest optimal pricing for every item on your menu.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button onClick={() => window.location.href = '/dashboard/recipes'} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", color: "#1a1000", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Go to Recipes</button>
                        <button onClick={() => window.location.href = '/dashboard/inventory'} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Manage Inventory</button>
                    </div>
                </div>
            </div>
        );
    }

    const filtered = recommendations.filter(r => {
        if (filter === "food") return r.type === "food";
        if (filter === "drink") return r.type === "drink";
        if (filter === "action") return r.reason !== "optimal";
        if (filter === "optimal") return r.reason === "optimal";
        return true;
    });

    const marginColor = (m: number, target: number) => {
        if (m >= target) return "#4ade80";
        if (m >= target - 10) return "#fbbf24";
        return "#ef4444";
    };

    const demandBadge = (d: string) => {
        if (d === "hot") return { bg: "#22c55e20", color: "#4ade80", text: "🔥 Hot" };
        if (d === "steady") return { bg: "#3b82f620", color: "#60a5fa", text: "📊 Steady" };
        return { bg: "#ef444420", color: "#f87171", text: "❄️ Cold" };
    };

    const reasonBadge = (reason: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            cost_increase: { bg: "#ef444425", color: "#f87171" },
            cost_decrease: { bg: "#3b82f625", color: "#60a5fa" },
            high_demand: { bg: "#22c55e25", color: "#4ade80" },
            low_demand: { bg: "#f59e0b25", color: "#fbbf24" },
            overpriced: { bg: "#a855f725", color: "#c084fc" },
            optimal: { bg: "#6b728020", color: "#9ca3af" },
        };
        return map[reason] || map.optimal;
    };

    const Sparkline = ({ data: d, color }: { data: number[]; color: string }) => {
        const w = 80, h = 24;
        const min = Math.min(...d), max = Math.max(...d);
        const range = max - min || 1;
        const pts = d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
        return (
            <svg width={w} height={h} style={{ display: "block" }}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    return (
        <div style={{ padding: "24px 28px", color: "#fff", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                        💲 AI Dynamic Pricing
                    </h1>
                    <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                        AI-powered price recommendations based on ingredient costs, demand patterns, and market signals
                    </p>
                </div>
                <div style={{
                    background: "linear-gradient(135deg, #C9A84C33, #C9A84C11)",
                    border: "1px solid #C9A84C44",
                    borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#C9A84C"
                }}>
                    ✨ AI Engine Active
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Revenue Impact", value: `+$${stats.monthlyRevenueImpact.toLocaleString()}/mo`, icon: "💰", color: "#4ade80", sub: "If all suggestions adopted" },
                    { label: "Avg Margin", value: `${stats.avgMargin}%`, icon: "📊", color: stats.avgMargin >= 65 ? "#4ade80" : "#fbbf24", sub: `${stats.totalItems} items analyzed` },
                    { label: "Underpriced", value: `${stats.underpricedCount} items`, icon: "⚠️", color: "#f59e0b", sub: "Below target margin" },
                    { label: "High Demand", value: `${stats.highDemandCount} items`, icon: "🔥", color: "#4ade80", sub: "Can sustain price increase" },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: "linear-gradient(145deg, #1a1d2e, #141620)",
                        border: "1px solid #2a2d3e",
                        borderRadius: 12, padding: "16px 20px",
                        position: "relative", overflow: "hidden"
                    }}>
                        <div style={{ position: "absolute", top: -10, right: -5, fontSize: 48, opacity: 0.06 }}>{kpi.icon}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{kpi.icon} {kpi.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {([
                    { key: "all", label: "All Items", count: recommendations.length },
                    { key: "action", label: "⚡ Action Needed", count: recommendations.filter(r => r.reason !== "optimal").length },
                    { key: "food", label: "🍽️ Food", count: recommendations.filter(r => r.type === "food").length },
                    { key: "drink", label: "🍸 Drinks", count: recommendations.filter(r => r.type === "drink").length },
                    { key: "optimal", label: "✅ Optimal", count: recommendations.filter(r => r.reason === "optimal").length },
                ] as { key: FilterTab; label: string; count: number }[]).map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: filter === tab.key ? "1px solid #C9A84C" : "1px solid #2a2d3e",
                        background: filter === tab.key ? "#C9A84C18" : "#1a1d2e",
                        color: filter === tab.key ? "#C9A84C" : "#9ca3af",
                        cursor: "pointer", transition: "all 0.2s"
                    }}>
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div style={{ display: "flex", gap: 20 }}>
                {/* Pricing Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        background: "#1a1d2e", border: "1px solid #2a2d3e",
                        borderRadius: 12, overflow: "hidden"
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.7fr 1fr 0.8fr 0.7fr 0.6fr",
                            padding: "12px 16px", fontSize: 11, color: "#6b7280", fontWeight: 600,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                            borderBottom: "1px solid #2a2d3e", background: "#141620"
                        }}>
                            <div>Item</div>
                            <div>Price</div>
                            <div>Cost</div>
                            <div>Margin</div>
                            <div>Sold/Day</div>
                            <div>AI Suggested</div>
                            <div>Reason</div>
                            <div>Trend</div>
                            <div></div>
                        </div>

                        {/* Table Rows */}
                        {filtered.map(rec => {
                            const applied = appliedPrices[rec.recipeId];
                            const rb = reasonBadge(rec.reason);
                            const db = demandBadge(rec.demandLevel);
                            const isSelected = selected?.recipeId === rec.recipeId;

                            return (
                                <div key={rec.recipeId}
                                    onClick={() => { setSelected(rec); setSimPrice(rec.suggestedPrice); }}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.7fr 1fr 0.8fr 0.7fr 0.6fr",
                                        padding: "14px 16px", fontSize: 13, alignItems: "center",
                                        borderBottom: "1px solid #1e2130",
                                        cursor: "pointer", transition: "all 0.15s",
                                        background: isSelected ? "#C9A84C10" : applied ? "#22c55e08" : "transparent",
                                        borderLeft: isSelected ? "3px solid #C9A84C" : "3px solid transparent",
                                    }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#f3f4f6" }}>
                                            {rec.type === "drink" ? "🍸 " : ""}{rec.recipeName}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{rec.category}</div>
                                    </div>
                                    <div style={{ fontWeight: 600, color: applied ? "#4ade80" : "#f3f4f6" }}>
                                        ${applied || rec.currentPrice}
                                        {applied && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 2 }}>✓</span>}
                                    </div>
                                    <div style={{ color: "#9ca3af" }}>${rec.currentCost.toFixed(2)}</div>
                                    <div>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                            background: `${marginColor(rec.currentMargin, rec.targetMargin)}18`,
                                            color: marginColor(rec.currentMargin, rec.targetMargin),
                                        }}>
                                            {rec.currentMargin}%
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 6, fontSize: 11,
                                            background: db.bg, color: db.color
                                        }}>
                                            {rec.dailySold}/day
                                        </span>
                                    </div>
                                    <div>
                                        {rec.priceChange !== 0 ? (
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                                                <span style={{ color: "#f3f4f6" }}>${rec.suggestedPrice}</span>
                                                <span style={{
                                                    marginLeft: 6, padding: "2px 6px", borderRadius: 4, fontSize: 11,
                                                    background: rec.priceChange > 0 ? "#C9A84C25" : "#3b82f625",
                                                    color: rec.priceChange > 0 ? "#C9A84C" : "#60a5fa",
                                                }}>
                                                    {rec.priceChange > 0 ? "↑" : "↓"}${Math.abs(rec.priceChange)}
                                                </span>
                                            </span>
                                        ) : (
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>— No change</span>
                                        )}
                                    </div>
                                    <div>
                                        <span style={{
                                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                            background: rb.bg, color: rb.color,
                                        }}>
                                            {rec.reasonShort}
                                        </span>
                                    </div>
                                    <div>
                                        <Sparkline data={rec.weeklyTrend} color={marginColor(rec.currentMargin, rec.targetMargin)} />
                                    </div>
                                    <div>
                                        {rec.priceChange !== 0 && !applied && (
                                            <button onClick={(e) => { e.stopPropagation(); applyPrice(rec); }} style={{
                                                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                background: "#C9A84C", color: "#000", border: "none", cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}>
                                                Apply
                                            </button>
                                        )}
                                        {applied && (
                                            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Applied ✓</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Simulator Panel */}
                {selected && (
                    <div style={{
                        width: 320, flexShrink: 0,
                        background: "linear-gradient(145deg, #1a1d2e, #141620)",
                        border: "1px solid #2a2d3e", borderRadius: 12,
                        padding: 20, position: "sticky", top: 24, alignSelf: "flex-start"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🎛️ Price Simulator</h3>
                            <button onClick={() => setSelected(null)} style={{
                                background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18
                            }}>×</button>
                        </div>

                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.recipeName}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>{selected.category} • {selected.type}</div>

                        {/* Current vs Proposed */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            <div style={{ background: "#2a2d3e40", borderRadius: 8, padding: 12, textAlign: "center" }}>
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>Current</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: "#f3f4f6" }}>${selected.currentPrice}</div>
                                <div style={{ fontSize: 11, color: marginColor(selected.currentMargin, selected.targetMargin) }}>
                                    {selected.currentMargin}% margin
                                </div>
                            </div>
                            <div style={{ background: "#C9A84C12", border: "1px solid #C9A84C33", borderRadius: 8, padding: 12, textAlign: "center" }}>
                                <div style={{ fontSize: 11, color: "#C9A84C" }}>Simulated</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>${simPrice}</div>
                                <div style={{ fontSize: 11, color: "#4ade80" }}>
                                    {simPrice > 0 ? Math.round(((simPrice - selected.currentCost) / simPrice) * 100) : 0}% margin
                                </div>
                            </div>
                        </div>

                        {/* Slider */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                                <span>${Math.floor(selected.currentPrice * 0.75)}</span>
                                <span>${Math.ceil(selected.currentPrice * 1.30)}</span>
                            </div>
                            <input type="range"
                                min={Math.floor(selected.currentPrice * 0.75)}
                                max={Math.ceil(selected.currentPrice * 1.30)}
                                value={simPrice}
                                onChange={e => setSimPrice(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "#C9A84C" }}
                            />
                        </div>

                        {/* Revenue Impact */}
                        <div style={{
                            background: "#2a2d3e30", borderRadius: 8, padding: 12, marginBottom: 16
                        }}>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Monthly Revenue Impact</div>
                            {[
                                { label: "Daily Revenue", current: selected.currentPrice * selected.dailySold, sim: simPrice * selected.dailySold },
                                { label: "Monthly Revenue", current: selected.currentPrice * selected.dailySold * 30, sim: simPrice * selected.dailySold * 30 },
                                { label: "Profit per Item", current: selected.currentPrice - selected.currentCost, sim: simPrice - selected.currentCost },
                            ].map((row, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                                    <span style={{ color: "#9ca3af" }}>{row.label}</span>
                                    <span>
                                        <span style={{ color: "#6b7280" }}>${Math.round(row.current).toLocaleString()}</span>
                                        <span style={{ color: "#C9A84C", marginLeft: 6 }}>→ ${Math.round(row.sim).toLocaleString()}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* AI Reason */}
                        <div style={{
                            background: "#C9A84C10", border: "1px solid #C9A84C22",
                            borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, lineHeight: 1.5, color: "#d4d4d8"
                        }}>
                            <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600, marginBottom: 4 }}>✨ AI Analysis</div>
                            {selected.reasonText}
                        </div>

                        {/* Apply Button */}
                        <button onClick={() => applySimPrice(selected)} style={{
                            width: "100%", padding: "12px 0", borderRadius: 8,
                            background: "linear-gradient(135deg, #C9A84C, #b8952e)",
                            color: "#000", fontWeight: 700, fontSize: 14,
                            border: "none", cursor: "pointer", transition: "all 0.2s",
                            letterSpacing: "0.02em"
                        }}>
                            Apply ${simPrice} Price
                        </button>
                    </div>
                )}
            </div>

            {/* AI Insights */}
            <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>✨ AI Insights</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {insights.map((insight, i) => {
                        const borderColor = insight.type === "critical" ? "#ef4444" : insight.type === "opportunity" ? "#4ade80" : "#3b82f6";
                        const icon = insight.type === "critical" ? "🔴" : insight.type === "opportunity" ? "🟢" : "🔵";
                        return (
                            <div key={i} style={{
                                background: "#1a1d2e", border: "1px solid #2a2d3e",
                                borderLeft: `4px solid ${borderColor}`,
                                borderRadius: 10, padding: 16
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: borderColor, marginBottom: 6 }}>
                                    {icon} {insight.type === "critical" ? "Action Required" : insight.type === "opportunity" ? "Revenue Opportunity" : "Market Intel"}
                                </div>
                                <div style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.5 }}>
                                    {insight.text}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                    background: "#1a1d2e", border: "1px solid #4ade80",
                    borderRadius: 10, padding: "12px 24px", fontSize: 14, color: "#4ade80",
                    fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 24px #00000080",
                    animation: "fadeIn 0.3s ease"
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
