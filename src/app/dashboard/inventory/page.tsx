"use client";
import { useState, useEffect } from "react";

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [statusFilter, setStatus] = useState("ALL");
    const [activeTab, setActiveTab] = useState<"All" | "Food" | "Drink">("All");
    const [isDemo, setIsDemo] = useState(true);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ quantity: 0, threshold: 0, status: "IN_STOCK" });

    useEffect(() => {
        const init = async () => {
            try {
                const locRes = await fetch("/api/locations");
                const locData = await locRes.json();
                setIsDemo(!!locData.restaurantName);

                const invRes = await fetch("/api/inventory");
                const invData = await invRes.json();
                setData(invData);
            } catch (e) {
                console.error("Failed to load inventory:", e);
            } finally {
                setLoading(false);
            }
        };
        init();
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

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleOrder = (name: string) => {
        showToast(`Purchase Order created for ${name}. Supplier notified.`);
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📦 Inventory</div>
                <div className="topbar-right">
                    {loading ? (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Syncing with POS...</span>
                    ) : isDemo ? (
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

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

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

                {loading ? (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}></div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Syncing with Toast POS...</div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : isDemo ? (
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
                                            <th>Quantity</th><th>Threshold</th><th>Cost/Unit</th><th>Action</th>
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
                                                <td>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button onClick={() => handleOrder(item.name)} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>
                                                            Restock ↗
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setEditForm({ quantity: item.quantity, threshold: item.threshold, status: item.status });
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>
                                                            ✎
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* EDIT MODAL */}
                        {isEditModalOpen && editingItem && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(8px)" }}>
                                <div className="card" style={{ width: 400, padding: 32 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 24 }}>Edit Item: {editingItem.name}</h2>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Quantity ({editingItem.unit})</label>
                                        <input
                                            type="number"
                                            value={editForm.quantity}
                                            onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Threshold ({editingItem.unit})</label>
                                        <input
                                            type="number"
                                            value={editForm.threshold}
                                            onChange={e => setEditForm({ ...editForm, threshold: parseFloat(e.target.value) || 0 })}
                                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 24 }}>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Status</label>
                                        <select
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                            style={{ width: "100%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
                                        >
                                            <option value="IN_STOCK">In Stock</option>
                                            <option value="LOW_STOCK">Low Stock</option>
                                            <option value="OUT_OF_STOCK">Out of Stock</option>
                                        </select>
                                    </div>

                                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                        <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                const updatedItems = data.inventory.map((i: any) =>
                                                    i.guid === editingItem.guid ? { ...i, ...editForm } : i
                                                );
                                                setData({ ...data, inventory: updatedItems });
                                                setIsEditModalOpen(false);
                                                showToast(`${editingItem.name} updated manually.`);
                                            }}
                                            style={{ padding: "10px 24px" }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
