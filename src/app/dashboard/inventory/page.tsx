"use client";
import { useState, useEffect } from "react";

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [statusFilter, setStatus] = useState("ALL");
    const [activeTab, setActiveTab] = useState<"All" | "Food" | "Drink">("All");
    const [isDemo, setIsDemo] = useState(true);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(restName.toLowerCase() === "meyhouse");
            })
            .catch(() => { });
        fetch("/api/inventory").then(r => r.json()).then(setData);
    }, []);

    const items: any[] = isDemo ? (data?.inventory ?? []) : [];
    const categories = ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];

    const filtered = items.filter((i: any) => {
        const isDrink = i.category === "Beverages" || i.category === "Alcohol";
        const matchesTab = activeTab === "All" || (activeTab === "Drink" ? isDrink : !isDrink);
        return (
            matchesTab &&
            (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
            (category === "All" || i.category === category) &&
            (statusFilter === "ALL" || i.status === statusFilter)
        );
    });

    const statusClass: Record<string, string> = {
        IN_STOCK: "badge-green", LOW_STOCK: "badge-yellow", OUT_OF_STOCK: "badge-red",
    };
    const statusLabel: Record<string, string> = {
        IN_STOCK: "In Stock", LOW_STOCK: "Low", OUT_OF_STOCK: "OUT",
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📦 Inventory</div>
                <div className="topbar-right">
                    {isDemo ? (
                        <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                            🟢 Toast POS Connected (Demo)
                        </span>
                    ) : (
                        <span style={{ fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                            ⚪ POS Not Connected
                        </span>
                    )}
                </div>
            </div>

            {/* TAB SELECTOR: Food vs Drink */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
                    {(["All", "Food", "Drink"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            style={{
                                background: "none", border: "none", padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                color: activeTab === t ? "#E8C96E" : "rgba(255,255,255,0.4)",
                                borderBottom: activeTab === t ? "2px solid #C9A84C" : "2px solid transparent",
                                transition: "all 0.2s"
                            }}
                        >
                            {t === "All" ? "📦 All Items" : t === "Food" ? "🍽️ Food" : "🍹 Drink"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-content fade-in">
                {/* KPIs */}
                <div className="kpi-grid">
                    {[
                        { label: "Total Items", icon: "📦", value: isDemo ? data?.stats?.total : 0, color: "var(--text-primary)" },
                        { label: "In Stock", icon: "✅", value: isDemo ? data?.stats?.inStock : 0, color: "var(--green)" },
                        { label: "Low Stock", icon: "⚠️", value: isDemo ? data?.stats?.lowStock : 0, color: "var(--yellow)" },
                        { label: "Out of Stock", icon: "🚨", value: isDemo ? data?.stats?.outOfStock : 0, color: "var(--red)" },
                    ].map(c => (
                        <div key={c.label} className="kpi-card">
                            <div className="kpi-label">{c.icon} {c.label}</div>
                            <div className="kpi-value" style={{ color: c.color }}>{c.value ?? "—"}</div>
                        </div>
                    ))}
                </div>

                {isDemo ? (
                    <>
                        {(data?.stats?.outOfStock ?? 0) > 0 && (
                            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                                <span>🚨</span>
                                <strong>{data.stats.outOfStock} items out of stock</strong> — may affect tonight&apos;s menu!
                            </div>
                        )}

                        {/* Filters */}
                        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search items…"
                                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "var(--text-primary)", outline: "none", width: 220 }}
                            />
                            <div style={{ display: "flex", gap: 6 }}>
                                {["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map(s => (
                                    <button key={s} onClick={() => setStatus(s)} style={{
                                        fontSize: 12, padding: "8px 13px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                        background: statusFilter === s ? "var(--bg-card-hover)" : "var(--bg-card)",
                                        border: `1px solid ${statusFilter === s ? "var(--border-light)" : "var(--border)"}`,
                                        color: statusFilter === s ? "var(--text-primary)" : "var(--text-muted)",
                                        fontWeight: statusFilter === s ? 600 : 400,
                                    }}>
                                        {s === "ALL" ? "All" : s === "IN_STOCK" ? "In Stock" : s === "LOW_STOCK" ? "Low" : "Out"}
                                    </button>
                                ))}
                            </div>
                            <select value={category} onChange={e => setCategory(e.target.value)} style={{
                                background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                                padding: "9px 14px", fontSize: 13, color: "var(--text-secondary)", outline: "none", cursor: "pointer", fontFamily: "inherit",
                            }}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Table */}
                        <div className="card">
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th><th>Category</th><th>Status</th>
                                            <th>Quantity</th><th>Threshold</th><th>Cost/Unit</th><th>Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!data && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading from Toast POS…</td></tr>}
                                        {filtered.length === 0 && data && <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No items match your filters</td></tr>}
                                        {filtered.map((item: any) => (
                                            <tr key={item.guid}>
                                                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                    {item.status === "OUT_OF_STOCK" && <span style={{ marginRight: 6 }}>🚨</span>}
                                                    {item.status === "LOW_STOCK" && <span style={{ marginRight: 6 }}>⚠️</span>}
                                                    {item.name}
                                                </td>
                                                <td><span className="badge badge-blue">{item.category}</span></td>
                                                <td><span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></td>
                                                <td style={{ fontWeight: 600, color: item.status === "OUT_OF_STOCK" ? "var(--red)" : item.status === "LOW_STOCK" ? "var(--yellow)" : "var(--text-primary)" }}>
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.threshold} {item.unit}</td>
                                                <td style={{ color: "var(--text-muted)" }}>${item.costPerUnit}</td>
                                                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.lastUpdated}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Inventory Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            To monitor live stock levels, low-stock alerts, and COGS margins, connect your point of sale system.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Go to Integrations
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
