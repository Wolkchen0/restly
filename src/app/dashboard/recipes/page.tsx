"use client";
import { useState, useEffect, useRef } from "react";
import { FOOD_RECIPES, FOOD_INGREDIENTS, DEMO_FOOD_SALES, getFoodCost, getFoodServingsRemaining, FoodRecipe, FoodIngredient } from "@/services/food-recipes";
import { DRINK_RECIPES, BOTTLE_INVENTORY, DEMO_DRINK_SALES, DrinkRecipe } from "@/services/drinks";

type TabKey = "All" | "Main" | "Appetizer" | "Side" | "Dessert" | "Bread" | "Soup" | "Drinks";

export default function RecipesPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("All");
    const [foodIngredients, setFoodIngredients] = useState<FoodIngredient[]>([...FOOD_INGREDIENTS]);
    const [isDemo, setIsDemo] = useState(true);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
    const [editModal, setEditModal] = useState<FoodRecipe | null>(null);
    const [editIngredients, setEditIngredients] = useState<{ inventoryId: string; name: string; amount: number; unit: string }[]>([]);
    const [editPrice, setEditPrice] = useState("");
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    useEffect(() => {
        fetch("/api/locations").then(r => r.json()).then(d => setIsDemo(!!d.restaurantName)).catch(() => { });
    }, []);

    // Calculate cost & servings for each food recipe
    const getFoodData = (r: FoodRecipe) => {
        const cost = getFoodCost(r, foodIngredients);
        const servings = getFoodServingsRemaining(r, foodIngredients);
        const margin = r.menuPrice > 0 ? Math.round((1 - cost / r.menuPrice) * 100) : 0;
        const dailySales = DEMO_FOOD_SALES.find(s => s.recipeId === r.id)?.sold || 0;
        const daysSupply = dailySales > 0 ? Math.floor(servings / dailySales) : null;
        return { cost, servings, margin, dailySales, daysSupply };
    };

    // Drink recipe cost
    const getDrinkData = (r: DrinkRecipe) => {
        let cost = 0;
        for (const ing of r.ingredients) {
            const bottle = BOTTLE_INVENTORY.find(b => b.spiritId === ing.spiritId);
            if (bottle) cost += (ing.amountMl / bottle.sizeMl) * bottle.costPerBottle;
        }
        const margin = r.menuPrice > 0 ? Math.round((1 - cost / r.menuPrice) * 100) : 0;
        const dailySales = DEMO_DRINK_SALES.find(s => s.recipeId === r.id)?.sold || 0;
        return { cost: Math.round(cost * 100) / 100, margin, dailySales };
    };

    const filteredFood = FOOD_RECIPES.filter(r => {
        if (activeTab !== "All" && activeTab !== "Drinks" && r.category !== activeTab) return false;
        if (activeTab === "Drinks") return false;
        if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filteredDrinks = activeTab === "All" || activeTab === "Drinks"
        ? DRINK_RECIPES.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
        : [];

    // Stats
    const totalRecipes = FOOD_RECIPES.length + DRINK_RECIPES.length;
    const lowStockRecipes = FOOD_RECIPES.filter(r => getFoodServingsRemaining(r, foodIngredients) <= 5).length;
    const avgMarginFood = FOOD_RECIPES.length > 0 ? Math.round(FOOD_RECIPES.reduce((a, r) => a + getFoodData(r).margin, 0) / FOOD_RECIPES.length) : 0;
    const totalDailySales = DEMO_FOOD_SALES.reduce((a, s) => a + s.sold, 0) + DEMO_DRINK_SALES.reduce((a, s) => a + s.sold, 0);

    const openEdit = (r: FoodRecipe) => {
        setEditModal(r);
        setEditIngredients(r.ingredients.map(i => ({ ...i })));
        setEditPrice(String(r.menuPrice));
    };

    const saveEdit = () => {
        if (!editModal) return;
        showToast(`✅ Recipe "${editModal.name}" updated`);
        setEditModal(null);
    };

    const handlePhotoUpload = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await fetch("/api/analyze-recipe", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: reader.result })
                });
                if (res.ok) {
                    showToast("✨ AI extraction complete!");
                } else {
                    showToast("Failed to analyze image.");
                }
            } catch { showToast("Failed to connect to AI."); }
            finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
        };
        reader.readAsDataURL(file);
    };

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: "All", label: "All", icon: "📋" },
        { key: "Main", label: "Mains", icon: "🥩" },
        { key: "Appetizer", label: "Apps", icon: "🥗" },
        { key: "Side", label: "Sides", icon: "🍟" },
        { key: "Dessert", label: "Dessert", icon: "🍫" },
        { key: "Bread", label: "Bread", icon: "🍞" },
        { key: "Soup", label: "Soup", icon: "🍜" },
        { key: "Drinks", label: "Drinks", icon: "🍸" },
    ];

    return (
        <>
            <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileChange} />

            {toastMsg && <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, background: "rgba(10,10,15,0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{toastMsg}</div>}

            {/* EDIT MODAL */}
            {editModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setEditModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "32px 36px", width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>✏️ Edit Recipe</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{editModal.name} — {editModal.category}</div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Menu Price ($)</label>
                            <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 18, fontWeight: 800, color: "#4ade80", outline: "none", fontFamily: "inherit" }} />
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Ingredients</label>
                        </div>
                        {editIngredients.map((ing, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ flex: 1, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{ing.name}</span>
                                <input type="number" step="0.1" value={ing.amount} onChange={e => { const u = [...editIngredients]; u[i].amount = parseFloat(e.target.value) || 0; setEditIngredients(u); }} style={{ width: 70, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px", fontSize: 14, fontWeight: 700, color: "#E8C96E", textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", minWidth: 40 }}>{ing.unit}</span>
                            </div>
                        ))}

                        {/* Cost Preview */}
                        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "14px 18px", marginTop: 16, marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                <span>Food Cost: <strong style={{ color: "#facc15" }}>${getFoodCost(editModal, foodIngredients).toFixed(2)}</strong></span>
                                <span>Margin: <strong style={{ color: "#4ade80" }}>{parseFloat(editPrice) > 0 ? Math.round((1 - getFoodCost(editModal, foodIngredients) / parseFloat(editPrice)) * 100) : 0}%</strong></span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={saveEdit} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", borderRadius: 10, color: "#1a1000", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💾 Save Recipe</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="topbar">
                <div className="topbar-title">Chef & Recipe Management</div>
                <div className="topbar-right" style={{ display: "flex", gap: 8 }}>
                    <button onClick={handlePhotoUpload} disabled={uploading} style={{ fontSize: 12, padding: "8px 16px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                        {uploading ? "Analyzing..." : "📷 AI Photo Import"}
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 6, maxWidth: 1400, margin: "0 auto", overflowX: "auto" }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                            background: "none", border: "none", padding: "12px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                            color: activeTab === t.key ? "#E8C96E" : "rgba(255,255,255,0.35)",
                            borderBottom: activeTab === t.key ? "2px solid #C9A84C" : "2px solid transparent",
                        }}>{t.icon} {t.label}</button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px 80px" }}>

                {/* KPI Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                    {[
                        { label: "Total Recipes", value: totalRecipes, color: "#fff", icon: "📖" },
                        { label: "Avg Margin", value: `${avgMarginFood}%`, color: "#4ade80", icon: "📊" },
                        { label: "Low Stock Alerts", value: lowStockRecipes, color: lowStockRecipes > 0 ? "#f87171" : "#4ade80", icon: "⚠️" },
                        { label: "Today's Sales", value: totalDailySales, color: "#60a5fa", icon: "🧾" },
                    ].map(c => (
                        <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px 20px" }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{c.icon} {c.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ marginBottom: 20 }}>
                    <input type="text" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                </div>

                {/* FOOD RECIPES TABLE */}
                {filteredFood.length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>🍳 Kitchen Recipes <span style={{ fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>({filteredFood.length})</span></div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>AI calculates cost from live inventory</div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Recipe</th>
                                    <th style={thStyle}>Category</th>
                                    <th style={thStyle}>Price</th>
                                    <th style={thStyle}>Cost</th>
                                    <th style={thStyle}>Margin</th>
                                    <th style={thStyle}>Daily Sales</th>
                                    <th style={thStyle}>Can Make</th>
                                    <th style={thStyle}>Days Left</th>
                                    <th style={{ ...thStyle, width: 60 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFood.map(r => {
                                    const d = getFoodData(r);
                                    const isExpanded = expandedRecipe === r.id;
                                    return [
                                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }} onClick={() => setExpandedRecipe(isExpanded ? null : r.id)}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 700, color: "#fff" }}>{r.name}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", color: "#E8C96E" }}>{r.category}</span>
                                            </td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: "#fff" }}>${r.menuPrice}</span></td>
                                            <td style={tdStyle}><span style={{ color: "rgba(255,255,255,0.5)" }}>${d.cost.toFixed(2)}</span></td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: d.margin >= 60 ? "#4ade80" : d.margin >= 40 ? "#facc15" : "#f87171" }}>{d.margin}%</span></td>
                                            <td style={tdStyle}><span style={{ color: "#60a5fa" }}>{d.dailySales > 0 ? <><span style={{ fontSize: 10, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)", padding: "1px 5px", borderRadius: 4, marginRight: 4 }}>POS</span>{d.dailySales}</> : "—"}</span></td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: d.servings <= 5 ? "#f87171" : d.servings <= 15 ? "#facc15" : "#4ade80" }}>{d.servings}</span></td>
                                            <td style={tdStyle}>
                                                {d.daysSupply !== null ? (
                                                    <span style={{ fontWeight: 700, color: d.daysSupply <= 1 ? "#f87171" : d.daysSupply <= 3 ? "#facc15" : "#4ade80" }}>{d.daysSupply}d</span>
                                                ) : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                                            </td>
                                            <td style={tdStyle}>
                                                <button onClick={e => { e.stopPropagation(); openEdit(r); }} style={{ fontSize: 11, padding: "5px 10px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", color: "#E8C96E", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>✏️</button>
                                            </td>
                                        </tr>,
                                        isExpanded && (
                                            <tr key={r.id + "-detail"}>
                                                <td colSpan={9} style={{ padding: "0 20px 16px", background: "rgba(255,255,255,0.01)" }}>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, padding: "12px 0" }}>
                                                        {r.ingredients.map((ing, i) => {
                                                            const inv = foodIngredients.find(fi => fi.inventoryId === ing.inventoryId);
                                                            return (
                                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                                                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{ing.name}</span>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E" }}>{ing.amount} {ing.unit}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>💡 AI: Based on {d.dailySales} daily sales × {r.ingredients.length} ingredients, this dish uses ~${(d.cost * d.dailySales).toFixed(2)}/day in ingredients from inventory.</div>
                                                </td>
                                            </tr>
                                        )
                                    ];
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* DRINK RECIPES TABLE */}
                {filteredDrinks.length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>🍸 Bar & Cocktail Recipes <span style={{ fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>({filteredDrinks.length})</span></div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Linked to Bottle Inventory</div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Cocktail</th>
                                    <th style={thStyle}>Ingredients</th>
                                    <th style={thStyle}>Price</th>
                                    <th style={thStyle}>Pour Cost</th>
                                    <th style={thStyle}>Margin</th>
                                    <th style={thStyle}>Daily Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrinks.map(r => {
                                    const d = getDrinkData(r);
                                    return (
                                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: "#fff" }}>{r.name}</span></td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                    {r.ingredients.map(i => {
                                                        const b = BOTTLE_INVENTORY.find(x => x.spiritId === i.spiritId);
                                                        return b ? `${b.name} ${i.amountMl}ml` : `${i.spiritId} ${i.amountMl}ml`;
                                                    }).join(" · ")}
                                                </span>
                                            </td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: "#fff" }}>${r.menuPrice}</span></td>
                                            <td style={tdStyle}><span style={{ color: "rgba(255,255,255,0.5)" }}>${d.cost.toFixed(2)}</span></td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: d.margin >= 70 ? "#4ade80" : d.margin >= 50 ? "#facc15" : "#f87171" }}>{d.margin}%</span></td>
                                            <td style={tdStyle}><span style={{ color: "#60a5fa" }}>{d.dailySales > 0 ? <><span style={{ fontSize: 10, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)", padding: "1px 5px", borderRadius: 4, marginRight: 4 }}>POS</span>{d.dailySales}</> : "—"}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredFood.length === 0 && filteredDrinks.length === 0 && (
                    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 15 }}>No recipes found for "{search}"</div>
                )}
            </div>
        </>
    );
}

const thStyle: React.CSSProperties = {
    padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)"
};
const tdStyle: React.CSSProperties = {
    padding: "12px 12px", verticalAlign: "middle"
};
