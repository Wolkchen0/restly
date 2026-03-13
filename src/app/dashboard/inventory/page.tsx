"use client";
import { useState, useEffect, useCallback } from "react";
import { BOTTLE_INVENTORY, DRINK_RECIPES, DEMO_DRINK_SALES, getTotalMlRemaining, getServingsRemaining, getPourCost, getCocktailsUsing, type BottleInfo, type DrinkRecipe } from "@/services/drinks";
import { FOOD_INGREDIENTS, FOOD_RECIPES, DEMO_FOOD_SALES, getFoodCost, getFoodServingsRemaining, getRecipesUsing, type FoodIngredient } from "@/services/food-recipes";

export default function InventoryPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"Food" | "Drink">("Food");
    const [isDemo, setIsDemo] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lastSynced, setLastSynced] = useState<string>("");
    const [syncCountdown, setSyncCountdown] = useState(600);
    const [bottles, setBottles] = useState<BottleInfo[]>([]);
    const [foodIngredients, setFoodIngredients] = useState<FoodIngredient[]>(FOOD_INGREDIENTS);
    const [drinkSubTab, setDrinkSubTab] = useState<"bottles" | "cocktails">("bottles");
    const [foodSubTab, setFoodSubTab] = useState<"ingredients" | "recipes">("recipes");
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [recipes, setRecipes] = useState<DrinkRecipe[]>(DRINK_RECIPES);

    // Receive Stock Modal
    const [receiveModal, setReceiveModal] = useState<{ type: "bottle" | "food"; id: string; name: string; unit: string; sizeMl?: number } | null>(null);
    const [receiveQty, setReceiveQty] = useState("");
    const [receiveUnit, setReceiveUnit] = useState<"bottles" | "cases">("bottles");
    const [receiveMode, setReceiveMode] = useState<"add" | "remove">("add");

    // Recipe Edit Modal
    const [editRecipe, setEditRecipe] = useState<DrinkRecipe | null>(null);
    const [editIngredients, setEditIngredients] = useState<{ spiritId: string; amountMl: number }[]>([]);
    const [editPrice, setEditPrice] = useState("");

    // Add New Food Ingredient Modal
    const [addFoodModal, setAddFoodModal] = useState(false);
    const [newFoodName, setNewFoodName] = useState("");
    const [newFoodUnit, setNewFoodUnit] = useState("lbs");
    const [newFoodQty, setNewFoodQty] = useState("");
    const [newFoodCost, setNewFoodCost] = useState("");
    const [newFoodSupplier, setNewFoodSupplier] = useState("");

    // Rename ingredient
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    // ── Auto-deduction: subtract POS sales from bottle inventory ──
    const deductSalesFromBottles = useCallback((baseBottles: BottleInfo[], drinkRecipes: DrinkRecipe[]) => {
        const updated = baseBottles.map(b => ({ ...b }));
        for (const sale of DEMO_DRINK_SALES) {
            const recipe = drinkRecipes.find(r => r.id === sale.recipeId);
            if (!recipe || sale.sold === 0) continue;
            for (const ing of recipe.ingredients) {
                const bottle = updated.find(b => b.spiritId === ing.spiritId);
                if (!bottle) continue;
                let mlToDeduct = ing.amountMl * sale.sold;
                // Deduct from open bottle first, then full bottles
                if (bottle.openBottleMl > 0) {
                    const fromOpen = Math.min(bottle.openBottleMl, mlToDeduct);
                    bottle.openBottleMl -= fromOpen;
                    mlToDeduct -= fromOpen;
                }
                while (mlToDeduct > 0 && bottle.fullBottles > 0) {
                    bottle.fullBottles--;
                    bottle.openBottleMl = bottle.sizeMl;
                    const fromNew = Math.min(bottle.openBottleMl, mlToDeduct);
                    bottle.openBottleMl -= fromNew;
                    mlToDeduct -= fromNew;
                }
                if (mlToDeduct > 0) { bottle.openBottleMl = 0; bottle.fullBottles = 0; }
            }
        }
        return updated;
    }, []);

    useEffect(() => {
        setBottles(deductSalesFromBottles(BOTTLE_INVENTORY, recipes));
    }, [recipes, deductSalesFromBottles]);

    const openReceiveBottle = (b: BottleInfo, mode: "add" | "remove" = "add") => {
        setReceiveModal({ type: "bottle", id: b.spiritId, name: b.name, unit: "bottles", sizeMl: b.sizeMl });
        setReceiveQty(""); setReceiveUnit("bottles"); setReceiveMode(mode);
    };
    const openReceiveFood = (i: FoodIngredient, mode: "add" | "remove" = "add") => {
        setReceiveModal({ type: "food", id: i.inventoryId, name: i.name, unit: i.unit });
        setReceiveQty(""); setReceiveMode(mode);
    };
    const confirmReceive = () => {
        const qty = parseFloat(receiveQty);
        if (!qty || qty <= 0 || !receiveModal) return;
        if (receiveMode === "add") {
            if (receiveModal.type === "bottle") {
                const addBottles = receiveUnit === "cases" ? qty * 12 : qty;
                setBottles(prev => prev.map(b => b.spiritId === receiveModal.id ? { ...b, fullBottles: b.fullBottles + addBottles } : b));
                showToast(`✅ Received ${receiveUnit === "cases" ? `${qty} case(s) (${addBottles} bottles)` : `${qty} bottle(s)`} of ${receiveModal.name}`);
            } else {
                setFoodIngredients(prev => prev.map(i => i.inventoryId === receiveModal.id ? { ...i, onHand: i.onHand + qty } : i));
                showToast(`✅ Received ${qty} ${receiveModal.unit} of ${receiveModal.name}`);
            }
        } else {
            // REMOVE mode
            if (receiveModal.type === "bottle") {
                const rmBottles = receiveUnit === "cases" ? qty * 12 : qty;
                setBottles(prev => prev.map(b => b.spiritId === receiveModal.id ? { ...b, fullBottles: Math.max(0, b.fullBottles - rmBottles) } : b));
                showToast(`🗑️ Removed ${receiveUnit === "cases" ? `${qty} case(s) (${rmBottles} bottles)` : `${qty} bottle(s)`} of ${receiveModal.name}`);
            } else {
                setFoodIngredients(prev => prev.map(i => i.inventoryId === receiveModal.id ? { ...i, onHand: Math.max(0, i.onHand - qty) } : i));
                showToast(`🗑️ Removed ${qty} ${receiveModal.unit} of ${receiveModal.name}`);
            }
        }
        setReceiveModal(null);
    };

    // Recipe Edit Handlers
    const openEditRecipe = (r: DrinkRecipe) => {
        setEditRecipe(r);
        setEditIngredients(r.ingredients.map(i => ({ ...i })));
        setEditPrice(String(r.menuPrice));
    };
    const saveRecipe = () => {
        if (!editRecipe) return;
        setRecipes(prev => prev.map(r => r.id === editRecipe.id ? { ...r, ingredients: editIngredients, menuPrice: parseFloat(editPrice) || r.menuPrice } : r));
        showToast(`✅ Updated recipe: ${editRecipe.name}`);
        setEditRecipe(null);
    };

    // Add New Food Ingredient
    const confirmAddFood = () => {
        if (!newFoodName.trim()) return;
        const newItem: FoodIngredient = {
            inventoryId: `fi_custom_${Date.now()}`,
            name: newFoodName.trim(),
            onHand: parseFloat(newFoodQty) || 0,
            unit: newFoodUnit,
            costPerUnit: parseFloat(newFoodCost) || 0,
            supplier: newFoodSupplier || "Manual",
            source: "manual",
        };
        setFoodIngredients(prev => [...prev, newItem]);
        setAddFoodModal(false);
        setNewFoodName(""); setNewFoodUnit("lbs"); setNewFoodQty(""); setNewFoodCost(""); setNewFoodSupplier("");
        showToast(`✅ Added "${newItem.name}" to inventory`);
    };

    // Rename ingredient
    const startRename = (id: string, currentName: string) => {
        setRenamingId(id);
        setRenameValue(currentName);
    };
    const confirmRename = () => {
        if (!renamingId || !renameValue.trim()) return;
        setFoodIngredients(prev => prev.map(i => i.inventoryId === renamingId ? { ...i, name: renameValue.trim() } : i));
        showToast(`✅ Renamed to "${renameValue.trim()}"`);
        setRenamingId(null);
    };

    // Delete ingredient
    const deleteIngredient = (id: string, name: string) => {
        if (!confirm(`Remove "${name}" from inventory?`)) return;
        setFoodIngredients(prev => prev.filter(i => i.inventoryId !== id));
        showToast(`🗑️ Removed "${name}"`);
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
    const filteredDrinkRecipes = recipes.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
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

            {/* ── STOCK ADJUSTMENT MODAL ── */}
            {receiveModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setReceiveModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: `1px solid ${receiveMode === "remove" ? "rgba(248,113,113,0.2)" : "rgba(201,168,76,0.2)"}`, borderRadius: 20, padding: "36px 36px 32px", width: 520, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        {/* Mode Toggle */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
                            <button onClick={() => setReceiveMode("add")} style={{ padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, border: "none", background: receiveMode === "add" ? "rgba(74,222,128,0.12)" : "transparent", color: receiveMode === "add" ? "#4ade80" : "rgba(255,255,255,0.35)" }}>📦 Receive Stock</button>
                            <button onClick={() => setReceiveMode("remove")} style={{ padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, border: "none", background: receiveMode === "remove" ? "rgba(248,113,113,0.12)" : "transparent", color: receiveMode === "remove" ? "#f87171" : "rgba(255,255,255,0.35)" }}>🗑️ Remove Stock</button>
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>{receiveMode === "add" ? "Add incoming inventory for" : "Remove / write off stock for"} <strong style={{ color: receiveMode === "remove" ? "#f87171" : "#E8C96E" }}>{receiveModal.name}</strong></div>

                        {/* Unit Type Selector (for bottles) */}
                        {receiveModal.type === "bottle" && (
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10, letterSpacing: 0.5 }}>Receive As</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {(["bottles", "cases"] as const).map(u => (
                                        <button key={u} onClick={() => setReceiveUnit(u)} style={{
                                            padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                            border: receiveUnit === u ? "2px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 12,
                                            background: receiveUnit === u ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)",
                                            color: receiveUnit === u ? "#E8C96E" : "rgba(255,255,255,0.4)",
                                            textAlign: "center",
                                        }}>
                                            {u === "bottles" ? "🍾 Bottles" : "📦 Cases (12 bottles)"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Input */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10, letterSpacing: 0.5 }}>
                                {receiveModal.type === "bottle" ? `How many ${receiveUnit}?` : `Quantity (${receiveModal.unit})`}
                            </label>
                            <input
                                type="number" min="1" step="1" value={receiveQty}
                                onChange={e => setReceiveQty(e.target.value)}
                                placeholder={receiveModal.type === "bottle" ? (receiveUnit === "cases" ? "e.g. 4 cases" : "e.g. 12 bottles") : `e.g. 50 ${receiveModal.unit}`}
                                autoFocus
                                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 20px", fontSize: 20, fontWeight: 700, color: "#fff", outline: "none", fontFamily: "inherit" }}
                            />
                        </div>

                        {/* Calculation Preview */}
                        {receiveModal.type === "bottle" && receiveQty && parseFloat(receiveQty) > 0 && (
                            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 22, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                                Adding <strong style={{ color: "#E8C96E" }}>{receiveUnit === "cases" ? `${parseFloat(receiveQty) * 12} bottles` : `${receiveQty} bottle(s)`}</strong> ({receiveModal.sizeMl}ml each)<br />
                                Total volume: <strong style={{ color: "#4ade80", fontSize: 16 }}>{((receiveUnit === "cases" ? parseFloat(receiveQty) * 12 : parseFloat(receiveQty)) * (receiveModal.sizeMl || 750) / 1000).toFixed(1)}L</strong>
                            </div>
                        )}
                        {receiveModal.type === "food" && receiveQty && parseFloat(receiveQty) > 0 && (
                            <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 22, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
                                Adding <strong style={{ color: "#4ade80" }}>{receiveQty} {receiveModal.unit}</strong> of {receiveModal.name}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setReceiveModal(null)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={confirmReceive} disabled={!receiveQty || parseFloat(receiveQty) <= 0} style={{
                                flex: 1, padding: "14px", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: receiveQty ? "pointer" : "not-allowed", fontFamily: "inherit",
                                background: receiveQty && parseFloat(receiveQty) > 0 ? (receiveMode === "remove" ? "linear-gradient(135deg,#dc2626,#f87171)" : "linear-gradient(135deg,#C9A84C,#E8C96E)") : "rgba(255,255,255,0.04)",
                                color: receiveQty && parseFloat(receiveQty) > 0 ? "#fff" : "rgba(255,255,255,0.3)",
                            }}>{receiveMode === "remove" ? "🗑️ Confirm Removal" : "✅ Confirm Receive"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD FOOD INGREDIENT MODAL */}
            {addFoodModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setAddFoodModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "32px 36px", width: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>+ Add New Ingredient</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Add a new raw ingredient to your inventory</div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>NAME *</label>
                            <input autoFocus type="text" value={newFoodName} onChange={e => setNewFoodName(e.target.value)} placeholder="e.g. Ground Chicken, Olive Oil..." style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>QUANTITY ON HAND</label>
                                <input type="number" value={newFoodQty} onChange={e => setNewFoodQty(e.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#E8C96E", outline: "none", fontFamily: "inherit" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>UNIT</label>
                                <select value={newFoodUnit} onChange={e => setNewFoodUnit(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "#1a1a2a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit" }}>
                                    <option value="lbs">lbs</option>
                                    <option value="oz">oz</option>
                                    <option value="pieces">pieces</option>
                                    <option value="portions">portions</option>
                                    <option value="slices">slices</option>
                                    <option value="loaves">loaves</option>
                                    <option value="quarts">quarts</option>
                                    <option value="gallons">gallons</option>
                                    <option value="bottles">bottles</option>
                                    <option value="cases">cases</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>COST PER UNIT ($)</label>
                                <input type="number" step="0.01" value={newFoodCost} onChange={e => setNewFoodCost(e.target.value)} placeholder="0.00" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>SUPPLIER</label>
                                <input type="text" value={newFoodSupplier} onChange={e => setNewFoodSupplier(e.target.value)} placeholder="e.g. US Foods" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setAddFoodModal(false)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={confirmAddFood} disabled={!newFoodName.trim()} style={{ flex: 1, padding: "14px", background: newFoodName.trim() ? "linear-gradient(135deg,#22c55e,#4ade80)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 12, color: newFoodName.trim() ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 800, cursor: newFoodName.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>✅ Add to Inventory</button>
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
                            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", fontSize: 14, color: "#fff", outline: "none", width: 200 }} />
                                {foodSubTab === "ingredients" && (
                                    <button onClick={() => setAddFoodModal(true)} style={{ fontSize: 13, padding: "10px 16px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>+ Add Item</button>
                                )}
                            </div>
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
                                                        <td style={{ fontWeight: 700, color: status === "OUT" ? "#f87171" : "#fff", fontSize: 14 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                {status === "OUT" && <span>🚨</span>}
                                                                {status === "Low" && <span>⚠️</span>}
                                                                {renamingId === i.inventoryId ? (
                                                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                                        <input autoFocus type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmRename()} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, padding: "4px 8px", fontSize: 13, color: "#E8C96E", outline: "none", fontFamily: "inherit", width: 160 }} />
                                                                        <button onClick={confirmRename} style={{ fontSize: 11, padding: "4px 8px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 4, color: "#4ade80", cursor: "pointer", fontFamily: "inherit" }}>✓</button>
                                                                        <button onClick={() => setRenamingId(null)} style={{ fontSize: 11, padding: "4px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span>{i.name}</span>
                                                                        <button onClick={() => startRename(i.inventoryId, i.name)} title="Rename" style={{ fontSize: 10, padding: "2px 5px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>✏️</button>
                                                                    </>
                                                                )}
                                                            </div>
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
                                                            <div style={{ display: "flex", gap: 4 }}>
                                                                <button onClick={() => openReceiveFood(i, "add")} style={{ fontSize: 12, padding: "6px 10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>+</button>
                                                                <button onClick={() => openReceiveFood(i, "remove")} style={{ fontSize: 12, padding: "6px 10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>−</button>
                                                                <button onClick={() => deleteIngredient(i.inventoryId, i.name)} style={{ fontSize: 12, padding: "6px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>🗑</button>
                                                            </div>
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
                                                <th>Today POS Usage</th><th>Used In</th><th>Cost</th><th>Action</th>
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
                                                        <td style={{ fontSize: 12, color: "#60a5fa" }}>
                                                            {(() => { let used = 0; for (const sale of DEMO_DRINK_SALES) { const r = recipes.find(x => x.id === sale.recipeId); if (!r) continue; const ing = r.ingredients.find(x => x.spiritId === b.spiritId); if (ing) used += ing.amountMl * sale.sold; } return used > 0 ? <><span className="inv-badge-pos" style={{ marginRight: 4 }}>POS</span>{(used/1000).toFixed(1)}L</> : "—"; })()}
                                                        </td>
                                                        <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 140 }}>
                                                            {usedIn.length > 0 ? usedIn.slice(0, 2).map(r => r.name).join(", ") + (usedIn.length > 2 ? ` +${usedIn.length - 2}` : "") : "—"}
                                                        </td>
                                                        <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>${b.costPerBottle}</td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: 4 }}>
                                                                <button onClick={() => openReceiveBottle(b, "add")} style={{ fontSize: 12, padding: "6px 10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>+</button>
                                                                <button onClick={() => openReceiveBottle(b, "remove")} style={{ fontSize: 12, padding: "6px 10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>−</button>
                                                            </div>
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
                                        { label: "Menu Cocktails", value: recipes.length, color: "#fff" },
                                        { label: "Drinks Sold Today", value: DEMO_DRINK_SALES.reduce((a, s) => a + s.sold, 0), color: "#60a5fa" },
                                        { label: "Bar Revenue", value: `$${DEMO_DRINK_SALES.reduce((a, s) => { const r = recipes.find(x => x.id === s.recipeId); return a + (r ? r.menuPrice * s.sold : 0); }, 0).toLocaleString()}`, color: "#4ade80" },
                                        { label: "Unavailable", value: recipes.filter(r => getServingsRemaining(r, bottles) === 0).length, color: "#f87171" },
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
                                                <th>Can Make</th><th>Sold Today</th><th>Edit</th>
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
                                                        <td><button onClick={() => openEditRecipe(r)} style={{ fontSize: 12, padding: "6px 12px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "#E8C96E", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✏️ Edit</button></td>
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

            {/* ── RECIPE EDIT MODAL ── */}
            {editRecipe && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setEditRecipe(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "36px", width: 540, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>✏️ Edit Recipe — {editRecipe.name}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Adjust ingredient amounts and menu price. Changes auto-recalculate bottle usage.</div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Menu Price ($)</label>
                            <input type="number" min="0" step="0.5" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 18px", fontSize: 18, fontWeight: 700, color: "#4ade80", outline: "none", fontFamily: "inherit" }} />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Ingredients (ml per serving)</label>
                            {editIngredients.map((ing, idx) => {
                                const bot = BOTTLE_INVENTORY.find(b => b.spiritId === ing.spiritId);
                                return (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px" }}>
                                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#fff" }}>{bot?.name || ing.spiritId}</span>
                                        <input type="number" min="1" step="5" value={ing.amountMl} onChange={e => { const v = [...editIngredients]; v[idx] = { ...v[idx], amountMl: parseInt(e.target.value) || 0 }; setEditIngredients(v); }} style={{ width: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 16, fontWeight: 700, color: "#E8C96E", outline: "none", textAlign: "center", fontFamily: "inherit" }} />
                                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>ml</span>
                                    </div>
                                );
                            })}
                        </div>

                        {editIngredients.length > 0 && (() => {
                            let cost = 0;
                            for (const ing of editIngredients) { const bot = BOTTLE_INVENTORY.find(b => b.spiritId === ing.spiritId); if (bot) cost += (ing.amountMl / bot.sizeMl) * bot.costPerBottle; }
                            const price = parseFloat(editPrice) || 0;
                            const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                            return (
                                <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 22, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Pour Cost: <strong style={{ color: "#f87171" }}>${cost.toFixed(2)}</strong></span>
                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Margin: <strong style={{ color: margin >= 70 ? "#4ade80" : "#facc15" }}>{margin}%</strong></span>
                                </div>
                            );
                        })()}

                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setEditRecipe(null)} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={saveRecipe} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", borderRadius: 12, color: "#1a1000", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💾 Save Recipe</button>
                        </div>
                    </div>
                </div>
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
