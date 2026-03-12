"use client";
import { useState, useEffect } from "react";
import { BOTTLE_INVENTORY, DRINK_RECIPES, DEMO_DRINK_SALES, getTotalMlRemaining, getServingsRemaining, getPourCost, getCocktailsUsing, type BottleInfo } from "@/services/drinks";
import { FOOD_INGREDIENTS, FOOD_RECIPES, DEMO_FOOD_SALES, getFoodCost, getFoodServingsRemaining, getRecipesUsing, type FoodIngredient } from "@/services/food-recipes";

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"Food" | "Drink">("Food");
    const [isDemo, setIsDemo] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lastSynced, setLastSynced] = useState<string>("");
    const [syncCountdown, setSyncCountdown] = useState(600);
    const [bottles, setBottles] = useState<BottleInfo[]>(BOTTLE_INVENTORY);
    const [foodIngredients, setFoodIngredients] = useState<FoodIngredient[]>(FOOD_INGREDIENTS);
    const [drinkSubTab, setDrinkSubTab] = useState<"bottles" | "cocktails">("bottles");
    const [foodSubTab, setFoodSubTab] = useState<"ingredients" | "recipes">("recipes");
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Receive Stock Modal
    const [receiveModal, setReceiveModal] = useState<{ type: "bottle" | "food"; id: string; name: string; unit: string; sizeMl?: number } | null>(null);
    const [receiveQty, setReceiveQty] = useState("");
    const [receiveUnit, setReceiveUnit] = useState<"bottles" | "cases">("bottles");

    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    const openReceiveBottle = (b: BottleInfo) => {
        setReceiveModal({ type: "bottle", id: b.spiritId, name: b.name, unit: "bottles", sizeMl: b.sizeMl });
        setReceiveQty(""); setReceiveUnit("bottles");
    };
    const openReceiveFood = (i: FoodIngredient) => {
        setReceiveModal({ type: "food", id: i.inventoryId, name: i.name, unit: i.unit });
        setReceiveQty("");
    };
    const confirmReceive = () => {
        const qty = parseFloat(receiveQty);
        if (!qty || qty <= 0 || !receiveModal) return;
        if (receiveModal.type === "bottle") {
            const addBottles = receiveUnit === "cases" ? qty * 12 : qty;
            setBottles(prev => prev.map(b => b.spiritId === receiveModal.id ? { ...b, fullBottles: b.fullBottles + addBottles } : b));
            showToast(`✅ Received ${receiveUnit === "cases" ? `${qty} case(s) (${addBottles} bottles)` : `${qty} bottle(s)`} of ${receiveModal.name}`);
        } else {
            setFoodIngredients(prev => prev.map(i => i.inventoryId === receiveModal.id ? { ...i, onHand: i.onHand + qty } : i));
            showToast(`✅ Received ${qty} ${receiveModal.unit} of ${receiveModal.name}`);
        }
        setReceiveModal(null);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const locRes = await fetch("/api/locations");
                const locData = await locRes.json();
                setIsDemo(!!locData.restaurantName);
                const invRes = await fetch("/api/inventory");
                const invData = await invRes.json();
                setData(invData);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        init();
        const syncTimer = setInterval(() => {
            setSyncCountdown(prev => {
                if (prev <= 1) { setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })); return 600; }
                return prev - 1;
            });
        }, 1000);
        setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
        return () => clearInterval(syncTimer);
    }, []);

    const getBottleStatus = (b: BottleInfo) => {
        const total = getTotalMlRemaining(b);
        if (total === 0) return "OUT";
        if (b.fullBottles <= 1 && b.openBottleMl < b.sizeMl * 0.3) return "Low";
        return "OK";
    };

    const getIngredientStatus = (i: FoodIngredient) => {
        if (i.onHand <= 0) return "OUT";
        const recipes = getRecipesUsing(i.inventoryId);
        if (recipes.length > 0) {
            const avgDaily = DEMO_FOOD_SALES.reduce((acc, s) => {
                const r = FOOD_RECIPES.find(x => x.id === s.recipeId);
                if (!r) return acc;
                const ing = r.ingredients.find(x => x.inventoryId === i.inventoryId);
                if (!ing) return acc;
                return acc + (s.sold * ing.amount);
            }, 0);
            if (avgDaily > 0 && i.onHand / avgDaily <= 2) return "Low";
        }
        return "OK";
    };

    const filteredBottles = bottles.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));
    const filteredDrinkRecipes = DRINK_RECIPES.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
    const filteredFoodIngredients = foodIngredients.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
    const filteredFoodRecipes = FOOD_RECIPES.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <style>{`
                .inv-table { width: 100%; border-collapse: collapse; }
                .inv-table th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); }
                .inv-table td { padding: 14px 16px; font-size: 14px; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.04); }
                .inv-table tr:hover { background: rgba(255,255,255,0.02); }
                .inv-badge { font-size: 11px; padding: 4px 10px; border-radius: 6px; font-weight: 600; display: inline-block; }
                .inv-badge-ok { background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
                .inv-badge-low { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid rgba(250,204,21,0.2); }
                .inv-badge-out { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
                .inv-badge-blue { background: rgba(96,165,250,0.1); color: #60a5fa; border: 1px solid rgba(96,165,250,0.2); }
                .inv-badge-pos { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: rgba(96,165,250,0.1); color: #60a5fa; border: 1px solid rgba(96,165,250,0.15); }
                .inv-badge-manual { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.06); }
            `}</style>

            <div className="topbar">
                <div className="topbar-title">Inventory Management</div>
                <div className="topbar-right" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {isDemo && (
                        <>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Next sync: {Math.floor(syncCountdown / 60)}m {syncCountdown % 60}s · Last: {lastSynced}</span>
                            <span style={{ fontSize: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>POS Connected</span>
                        </>
                    )}
                </div>
            </div>

            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    {toastMsg}
                </div>
            )}

            {/* ── RECEIVE STOCK MODAL ── */}
            {receiveModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setReceiveModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: 32, width: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📦 Receive Stock</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Add incoming inventory for <strong style={{ color: "#E8C96E" }}>{receiveModal.name}</strong></div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Quantity</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                <input type="number" min="1" step="1" value={receiveQty} onChange={e => setReceiveQty(e.target.value)} placeholder={receiveModal.type === "bottle" ? "e.g. 4" : `e.g. 50`} autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 16, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                                {receiveModal.type === "bottle" ? (
                                    <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        {(["bottles", "cases"] as const).map(u => (
                                            <button key={u} onClick={() => setReceiveUnit(u)} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: receiveUnit === u ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: receiveUnit === u ? "#E8C96E" : "rgba(255,255,255,0.4)" }}>
                                                {u === "bottles" ? "Bottles" : "Cases (12)"}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", padding: "0 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{receiveModal.unit}</div>
                                )}
                            </div>
                        </div>

                        {receiveModal.type === "bottle" && receiveQty && parseFloat(receiveQty) > 0 && (
                            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                Adding <strong style={{ color: "#E8C96E" }}>{receiveUnit === "cases" ? `${parseFloat(receiveQty) * 12} bottles` : `${receiveQty} bottle(s)`}</strong> ({receiveModal.sizeMl}ml each) = <strong style={{ color: "#4ade80" }}>{((receiveUnit === "cases" ? parseFloat(receiveQty) * 12 : parseFloat(receiveQty)) * (receiveModal.sizeMl || 750) / 1000).toFixed(1)}L total</strong>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setReceiveModal(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={confirmReceive} disabled={!receiveQty || parseFloat(receiveQty) <= 0} style={{ flex: 1, padding: "12px", background: receiveQty && parseFloat(receiveQty) > 0 ? "linear-gradient(135deg,#C9A84C,#E8C96E)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, color: receiveQty && parseFloat(receiveQty) > 0 ? "#1a1000" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 800, cursor: receiveQty ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Confirm Receive</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB SELECTOR */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 32, maxWidth: 1400, margin: "0 auto" }}>
                    {(["Food", "Drink"] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{
                            background: "none", border: "none", padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            color: activeTab === t ? "#E8C96E" : "rgba(255,255,255,0.4)",
                            borderBottom: activeTab === t ? "2px solid #C9A84C" : "2px solid transparent",
                        }}>
                            {t === "Food" ? "Kitchen & Food" : "Bar & Drinks"}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px 80px" }}>

                {/* ═══════════════ FOOD TAB ═══════════════ */}
                {activeTab === "Food" && isDemo && (
                    <>
                        {/* Sub-tabs + Search */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
                            {(["recipes", "ingredients"] as const).map(st => (
                                <button key={st} onClick={() => setFoodSubTab(st)} style={{
                                    fontSize: 14, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                                    background: foodSubTab === st ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${foodSubTab === st ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                                    color: foodSubTab === st ? "#E8C96E" : "rgba(255,255,255,0.4)", fontWeight: foodSubTab === st ? 700 : 400,
                                }}>
                                    {st === "recipes" ? "Menu Recipes" : "Raw Ingredients"}
                                </button>
                            ))}
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ marginLeft: "auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", fontSize: 14, color: "#fff", outline: "none", width: 240 }} />
                        </div>

                        {/* FOOD RECIPES VIEW */}
                        {foodSubTab === "recipes" && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Menu Items", value: FOOD_RECIPES.length, color: "#fff" },
                                        { label: "Dishes Sold Today", value: DEMO_FOOD_SALES.reduce((a, s) => a + s.sold, 0), color: "#60a5fa" },
                                        { label: "Food Revenue", value: `$${DEMO_FOOD_SALES.reduce((a, s) => { const r = FOOD_RECIPES.find(x => x.id === s.recipeId); return a + (r ? r.menuPrice * s.sold : 0); }, 0).toLocaleString()}`, color: "#4ade80" },
                                        { label: "Cannot Make", value: FOOD_RECIPES.filter(r => getFoodServingsRemaining(r, foodIngredients) === 0).length, color: "#f87171" },
                                    ].map(c => (
                                        <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 24px" }}>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{c.label}</div>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Dish</th><th>Type</th><th>Menu Price</th>
                                                <th>Ingredients</th><th>Food Cost</th><th>Margin</th>
                                                <th>Can Make</th><th>Sold Today</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFoodRecipes.map(r => {
                                                const cost = getFoodCost(r, foodIngredients);
                                                const servings = getFoodServingsRemaining(r, foodIngredients);
                                                const margin = r.menuPrice > 0 ? Math.round(((r.menuPrice - cost) / r.menuPrice) * 100) : 0;
                                                const sale = DEMO_FOOD_SALES.find(s => s.recipeId === r.id);
                                                return (
                                                    <tr key={r.id}>
                                                        <td style={{ fontWeight: 700, color: servings === 0 ? "#f87171" : "#fff", fontSize: 15 }}>
                                                            {servings === 0 && <span style={{ marginRight: 6 }}>🚨</span>}
                                                            {r.name}
                                                        </td>
                                                        <td><span className={`inv-badge ${r.category === "Main" ? "inv-badge-blue" : r.category === "Dessert" ? "inv-badge-low" : "inv-badge-ok"}`}>{r.category}</span></td>
                                                        <td style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>${r.menuPrice}</td>
                                                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", maxWidth: 280, lineHeight: 1.6 }}>
                                                            {r.ingredients.map(ing => `${ing.name} ${ing.amount}${ing.unit}`).join(" · ")}
                                                        </td>
                                                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>${cost.toFixed(2)}</td>
                                                        <td style={{ fontWeight: 700, fontSize: 14, color: margin >= 70 ? "#4ade80" : margin >= 60 ? "#facc15" : "#f87171" }}>
                                                            {margin}%
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: servings === 0 ? "#f87171" : servings <= 10 ? "#facc15" : "#4ade80" }}>
                                                            {servings}
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: "#60a5fa" }}>{sale?.sold ?? 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* RAW INGREDIENTS VIEW */}
                        {foodSubTab === "ingredients" && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Total Ingredients", value: foodIngredients.length, color: "#fff" },
                                        { label: "In Stock", value: foodIngredients.filter(i => getIngredientStatus(i) === "OK").length, color: "#4ade80" },
                                        { label: "Running Low", value: foodIngredients.filter(i => getIngredientStatus(i) === "Low").length, color: "#facc15" },
                                        { label: "Out of Stock", value: foodIngredients.filter(i => getIngredientStatus(i) === "OUT").length, color: "#f87171" },
                                    ].map(c => (
                                        <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 24px" }}>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{c.label}</div>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Ingredient</th><th>Source</th><th>Status</th>
                                                <th>On Hand</th><th>Daily Usage</th><th>Days Left</th>
                                                <th>Used In</th><th>Cost/Unit</th><th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFoodIngredients.map(i => {
                                                const status = getIngredientStatus(i);
                                                const recipes = getRecipesUsing(i.inventoryId);
                                                // Calc daily usage
                                                const dailyUse = DEMO_FOOD_SALES.reduce((acc, s) => {
                                                    const r = FOOD_RECIPES.find(x => x.id === s.recipeId);
                                                    if (!r) return acc;
                                                    const ing = r.ingredients.find(x => x.inventoryId === i.inventoryId);
                                                    if (!ing) return acc;
                                                    return acc + (s.sold * ing.amount);
                                                }, 0);
                                                const daysLeft = dailyUse > 0 && i.onHand > 0 ? Math.floor(i.onHand / dailyUse) : i.onHand <= 0 ? 0 : null;
                                                return (
                                                    <tr key={i.inventoryId}>
                                                        <td style={{ fontWeight: 700, color: status === "OUT" ? "#f87171" : "#fff", fontSize: 15 }}>
                                                            {status === "OUT" && <span style={{ marginRight: 6 }}>🚨</span>}
                                                            {status === "Low" && <span style={{ marginRight: 6 }}>⚠️</span>}
                                                            {i.name}
                                                        </td>
                                                        <td><span className={i.source === "pos" ? "inv-badge-pos" : "inv-badge-manual"}>{i.source === "pos" ? "POS" : "Manual"}</span></td>
                                                        <td>
                                                            <span className={`inv-badge ${status === "OK" ? "inv-badge-ok" : status === "Low" ? "inv-badge-low" : "inv-badge-out"}`}>
                                                                {status === "OK" ? "In Stock" : status === "Low" ? "Low" : "OUT"}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: status === "OUT" ? "#f87171" : status === "Low" ? "#facc15" : "#fff" }}>
                                                            {i.onHand} {i.unit}
                                                        </td>
                                                        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                                                            {dailyUse > 0 ? `~${dailyUse.toFixed(1)} ${i.unit}/day` : "—"}
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 14 }}>
                                                            {daysLeft !== null ? (
                                                                <span style={{ color: daysLeft <= 1 ? "#f87171" : daysLeft <= 3 ? "#facc15" : "#4ade80" }}>
                                                                    {daysLeft}d
                                                                </span>
                                                            ) : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                                                        </td>
                                                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 180 }}>
                                                            {recipes.length > 0 ? (<><span className="inv-badge-pos" style={{ marginRight: 4 }}>POS</span>{recipes.slice(0, 2).map(r => r.name).join(", ")}{recipes.length > 2 ? ` +${recipes.length - 2}` : ""}</>) : "—"}
                                                        </td>
                                                        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>${i.costPerUnit}</td>
                                                        <td>
                                                            <button onClick={() => openReceiveFood(i)} style={{ fontSize: 12, padding: "6px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>+ Receive</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ═══════════════ DRINK TAB ═══════════════ */}
                {activeTab === "Drink" && isDemo && (
                    <>
                        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
                            {(["bottles", "cocktails"] as const).map(st => (
                                <button key={st} onClick={() => setDrinkSubTab(st)} style={{
                                    fontSize: 14, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                                    background: drinkSubTab === st ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${drinkSubTab === st ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                                    color: drinkSubTab === st ? "#E8C96E" : "rgba(255,255,255,0.4)", fontWeight: drinkSubTab === st ? 700 : 400,
                                }}>
                                    {st === "bottles" ? "Bottle Inventory" : "Cocktail Recipes"}
                                </button>
                            ))}
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ marginLeft: "auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", fontSize: 14, color: "#fff", outline: "none", width: 240 }} />
                        </div>

                        {/* BOTTLE INVENTORY */}
                        {drinkSubTab === "bottles" && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Total Spirits", value: bottles.length, color: "#fff" },
                                        { label: "In Stock", value: bottles.filter(b => getBottleStatus(b) === "OK").length, color: "#4ade80" },
                                        { label: "Running Low", value: bottles.filter(b => getBottleStatus(b) === "Low").length, color: "#facc15" },
                                        { label: "Out of Stock", value: bottles.filter(b => getBottleStatus(b) === "OUT").length, color: "#f87171" },
                                    ].map(c => (
                                        <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 24px" }}>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{c.label}</div>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Spirit</th><th>Category</th><th>Status</th>
                                                <th>Full Bottles</th><th>Open Bottle</th><th>Total</th>
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
                                                        <td style={{ fontWeight: 700, color: status === "OUT" ? "#f87171" : "#fff", fontSize: 15 }}>
                                                            {status === "OUT" && <span style={{ marginRight: 6 }}>🚨</span>}
                                                            {status === "Low" && <span style={{ marginRight: 6 }}>⚠️</span>}
                                                            {b.name}
                                                        </td>
                                                        <td><span className="inv-badge inv-badge-blue">{b.category}</span></td>
                                                        <td>
                                                            <span className={`inv-badge ${status === "OK" ? "inv-badge-ok" : status === "Low" ? "inv-badge-low" : "inv-badge-out"}`}>
                                                                {status === "OK" ? "In Stock" : status === "Low" ? "Low" : "OUT"}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: b.fullBottles === 0 ? "#f87171" : "#fff" }}>{b.fullBottles}</td>
                                                        <td style={{ fontSize: 13 }}>
                                                            {b.openBottleMl > 0 ? <span style={{ color: "#60a5fa" }}>{b.openBottleMl}ml / {b.sizeMl}ml</span> : <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>}
                                                        </td>
                                                        <td style={{ fontWeight: 700, fontSize: 14, color: totalMl === 0 ? "#f87171" : totalMl < b.sizeMl * 2 ? "#facc15" : "#4ade80" }}>
                                                            {totalMl > 0 ? `${(totalMl / 1000).toFixed(1)}L` : "0"}
                                                        </td>
                                                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 160 }}>
                                                            {usedIn.length > 0 ? (<><span className="inv-badge-pos" style={{ marginRight: 4 }}>POS</span>{usedIn.slice(0, 2).map(r => r.name).join(", ")}{usedIn.length > 2 ? ` +${usedIn.length - 2}` : ""}</>) : "—"}
                                                        </td>
                                                        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>${b.costPerBottle}</td>
                                                        <td>
                                                            <button onClick={() => openReceiveBottle(b)} style={{ fontSize: 12, padding: "6px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>+ Receive</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* COCKTAIL RECIPES */}
                        {drinkSubTab === "cocktails" && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Menu Cocktails", value: DRINK_RECIPES.length, color: "#fff" },
                                        { label: "Drinks Sold Today", value: DEMO_DRINK_SALES.reduce((a, s) => a + s.sold, 0), color: "#60a5fa" },
                                        { label: "Bar Revenue", value: `$${DEMO_DRINK_SALES.reduce((a, s) => { const r = DRINK_RECIPES.find(x => x.id === s.recipeId); return a + (r ? r.menuPrice * s.sold : 0); }, 0).toLocaleString()}`, color: "#4ade80" },
                                        { label: "Unavailable", value: DRINK_RECIPES.filter(r => getServingsRemaining(r, bottles) === 0).length, color: "#f87171" },
                                    ].map(c => (
                                        <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px 24px" }}>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{c.label}</div>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>Cocktail</th><th>Type</th><th>Menu Price</th>
                                                <th>Ingredients</th><th>Pour Cost</th><th>Margin</th>
                                                <th>Can Make</th><th>Sold Today</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDrinkRecipes.map(r => {
                                                const pourCost = getPourCost(r, bottles);
                                                const servings = getServingsRemaining(r, bottles);
                                                const margin = r.menuPrice > 0 ? Math.round(((r.menuPrice - pourCost) / r.menuPrice) * 100) : 0;
                                                const sale = DEMO_DRINK_SALES.find(s => s.recipeId === r.id);
                                                return (
                                                    <tr key={r.id}>
                                                        <td style={{ fontWeight: 700, color: servings === 0 ? "#f87171" : "#fff", fontSize: 15 }}>
                                                            {servings === 0 && <span style={{ marginRight: 6 }}>🚨</span>}
                                                            {r.name}
                                                        </td>
                                                        <td><span className={`inv-badge ${r.category === "Cocktail" ? "inv-badge-blue" : r.category === "Shot" ? "inv-badge-low" : "inv-badge-ok"}`}>{r.category}</span></td>
                                                        <td style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>${r.menuPrice}</td>
                                                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", maxWidth: 280, lineHeight: 1.6 }}>
                                                            {r.ingredients.map(ing => {
                                                                const bot = bottles.find(b => b.spiritId === ing.spiritId);
                                                                return bot ? `${bot.name.split(" ")[0]} ${ing.amountMl}ml` : "?";
                                                            }).join(" · ")}
                                                        </td>
                                                        <td style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>${pourCost.toFixed(2)}</td>
                                                        <td style={{ fontWeight: 700, fontSize: 14, color: margin >= 80 ? "#4ade80" : margin >= 70 ? "#facc15" : "#f87171" }}>{margin}%</td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: servings === 0 ? "#f87171" : servings <= 10 ? "#facc15" : "#4ade80" }}>{servings}</td>
                                                        <td style={{ fontWeight: 700, fontSize: 15, color: "#60a5fa" }}>{sale?.sold ?? 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* NOT CONNECTED STATE */}
                {!isDemo && (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <div style={{ fontSize: 56, marginBottom: 20 }}>📦</div>
                        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Connect Your POS</h2>
                        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto 28px" }}>Connect Toast, Square, or Clover to auto-populate your inventory from menu items and track usage in real-time.</p>
                        <button onClick={() => window.location.href = '/dashboard/settings'} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", color: "#1a1000", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Go to Integrations</button>
                    </div>
                )}
            </div>
        </>
    );
}
