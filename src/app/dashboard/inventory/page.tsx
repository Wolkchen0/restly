"use client";
import { useState, useEffect } from "react";
import { BOTTLE_INVENTORY, DRINK_RECIPES, DEMO_DRINK_SALES, getTotalMlRemaining, getServingsRemaining, getPourCost, formatBottleRemaining, getCocktailsUsing, type BottleInfo } from "@/services/drinks";

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
    const [lastSynced, setLastSynced] = useState<string>("");
    const [syncCountdown, setSyncCountdown] = useState(600);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", category: "Proteins", quantity: 0, unit: "lbs", threshold: 0, costPerUnit: 0, supplier: "" });
    const [bottles, setBottles] = useState<BottleInfo[]>(BOTTLE_INVENTORY);
    const [selectedBottle, setSelectedBottle] = useState<string | null>(null);
    const [drinkSearch, setDrinkSearch] = useState("");
    const [drinkSubTab, setDrinkSubTab] = useState<"bottles" | "cocktails">("bottles");

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

        const syncTimer = setInterval(() => {
            setSyncCountdown(prev => {
                if (prev <= 1) {
                    setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
                    return 600;
                }
                return prev - 1;
            });
        }, 1000);
        setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));

        return () => clearInterval(syncTimer);
    }, []);

    const items: any[] = isDemo ? (data?.inventory ?? []) : [];
    const categories = ["All", ...Array.from(new Set(items.map((i: any) => i.category)))];
    const filtered = items.filter((i: any) => {
        const isDrink = i.category === "Beverages" || i.category === "Alcohol";
        const matchesTab = activeTab === "All" || (activeTab === "Drink" ? isDrink : !isDrink);
        return matchesTab && (!search || i.name.toLowerCase().includes(search.toLowerCase())) && (category === "All" || i.category === category) && (statusFilter === "ALL" || i.status === statusFilter);
    });

    const statusClass: Record<string, string> = { IN_STOCK: "badge-green", LOW_STOCK: "badge-yellow", OUT_OF_STOCK: "badge-red" };
    const statusLabel: Record<string, string> = { IN_STOCK: "In Stock", LOW_STOCK: "Low", OUT_OF_STOCK: "OUT" };

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
    const handleOrder = (name: string) => { showToast(`Purchase Order created for ${name}. Supplier notified.`); };

    // Drink helpers
    const filteredBottles = bottles.filter(b => !drinkSearch || b.name.toLowerCase().includes(drinkSearch.toLowerCase()));
    const filteredRecipes = DRINK_RECIPES.filter(r => !drinkSearch || r.name.toLowerCase().includes(drinkSearch.toLowerCase()));

    const getBottleStatus = (b: BottleInfo) => {
        const total = getTotalMlRemaining(b);
        if (total === 0) return "OUT";
        if (b.fullBottles <= 1 && b.openBottleMl < b.sizeMl * 0.3) return "Low";
        return "OK";
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">Inventory</div>
                <div className="topbar-right" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {loading ? (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Syncing with POS...</span>
                    ) : isDemo ? (
                        <>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Next sync: {Math.floor(syncCountdown / 60)}m {syncCountdown % 60}s · Last: {lastSynced}</span>
                            <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>POS Connected</span>
                            <button onClick={() => setIsAddModalOpen(true)} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", color: "#1a1000", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Item</button>
                        </>
                    ) : (
                        <span style={{ fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>POS Not Connected</span>
                    )}
                </div>
            </div>

            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* TAB SELECTOR */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
                    {(["All", "Food", "Drink"] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{
                            background: "none", border: "none", padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            color: activeTab === t ? "#E8C96E" : "rgba(255,255,255,0.4)",
                            borderBottom: activeTab === t ? "2px solid #C9A84C" : "2px solid transparent",
                        }}>
                            {t === "All" ? "All Items" : t === "Food" ? "Food" : "Bar & Drinks"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-content fade-in">
                {/* DRINK TAB - BAR & BOTTLE TRACKING */}
                {activeTab === "Drink" && isDemo ? (
                    <>
                        {/* Drink Sub-tabs */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                            {(["bottles", "cocktails"] as const).map(st => (
                                <button key={st} onClick={() => setDrinkSubTab(st)} style={{
                                    fontSize: 13, padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                    background: drinkSubTab === st ? "rgba(201,168,76,0.15)" : "var(--bg-card)",
                                    border: `1px solid ${drinkSubTab === st ? "rgba(201,168,76,0.3)" : "var(--border)"}`,
                                    color: drinkSubTab === st ? "#E8C96E" : "var(--text-muted)", fontWeight: drinkSubTab === st ? 700 : 400,
                                }}>
                                    {st === "bottles" ? "Bottle Inventory" : "Cocktail Recipes"}
                                </button>
                            ))}
                            <input type="text" value={drinkSearch} onChange={e => setDrinkSearch(e.target.value)} placeholder="Search drinks..." style={{ marginLeft: "auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "var(--text-primary)", outline: "none", width: 200 }} />
                        </div>

                        {/* BOTTLE INVENTORY VIEW */}
                        {drinkSubTab === "bottles" && (
                            <>
                                {/* Bottle KPIs */}
                                <div className="kpi-grid" style={{ marginBottom: 20 }}>
                                    {[
                                        { label: "Total Spirits", value: bottles.length, color: "var(--text-primary)" },
                                        { label: "In Stock", value: bottles.filter(b => getBottleStatus(b) === "OK").length, color: "var(--green)" },
                                        { label: "Running Low", value: bottles.filter(b => getBottleStatus(b) === "Low").length, color: "var(--yellow)" },
                                        { label: "Out of Stock", value: bottles.filter(b => getBottleStatus(b) === "OUT").length, color: "var(--red)" },
                                    ].map(c => (
                                        <div key={c.label} className="kpi-card">
                                            <div className="kpi-label">{c.label}</div>
                                            <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="card">
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Spirit</th><th>Category</th><th>Status</th>
                                                    <th>Full Bottles</th><th>Open Bottle</th><th>Total Remaining</th>
                                                    <th>Used In</th><th>Cost</th><th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBottles.map(b => {
                                                    const status = getBottleStatus(b);
                                                    const totalMl = getTotalMlRemaining(b);
                                                    const usedIn = getCocktailsUsing(b.spiritId);
                                                    return (
                                                        <tr key={b.spiritId}>
                                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                                {status === "OUT" && <span style={{ marginRight: 6 }}>🚨</span>}
                                                                {status === "Low" && <span style={{ marginRight: 6 }}>⚠️</span>}
                                                                {b.name}
                                                            </td>
                                                            <td><span className="badge badge-blue">{b.category}</span></td>
                                                            <td>
                                                                <span className={`badge ${status === "OK" ? "badge-green" : status === "Low" ? "badge-yellow" : "badge-red"}`}>
                                                                    {status === "OK" ? "In Stock" : status === "Low" ? "Low" : "OUT"}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontWeight: 700, color: b.fullBottles === 0 ? "var(--red)" : "var(--text-primary)" }}>
                                                                {b.fullBottles}
                                                            </td>
                                                            <td style={{ fontSize: 12 }}>
                                                                {b.openBottleMl > 0 ? (
                                                                    <span style={{ color: "#60a5fa" }}>{b.openBottleMl}ml / {b.sizeMl}ml</span>
                                                                ) : (
                                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                                )}
                                                            </td>
                                                            <td style={{ fontWeight: 600, color: totalMl === 0 ? "var(--red)" : totalMl < b.sizeMl * 2 ? "var(--yellow)" : "var(--green)" }}>
                                                                {totalMl > 0 ? `${(totalMl / 1000).toFixed(1)}L` : "0"}
                                                            </td>
                                                            <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 140 }}>
                                                                {usedIn.length > 0 ? usedIn.slice(0, 2).map(r => r.name).join(", ") + (usedIn.length > 2 ? ` +${usedIn.length - 2}` : "") : "—"}
                                                            </td>
                                                            <td style={{ color: "var(--text-muted)", fontSize: 12 }}>${b.costPerBottle}</td>
                                                            <td>
                                                                <button onClick={() => handleOrder(b.name)} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>Restock ↗</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* COCKTAIL RECIPES VIEW */}
                        {drinkSubTab === "cocktails" && (
                            <>
                                {/* Cocktail Sales KPIs */}
                                <div className="kpi-grid" style={{ marginBottom: 20 }}>
                                    {[
                                        { label: "Menu Cocktails", value: DRINK_RECIPES.length, color: "var(--text-primary)" },
                                        { label: "Sold Today", value: DEMO_DRINK_SALES.reduce((a, s) => a + s.sold, 0), color: "#60a5fa" },
                                        { label: "Revenue Today", value: `$${DEMO_DRINK_SALES.reduce((a, s) => { const r = DRINK_RECIPES.find(x => x.id === s.recipeId); return a + (r ? r.menuPrice * s.sold : 0); }, 0).toLocaleString()}`, color: "var(--green)" },
                                        { label: "Unavailable", value: DRINK_RECIPES.filter(r => getServingsRemaining(r, bottles) === 0).length, color: "var(--red)" },
                                    ].map(c => (
                                        <div key={c.label} className="kpi-card">
                                            <div className="kpi-label">{c.label}</div>
                                            <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="card">
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Cocktail</th><th>Type</th><th>Menu Price</th>
                                                    <th>Ingredients</th><th>Pour Cost</th><th>Margin</th>
                                                    <th>Servings Left</th><th>Sold Today</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRecipes.map(r => {
                                                    const pourCost = getPourCost(r, bottles);
                                                    const servings = getServingsRemaining(r, bottles);
                                                    const margin = r.menuPrice > 0 ? Math.round(((r.menuPrice - pourCost) / r.menuPrice) * 100) : 0;
                                                    const sale = DEMO_DRINK_SALES.find(s => s.recipeId === r.id);
                                                    return (
                                                        <tr key={r.id}>
                                                            <td style={{ fontWeight: 600, color: servings === 0 ? "var(--red)" : "var(--text-primary)" }}>
                                                                {servings === 0 && <span style={{ marginRight: 6 }}>🚨</span>}
                                                                {r.name}
                                                            </td>
                                                            <td><span className={`badge ${r.category === "Cocktail" ? "badge-blue" : r.category === "Shot" ? "badge-yellow" : "badge-green"}`}>{r.category}</span></td>
                                                            <td style={{ fontWeight: 600 }}>${r.menuPrice}</td>
                                                            <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200 }}>
                                                                {r.ingredients.map(ing => {
                                                                    const bot = bottles.find(b => b.spiritId === ing.spiritId);
                                                                    return bot ? `${bot.name.split(" ")[0]} ${ing.amountMl}ml` : "?";
                                                                }).join(" + ")}
                                                            </td>
                                                            <td style={{ color: "var(--text-muted)" }}>${pourCost.toFixed(2)}</td>
                                                            <td style={{ fontWeight: 600, color: margin >= 80 ? "var(--green)" : margin >= 70 ? "var(--yellow)" : "var(--red)" }}>
                                                                {margin}%
                                                            </td>
                                                            <td style={{ fontWeight: 700, color: servings === 0 ? "var(--red)" : servings <= 10 ? "var(--yellow)" : "var(--green)" }}>
                                                                {servings}
                                                            </td>
                                                            <td style={{ fontWeight: 600, color: "#60a5fa" }}>{sale?.sold ?? 0}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* FOOD / ALL ITEMS TAB */}
                        <div className="kpi-grid">
                            {[
                                { label: "Total Items", value: isDemo ? data?.stats?.total : 0, color: "var(--text-primary)" },
                                { label: "In Stock", value: isDemo ? data?.stats?.inStock : 0, color: "var(--green)" },
                                { label: "Low Stock", value: isDemo ? data?.stats?.lowStock : 0, color: "var(--yellow)" },
                                { label: "Out of Stock", value: isDemo ? data?.stats?.outOfStock : 0, color: "var(--red)" },
                            ].map(c => (
                                <div key={c.label} className="kpi-card">
                                    <div className="kpi-label">{c.label}</div>
                                    <div className="kpi-value" style={{ color: c.color }}>{c.value ?? "—"}</div>
                                </div>
                            ))}
                        </div>

                        {loading ? (
                            <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}></div>
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

                                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "var(--text-primary)", outline: "none", width: 220 }} />
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map(s => (
                                            <button key={s} onClick={() => setStatus(s)} style={{
                                                fontSize: 12, padding: "8px 13px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                                background: statusFilter === s ? "var(--bg-card-hover)" : "var(--bg-card)",
                                                border: `1px solid ${statusFilter === s ? "var(--border-light)" : "var(--border)"}`,
                                                color: statusFilter === s ? "var(--text-primary)" : "var(--text-muted)", fontWeight: statusFilter === s ? 600 : 400,
                                            }}>
                                                {s === "ALL" ? "All" : s === "IN_STOCK" ? "In Stock" : s === "LOW_STOCK" ? "Low" : "Out"}
                                            </button>
                                        ))}
                                    </div>
                                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "var(--text-secondary)", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="card">
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th><th>Source</th><th>Category</th><th>Status</th>
                                                    <th>Quantity</th><th>Days Left</th><th>Cost/Unit</th><th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading from Toast POS…</td></tr>}
                                                {filtered.length === 0 && data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No items match your filters</td></tr>}
                                                {filtered.map((item: any) => (
                                                    <tr key={item.guid}>
                                                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                            {item.status === "OUT_OF_STOCK" && <span style={{ marginRight: 6 }}>🚨</span>}
                                                            {item.status === "LOW_STOCK" && <span style={{ marginRight: 6 }}>⚠️</span>}
                                                            {item.name}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: item.source === "pos" ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.05)", color: item.source === "pos" ? "#60a5fa" : "rgba(255,255,255,0.4)", border: `1px solid ${item.source === "pos" ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                                                                {item.source === "pos" ? "POS" : "Manual"}
                                                            </span>
                                                        </td>
                                                        <td><span className="badge badge-blue">{item.category}</span></td>
                                                        <td><span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></td>
                                                        <td style={{ fontWeight: 600, color: item.status === "OUT_OF_STOCK" ? "var(--red)" : item.status === "LOW_STOCK" ? "var(--yellow)" : "var(--text-primary)" }}>
                                                            {item.quantity} {item.unit}
                                                        </td>
                                                        <td style={{ fontSize: 12 }}>
                                                            {item.dailyUsage && item.quantity > 0 ? (
                                                                <span style={{ color: Math.ceil(item.quantity / item.dailyUsage) <= 2 ? "var(--red)" : Math.ceil(item.quantity / item.dailyUsage) <= 5 ? "var(--yellow)" : "var(--green)", fontWeight: 600 }}>
                                                                    {Math.ceil(item.quantity / item.dailyUsage)}d
                                                                </span>
                                                            ) : item.status === "OUT_OF_STOCK" ? (
                                                                <span style={{ color: "var(--red)", fontWeight: 600 }}>0d</span>
                                                            ) : (
                                                                <span style={{ color: "var(--text-muted)" }}>—</span>
                                                            )}
                                                        </td>
                                                        <td style={{ color: "var(--text-muted)" }}>${item.costPerUnit}</td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: 6 }}>
                                                                <button onClick={() => handleOrder(item.name)} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>Restock ↗</button>
                                                                <button onClick={() => { setEditingItem(item); setEditForm({ quantity: item.quantity, threshold: item.threshold, status: item.status }); setIsEditModalOpen(true); }}
                                                                    style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✎</button>
                                                            </div>
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
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Inventory Not Connected</h2>
                                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>To monitor live stock levels, connect your point of sale system.</p>
                                <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>Go to Integrations</button>
                            </div>
                        )}
                    </>
                )}

                {/* EDIT MODAL */}
                {isEditModalOpen && editingItem && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(8px)" }}>
                        <div className="card" style={{ width: 400, padding: 32 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 24 }}>Edit: {editingItem.name}</h2>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Quantity ({editingItem.unit})</label>
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Threshold ({editingItem.unit})</label>
                                <input type="number" value={editForm.threshold} onChange={e => setEditForm({ ...editForm, threshold: parseFloat(e.target.value) || 0 })} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Status</label>
                                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ width: "100%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
                                    <option value="IN_STOCK">In Stock</option>
                                    <option value="LOW_STOCK">Low Stock</option>
                                    <option value="OUT_OF_STOCK">Out of Stock</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button className="btn-primary" onClick={() => { const u = data.inventory.map((i: any) => i.guid === editingItem.guid ? { ...i, ...editForm } : i); setData({ ...data, inventory: u }); setIsEditModalOpen(false); showToast(`${editingItem.name} updated.`); }} style={{ padding: "10px 24px" }}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ADD ITEM MODAL */}
                {isAddModalOpen && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(8px)" }}>
                        <div className="card" style={{ width: 460, padding: 32 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Add Item Manually</h2>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Item will be matched against POS menu items. If a match is found, usage will auto-deduct.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Item Name *</label>
                                    <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Don Julio Blanco" style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Category</label>
                                    <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })} style={{ width: "100%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                                        {["Proteins", "Soups & Apps", "Dairy", "Specialty", "Oils & Condiments", "Produce", "Dry Goods", "Desserts", "Bakery", "Alcohol", "Beverages"].map(c => <option key={c} value={c} style={{ background: "#1a1a24", color: "#fff" }}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Quantity *</label>
                                    <input type="number" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: parseFloat(e.target.value) || 0 })} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Unit</label>
                                    <select value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })} style={{ width: "100%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                                        {["lbs", "portions", "bottles", "kegs", "gallons", "quarts", "pieces", "grams", "servings", "loaves"].map(u => <option key={u} value={u} style={{ background: "#1a1a24", color: "#fff" }}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Threshold</label>
                                    <input type="number" value={addForm.threshold} onChange={e => setAddForm({ ...addForm, threshold: parseFloat(e.target.value) || 0 })} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Cost/Unit ($)</label>
                                    <input type="number" value={addForm.costPerUnit} onChange={e => setAddForm({ ...addForm, costPerUnit: parseFloat(e.target.value) || 0 })} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Supplier</label>
                                    <input value={addForm.supplier} onChange={e => setAddForm({ ...addForm, supplier: e.target.value })} placeholder="e.g. Wine Direct" style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button className="btn-primary" disabled={!addForm.name.trim()} onClick={() => {
                                    const newItem = { guid: `manual_${Date.now()}`, name: addForm.name, category: addForm.category, status: addForm.quantity <= 0 ? "OUT_OF_STOCK" : addForm.quantity <= addForm.threshold ? "LOW_STOCK" : "IN_STOCK", quantity: addForm.quantity, unit: addForm.unit, threshold: addForm.threshold, costPerUnit: addForm.costPerUnit, lastUpdated: new Date().toISOString().split("T")[0], supplier: addForm.supplier || "Manual", source: "manual" };
                                    setData({ ...data, inventory: [newItem, ...data.inventory], stats: { ...data.stats, total: data.stats.total + 1, inStock: data.stats.inStock + (newItem.status === "IN_STOCK" ? 1 : 0) } });
                                    setIsAddModalOpen(false);
                                    setAddForm({ name: "", category: "Proteins", quantity: 0, unit: "lbs", threshold: 0, costPerUnit: 0, supplier: "" });
                                    showToast(`${addForm.name} added. Matching against POS menu...`);
                                }} style={{ padding: "10px 24px" }}>Add to Inventory</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
