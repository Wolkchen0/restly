"use client";
import { useState, useEffect, useRef } from "react";
import { FOOD_RECIPES, FOOD_INGREDIENTS, DEMO_FOOD_SALES, getFoodCost, getFoodServingsRemaining, FoodRecipe, FoodIngredient } from "@/services/food-recipes";
import { DRINK_RECIPES, BOTTLE_INVENTORY, DEMO_DRINK_SALES, DrinkRecipe, BottleInfo, getPourCost, getServingsRemaining } from "@/services/drinks";

type TabKey = "All" | "Main" | "Appetizer" | "Side" | "Dessert" | "Bread" | "Soup" | "Drinks" | "BCG";

// AI Agent: find the closest inventory match for a given ingredient name
function aiFindInventoryMatch(name: string, inventory: FoodIngredient[]): FoodIngredient | null {
    const lower = name.toLowerCase().trim();
    const exact = inventory.find(i => i.name.toLowerCase() === lower);
    if (exact) return exact;
    const partial = inventory.find(i => i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase().split(' ')[0]));
    if (partial) return partial;
    const words = lower.split(/\s+/);
    for (const inv of inventory) {
        const invWords = inv.name.toLowerCase().split(/\s+/);
        const overlap = words.filter(w => invWords.some(iw => iw.includes(w) || w.includes(iw)));
        if (overlap.length >= 1) return inv;
    }
    return null;
}

// AI Agent: find closest bottle match for a given spirit name
function aiFindBottleMatch(name: string, bottles: BottleInfo[]): BottleInfo | null {
    const lower = name.toLowerCase().trim();
    const exact = bottles.find(b => b.name.toLowerCase() === lower);
    if (exact) return exact;
    const partial = bottles.find(b => b.name.toLowerCase().includes(lower) || lower.includes(b.name.toLowerCase().split(' ')[0]));
    if (partial) return partial;
    const words = lower.split(/\s+/);
    for (const b of bottles) {
        const bWords = b.name.toLowerCase().split(/\s+/);
        const overlap = words.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
        if (overlap.length >= 1) return b;
    }
    return null;
}

export default function RecipesPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("All");
    const [foodIngredients, setFoodIngredients] = useState<FoodIngredient[]>([...FOOD_INGREDIENTS]);
    const [foodRecipes, setFoodRecipes] = useState<FoodRecipe[]>([...FOOD_RECIPES]);
    const [drinkRecipes, setDrinkRecipes] = useState<DrinkRecipe[]>([...DRINK_RECIPES]);
    const [bottles] = useState<BottleInfo[]>([...BOTTLE_INVENTORY]);
    const [isDemo, setIsDemo] = useState(true);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
    const [editModal, setEditModal] = useState<FoodRecipe | null>(null);
    const [editIngredients, setEditIngredients] = useState<{ inventoryId: string; name: string; amount: number; unit: string; matched?: boolean }[]>([]);
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    // Add ingredient (food)
    const [addIngName, setAddIngName] = useState("");
    const [addIngAmount, setAddIngAmount] = useState("");
    const [addIngUnit, setAddIngUnit] = useState("oz");
    // AI deduction state
    const [aiDeducted, setAiDeducted] = useState(false);
    // Drink edit modal
    const [drinkEditModal, setDrinkEditModal] = useState<DrinkRecipe | null>(null);
    const [drinkEditIngredients, setDrinkEditIngredients] = useState<{ spiritId: string; amountMl: number; name?: string; matched?: boolean }[]>([]);
    const [addSpiritName, setAddSpiritName] = useState("");
    const [addSpiritMl, setAddSpiritMl] = useState("");

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

    // AI Auto-Deduction: simulate POS end-of-day deduction from food inventory
    useEffect(() => {
        if (aiDeducted) return;
        // After 2 seconds, auto-deduct today's sales from inventory (simulated)
        const timer = setTimeout(() => {
            setFoodIngredients(prev => {
                const updated = prev.map(i => ({ ...i }));
                for (const sale of DEMO_FOOD_SALES) {
                    const recipe = foodRecipes.find(r => r.id === sale.recipeId);
                    if (!recipe || sale.sold === 0) continue;
                    for (const ing of recipe.ingredients) {
                        const inv = updated.find(i => i.inventoryId === ing.inventoryId);
                        if (!inv) continue;
                        // Simple deduction (simplified unit matching)
                        const deductAmount = ing.amount * sale.sold;
                        // Only deduct if units match approximately
                        if (ing.unit === inv.unit || ing.unit + 's' === inv.unit || ing.unit === inv.unit + 's'
                            || (ing.unit === 'oz' && inv.unit === 'lbs') || (ing.unit === 'piece' && inv.unit === 'pieces')
                            || (ing.unit === 'portion' && inv.unit === 'portions') || (ing.unit === 'slice' && inv.unit === 'slices')) {
                            let actualDeduct = deductAmount;
                            if (ing.unit === 'oz' && inv.unit === 'lbs') actualDeduct = deductAmount / 16;
                            inv.onHand = Math.max(0, inv.onHand - actualDeduct);
                        }
                    }
                }
                return updated;
            });
            setAiDeducted(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, [aiDeducted, foodRecipes]);

    // Drink recipe cost
    const getDrinkData = (r: DrinkRecipe) => {
        const cost = getPourCost(r, bottles);
        const margin = r.menuPrice > 0 ? Math.round((1 - cost / r.menuPrice) * 100) : 0;
        const dailySales = DEMO_DRINK_SALES.find(s => s.recipeId === r.id)?.sold || 0;
        const servings = getServingsRemaining(r, bottles);
        return { cost, margin, dailySales, servings };
    };

    const filteredFood = foodRecipes.filter(r => {
        if (activeTab !== "All" && activeTab !== "Drinks" && r.category !== activeTab) return false;
        if (activeTab === "Drinks") return false;
        if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const filteredDrinks = activeTab === "All" || activeTab === "Drinks"
        ? drinkRecipes.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
        : [];

    // Stats
    const totalRecipes = foodRecipes.length + drinkRecipes.length;
    const lowStockRecipes = foodRecipes.filter(r => getFoodServingsRemaining(r, foodIngredients) <= 5).length;
    const avgMarginFood = foodRecipes.length > 0 ? Math.round(foodRecipes.reduce((a, r) => a + getFoodData(r).margin, 0) / foodRecipes.length) : 0;
    const totalDailySales = DEMO_FOOD_SALES.reduce((a, s) => a + s.sold, 0) + DEMO_DRINK_SALES.reduce((a, s) => a + s.sold, 0);

    const openEdit = (r: FoodRecipe) => {
        setEditModal(r);
        setEditIngredients(r.ingredients.map(i => {
            const invMatch = foodIngredients.find(fi => fi.inventoryId === i.inventoryId);
            return { ...i, matched: !!invMatch };
        }));
        setAddIngName(""); setAddIngAmount(""); setAddIngUnit("oz");
    };

    const addIngredientToRecipe = () => {
        if (!addIngName.trim() || !addIngAmount) return;
        const match = aiFindInventoryMatch(addIngName, foodIngredients);
        const newIng = {
            inventoryId: match?.inventoryId || `custom_${Date.now()}`,
            name: addIngName.trim(),
            amount: parseFloat(addIngAmount) || 0,
            unit: addIngUnit,
            matched: !!match,
        };
        setEditIngredients(prev => [...prev, newIng]);
        if (match) {
            showToast(`🤖 AI matched "${addIngName}" → ${match.name} (${match.onHand} ${match.unit} in stock)`);
        } else {
            showToast(`⚠️ No inventory match found for "${addIngName}" — add it to Inventory Management`);
        }
        setAddIngName(""); setAddIngAmount(""); setAddIngUnit("oz");
    };

    const removeIngredientFromRecipe = (index: number) => {
        setEditIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const saveEdit = () => {
        if (!editModal) return;
        const updatedIngredients = editIngredients.map(({ matched, ...rest }) => rest);
        setFoodRecipes(prev => prev.map(r => r.id === editModal.id ? { ...r, ingredients: updatedIngredients } : r));
        showToast(`✅ Recipe "${editModal.name}" updated — AI will sync with inventory`);
        setEditModal(null);
    };

    // Drink recipe edit handlers
    const openDrinkEdit = (r: DrinkRecipe) => {
        setDrinkEditModal(r);
        setDrinkEditIngredients(r.ingredients.map(i => {
            const b = bottles.find(x => x.spiritId === i.spiritId);
            return { ...i, name: b?.name || i.spiritId, matched: !!b };
        }));
        setAddSpiritName(""); setAddSpiritMl("");
    };

    const addSpiritToRecipe = () => {
        if (!addSpiritName.trim() || !addSpiritMl) return;
        const match = aiFindBottleMatch(addSpiritName, bottles);
        const newIng = {
            spiritId: match?.spiritId || `custom_spirit_${Date.now()}`,
            amountMl: parseFloat(addSpiritMl) || 0,
            name: match?.name || addSpiritName.trim(),
            matched: !!match,
        };
        setDrinkEditIngredients(prev => [...prev, newIng]);
        if (match) {
            showToast(`🤖 AI matched "${addSpiritName}" → ${match.name} (${match.fullBottles} bottles in stock)`);
        } else {
            showToast(`⚠️ No bottle match for "${addSpiritName}" — add it to Bar Inventory`);
        }
        setAddSpiritName(""); setAddSpiritMl("");
    };

    const removeSpiritFromRecipe = (index: number) => {
        setDrinkEditIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const saveDrinkEdit = () => {
        if (!drinkEditModal) return;
        const updatedIngs = drinkEditIngredients.map(({ name, matched, ...rest }) => rest);
        setDrinkRecipes(prev => prev.map(r => r.id === drinkEditModal.id ? { ...r, ingredients: updatedIngs } : r));
        showToast(`✅ Cocktail "${drinkEditModal.name}" updated — AI synced with bottle inventory`);
        setDrinkEditModal(null);
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
        { key: "BCG", label: "Menu Engineering", icon: "🧠" },
    ];

    // BCG Matrix classification
    const bcgData = foodRecipes.map(r => {
        const data = getFoodData(r);
        return { ...r, ...data };
    });
    const avgSales = bcgData.length > 0 ? bcgData.reduce((a, r) => a + r.dailySales, 0) / bcgData.length : 0;
    const avgMargin = bcgData.length > 0 ? bcgData.reduce((a, r) => a + r.margin, 0) / bcgData.length : 0;
    const classifyBCG = (sales: number, margin: number): { label: string; color: string; bg: string; icon: string; advice: string } => {
        const highSales = sales >= avgSales;
        const highMargin = margin >= avgMargin;
        if (highSales && highMargin) return { label: "Star", color: "#facc15", bg: "rgba(250,204,21,0.08)", icon: "⭐", advice: "Keep promoting — this is your golden item. Feature it prominently on the menu." };
        if (highSales && !highMargin) return { label: "Cash Cow", color: "#4ade80", bg: "rgba(74,222,128,0.08)", icon: "🐄", advice: "High volume but low margin. Negotiate supplier prices or reduce portion size slightly." };
        if (!highSales && highMargin) return { label: "Puzzle", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", icon: "❓", advice: "Great margin but low sales. Train servers to upsell this item. Add to specials board." };
        return { label: "Dog", color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: "🐕", advice: "Low sales + low margin. Consider removing from menu or reworking the recipe." };
    };

    return (
        <>
            <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileChange} />

            {toastMsg && <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, background: "rgba(10,10,15,0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{toastMsg}</div>}

            {/* EDIT MODAL */}
            {editModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setEditModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "32px 36px", width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>✏️ Edit Recipe</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{editModal.name} — {editModal.category}</div>

                        {/* Menu Price - READ ONLY (from POS) */}
                        <div style={{ marginBottom: 18, padding: "14px 18px", background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)", borderRadius: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 2 }}>Menu Price</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>${editModal.menuPrice}</div>
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(96,165,250,0.7)", background: "rgba(96,165,250,0.08)", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>🔒 POS Controlled</div>
                            </div>
                        </div>

                        {/* Ingredients List */}
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Ingredients ({editIngredients.length})</label>
                        </div>
                        {editIngredients.map((ing, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${ing.matched !== false ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}` }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ing.matched !== false ? "#4ade80" : "#f87171", flexShrink: 0 }} title={ing.matched !== false ? "Linked to inventory" : "Not in inventory"} />
                                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{ing.name}</span>
                                <input type="number" step="0.1" value={ing.amount} onChange={e => { const u = [...editIngredients]; u[i].amount = parseFloat(e.target.value) || 0; setEditIngredients(u); }} style={{ width: 65, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 8px", fontSize: 13, fontWeight: 700, color: "#E8C96E", textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", minWidth: 35 }}>{ing.unit}</span>
                                <button onClick={() => removeIngredientFromRecipe(i)} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "4px 8px", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>✕</button>
                            </div>
                        ))}

                        {/* Add New Ingredient */}
                        <div style={{ marginTop: 12, padding: "14px", background: "rgba(167,139,250,0.04)", border: "1px dashed rgba(167,139,250,0.2)", borderRadius: 12, marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", marginBottom: 8 }}>🤖 Add Ingredient (AI will match to inventory)</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="text" value={addIngName} onChange={e => setAddIngName(e.target.value)} placeholder="Ingredient name..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                                <input type="number" step="0.1" value={addIngAmount} onChange={e => setAddIngAmount(e.target.value)} placeholder="Qty" style={{ width: 60, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 8px", fontSize: 13, color: "#E8C96E", textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                                <select value={addIngUnit} onChange={e => setAddIngUnit(e.target.value)} style={{ width: 70, background: "#1a1a2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 6px", fontSize: 12, color: "#fff", fontFamily: "inherit" }}>
                                    <option value="oz">oz</option>
                                    <option value="lbs">lbs</option>
                                    <option value="piece">piece</option>
                                    <option value="portion">portion</option>
                                    <option value="slice">slice</option>
                                    <option value="cups">cups</option>
                                </select>
                                <button onClick={addIngredientToRecipe} style={{ padding: "10px 14px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, color: "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
                            </div>
                        </div>

                        {/* Cost Preview */}
                        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                <span>Food Cost: <strong style={{ color: "#facc15" }}>${getFoodCost(editModal, foodIngredients).toFixed(2)}</strong></span>
                                <span>Margin: <strong style={{ color: "#4ade80" }}>{editModal.menuPrice > 0 ? Math.round((1 - getFoodCost(editModal, foodIngredients) / editModal.menuPrice) * 100) : 0}%</strong></span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={saveEdit} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", borderRadius: 10, color: "#1a1000", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💾 Save Recipe</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRINK EDIT MODAL */}
            {drinkEditModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setDrinkEditModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20, padding: "32px 36px", width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>🍸 Edit Cocktail</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{drinkEditModal.name} — {drinkEditModal.category}</div>

                        {/* Menu Price - READ ONLY (from POS) */}
                        <div style={{ marginBottom: 18, padding: "14px 18px", background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)", borderRadius: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 2 }}>Menu Price</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>${drinkEditModal.menuPrice}</div>
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(96,165,250,0.7)", background: "rgba(96,165,250,0.08)", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>🔒 POS Controlled</div>
                            </div>
                        </div>

                        {/* Spirit Ingredients */}
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Spirits & Ingredients ({drinkEditIngredients.length})</label>
                        </div>
                        {drinkEditIngredients.map((ing, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${ing.matched !== false ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}` }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ing.matched !== false ? "#4ade80" : "#f87171", flexShrink: 0 }} title={ing.matched !== false ? "Linked to bar inventory" : "Not in bar inventory"} />
                                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{ing.name || ing.spiritId}</span>
                                <input type="number" step="1" value={ing.amountMl} onChange={e => { const u = [...drinkEditIngredients]; u[i].amountMl = parseFloat(e.target.value) || 0; setDrinkEditIngredients(u); }} style={{ width: 65, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 8px", fontSize: 13, fontWeight: 700, color: "#E8C96E", textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", minWidth: 20 }}>ml</span>
                                <button onClick={() => removeSpiritFromRecipe(i)} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "4px 8px", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>✕</button>
                            </div>
                        ))}

                        {/* Add Spirit */}
                        <div style={{ marginTop: 12, padding: "14px", background: "rgba(167,139,250,0.04)", border: "1px dashed rgba(167,139,250,0.2)", borderRadius: 12, marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", marginBottom: 8 }}>🤖 Add Spirit (AI will match to bar inventory)</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="text" value={addSpiritName} onChange={e => setAddSpiritName(e.target.value)} placeholder="Spirit name..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                                <input type="number" step="1" value={addSpiritMl} onChange={e => setAddSpiritMl(e.target.value)} placeholder="ml" style={{ width: 60, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 8px", fontSize: 13, color: "#E8C96E", textAlign: "center", outline: "none", fontFamily: "inherit" }} />
                                <button onClick={addSpiritToRecipe} style={{ padding: "10px 14px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 8, color: "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
                            </div>
                        </div>

                        {/* Pour Cost Preview */}
                        <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                <span>Pour Cost: <strong style={{ color: "#facc15" }}>${getDrinkData(drinkEditModal).cost.toFixed(2)}</strong></span>
                                <span>Margin: <strong style={{ color: "#4ade80" }}>{getDrinkData(drinkEditModal).margin}%</strong></span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setDrinkEditModal(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={saveDrinkEdit} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#a78bfa,#c4b5fd)", border: "none", borderRadius: 10, color: "#1a1000", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💾 Save Cocktail</button>
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

                {/* AI Inventory Agent Status */}
                <div style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 2 }}>AI Inventory Agent</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                            {aiDeducted
                                ? `✅ Today's POS sales deducted from inventory — ${DEMO_FOOD_SALES.reduce((a, s) => a + s.sold, 0)} dishes processed across ${foodRecipes.length} recipes`
                                : "⏳ Processing today's POS sales data..."}
                        </div>
                    </div>
                    <div style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: aiDeducted ? "rgba(74,222,128,0.08)" : "rgba(250,204,21,0.08)", color: aiDeducted ? "#4ade80" : "#facc15", fontWeight: 700 }}>
                        {aiDeducted ? "SYNCED" : "SYNCING..."}
                    </div>
                </div>

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
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>AI linked to Bottle Inventory</div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Cocktail</th>
                                    <th style={thStyle}>Ingredients</th>
                                    <th style={thStyle}>Price</th>
                                    <th style={thStyle}>Pour Cost</th>
                                    <th style={thStyle}>Margin</th>
                                    <th style={thStyle}>Can Make</th>
                                    <th style={thStyle}>Daily Sales</th>
                                    <th style={{ ...thStyle, width: 60 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrinks.map(r => {
                                    const d = getDrinkData(r);
                                    const isExpanded = expandedRecipe === r.id;
                                    return [
                                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }} onClick={() => setExpandedRecipe(isExpanded ? null : r.id)}>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: "#fff" }}>{r.name}</span></td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                    {r.ingredients.map(i => {
                                                        const b = bottles.find(x => x.spiritId === i.spiritId);
                                                        return b ? `${b.name} ${i.amountMl}ml` : `${i.spiritId} ${i.amountMl}ml`;
                                                    }).join(" · ")}
                                                </span>
                                            </td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: "#fff" }}>${r.menuPrice}</span></td>
                                            <td style={tdStyle}><span style={{ color: "rgba(255,255,255,0.5)" }}>${d.cost.toFixed(2)}</span></td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: d.margin >= 70 ? "#4ade80" : d.margin >= 50 ? "#facc15" : "#f87171" }}>{d.margin}%</span></td>
                                            <td style={tdStyle}><span style={{ fontWeight: 700, color: d.servings <= 5 ? "#f87171" : d.servings <= 15 ? "#facc15" : "#4ade80" }}>{d.servings}</span></td>
                                            <td style={tdStyle}><span style={{ color: "#60a5fa" }}>{d.dailySales > 0 ? <><span style={{ fontSize: 10, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)", padding: "1px 5px", borderRadius: 4, marginRight: 4 }}>POS</span>{d.dailySales}</> : "—"}</span></td>
                                            <td style={tdStyle}>
                                                <button onClick={e => { e.stopPropagation(); openDrinkEdit(r); }} style={{ fontSize: 11, padding: "5px 10px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)", color: "#a78bfa", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>✏️</button>
                                            </td>
                                        </tr>,
                                        isExpanded && (
                                            <tr key={r.id + "-detail"}>
                                                <td colSpan={8} style={{ padding: "0 20px 16px", background: "rgba(255,255,255,0.01)" }}>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, padding: "12px 0" }}>
                                                        {r.ingredients.map((ing, i) => {
                                                            const b = bottles.find(x => x.spiritId === ing.spiritId);
                                                            return (
                                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${b ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}` }}>
                                                                    <div>
                                                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{b?.name || ing.spiritId}</span>
                                                                        {b && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{b.fullBottles} bottles in stock</div>}
                                                                    </div>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{ing.amountMl}ml</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>💡 AI: {d.dailySales > 0 ? `${d.dailySales} daily sales × ${r.ingredients.length} spirits = ~$${(d.cost * d.dailySales).toFixed(2)}/day pour cost` : "No POS sales data yet"}</div>
                                                </td>
                                            </tr>
                                        )
                                    ];
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* ── BCG MENU ENGINEERING MATRIX ── */}
                {activeTab === "BCG" && (
                    <div>
                        {/* BCG Summary Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                            {[
                                { label: "Stars", icon: "⭐", color: "#facc15", items: bcgData.filter(r => classifyBCG(r.dailySales, r.margin).label === "Star") },
                                { label: "Cash Cows", icon: "🐄", color: "#4ade80", items: bcgData.filter(r => classifyBCG(r.dailySales, r.margin).label === "Cash Cow") },
                                { label: "Puzzles", icon: "❓", color: "#60a5fa", items: bcgData.filter(r => classifyBCG(r.dailySales, r.margin).label === "Puzzle") },
                                { label: "Dogs", icon: "🐕", color: "#f87171", items: bcgData.filter(r => classifyBCG(r.dailySales, r.margin).label === "Dog") },
                            ].map(cat => (
                                <div key={cat.label} style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}25`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                                    <div style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: cat.color }}>{cat.items.length}</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{cat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* BCG Info Banner */}
                        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 20 }}>🧠</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#E8C96E", marginBottom: 4 }}>AI Menu Engineering Analysis</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                                    Items are classified based on daily sales (avg: {avgSales.toFixed(1)}/day) and profit margin (avg: {avgMargin.toFixed(0)}%).
                                    <strong style={{ color: "#facc15" }}> Stars</strong> are your top performers.
                                    <strong style={{ color: "#60a5fa" }}> Puzzles</strong> have high margin but need more visibility.
                                    <strong style={{ color: "#f87171" }}> Dogs</strong> should be reconsidered.
                                </div>
                            </div>
                        </div>

                        {/* BCG Table */}
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <th style={thStyle}>Item</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Price</th>
                                        <th style={thStyle}>Cost</th>
                                        <th style={thStyle}>Margin</th>
                                        <th style={thStyle}>Daily Sales</th>
                                        <th style={thStyle}>BCG Class</th>
                                        <th style={thStyle}>AI Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bcgData
                                        .sort((a, b) => {
                                            const order = { "Star": 0, "Cash Cow": 1, "Puzzle": 2, "Dog": 3 };
                                            return (order[classifyBCG(a.dailySales, a.margin).label as keyof typeof order] || 0) - (order[classifyBCG(b.dailySales, b.margin).label as keyof typeof order] || 0);
                                        })
                                        .map(r => {
                                            const bcg = classifyBCG(r.dailySales, r.margin);
                                            return (
                                                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                    <td style={{ ...tdStyle, fontWeight: 700, color: "#fff", fontSize: 13 }}>{r.name}</td>
                                                    <td style={{ ...tdStyle, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{r.category}</td>
                                                    <td style={{ ...tdStyle, fontSize: 13, color: "#fff", fontWeight: 600 }}>${r.menuPrice}</td>
                                                    <td style={{ ...tdStyle, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>${r.cost.toFixed(2)}</td>
                                                    <td style={{ ...tdStyle, fontSize: 13, fontWeight: 700, color: r.margin >= avgMargin ? "#4ade80" : "#f87171" }}>{r.margin}%</td>
                                                    <td style={{ ...tdStyle, fontSize: 13, color: r.dailySales >= avgSales ? "#4ade80" : "rgba(255,255,255,0.5)" }}>{r.dailySales}/day</td>
                                                    <td style={tdStyle}>
                                                        <span style={{ background: bcg.bg, color: bcg.color, border: `1px solid ${bcg.color}30`, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                                                            {bcg.icon} {bcg.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...tdStyle, fontSize: 11, color: "rgba(255,255,255,0.45)", maxWidth: 220, lineHeight: 1.5 }}>{bcg.advice}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab !== "BCG" && filteredFood.length === 0 && filteredDrinks.length === 0 && (
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
