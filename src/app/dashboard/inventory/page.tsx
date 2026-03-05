"use client";
import { useState, useEffect } from "react";

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [statusFilter, setStatus] = useState("ALL");

    useEffect(() => {
        fetch("/api/inventory").then(r => r.json()).then(setData);
    }, []);

    const items: any[] = data?.inventory ?? [];
    const categories = ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];

    const filtered = items.filter((i: any) =>
        (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
        (category === "All" || i.category === category) &&
        (statusFilter === "ALL" || i.status === statusFilter)
    );

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
                    <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                        🟢 Toast POS Connected (Demo)
                    </span>
                </div>
            </div>

            <div className="page-content fade-in">
                {/* KPIs */}
                <div className="kpi-grid">
                    {[
                        { label: "Total Items", icon: "📦", value: data?.stats?.total, color: "var(--text-primary)" },
                        { label: "In Stock", icon: "✅", value: data?.stats?.inStock, color: "var(--green)" },
                        { label: "Low Stock", icon: "⚠️", value: data?.stats?.lowStock, color: "var(--yellow)" },
                        { label: "Out of Stock", icon: "🚨", value: data?.stats?.outOfStock, color: "var(--red)" },
                    ].map(c => (
                        <div key={c.label} className="kpi-card">
                            <div className="kpi-label">{c.icon} {c.label}</div>
                            <div className="kpi-value" style={{ color: c.color }}>{c.value ?? "—"}</div>
                        </div>
                    ))}
                </div>

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
            </div>
        </>
    );
}
