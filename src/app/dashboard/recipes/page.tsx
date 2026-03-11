"use client";
import { useState, useEffect, useRef } from "react";

const INITIAL_RECIPES = [
    { id: 1, name: "Truffle Burger", cost: 3.45, price: 16.00, cogs: 21.5, type: "Main", category: "Food", ingredients: ["150g Beef Patty", "1x Brioche Bun", "15g Truffle Mayo", "1x Cheddar Slice"] },
    { id: 2, name: "Avocado Toast", cost: 1.80, price: 12.00, cogs: 15.0, type: "Breakfast", category: "Food", ingredients: ["2x Sourdough Slices", "1/2 Hass Avocado", "Chili Flakes", "Olive Oil"] },
    { id: 3, name: "Spicy Marg", cost: 1.10, price: 14.00, cogs: 7.8, type: "Drink", category: "Drink", ingredients: ["2oz Tequila", "1oz Lime Juice", "0.5oz Agave", "Jalapeno Slices"] },
];

export default function RecipesPage() {
    const [recipes, setRecipes] = useState(INITIAL_RECIPES);
    const [uploading, setUploading] = useState(false);
    const [isDemo, setIsDemo] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<"All" | "Food" | "Drink">("All");
    const [recipeModalOpen, setRecipeModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<any>(null);
    const [newIngredient, setNewIngredient] = useState("");
    const [toastMsg, setToastMsg] = useState<string | null>(null);

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

    const handlePhotoUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const result = reader.result as string;
            // The result is a data URI, we pass the full base64 string to our API route
            try {
                const res = await fetch("/api/analyze-recipe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: result })
                });

                if (res.ok) {
                    const data = await res.json();
                    setEditingRecipe({
                        id: Date.now(),
                        name: data.name || "",
                        cost: data.totalCost || 0,
                        price: data.suggestedPrice || 0,
                        cogs: data.projectedCOGS || 0,
                        type: "AI Import",
                        category: activeTab === "Drink" ? "Drink" : "Food",
                        ingredients: data.ingredients || []
                    });
                    setRecipeModalOpen(true);
                    showToast("✨ AI extraction complete! Review and edit if necessary.");
                } else {
                    showToast("Failed to analyze image. Please try again.");
                }
            } catch (err) {
                console.error("AI Analysis error:", err);
                showToast("Failed to connect to the AI engine.");
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    const handleNewRecipe = () => {
        setEditingRecipe({ id: Date.now(), name: "", cost: 0.0, price: 0.0, cogs: 0.0, type: "Custom", category: "", ingredients: [] });
        setRecipeModalOpen(true);
    };

    const handleEditRecipe = (recipe: any) => {
        setEditingRecipe({ ...recipe });
        setRecipeModalOpen(true);
    };

    const confirmRecipe = () => {
        if (!editingRecipe.name.trim()) {
            showToast("⚠️ Recipe name is required.");
            return;
        }
        if (!editingRecipe.category) {
            showToast("⚠️ Please select if this is Food or Drink.");
            return;
        }

        if (recipes.some(r => r.id === editingRecipe.id)) {
            setRecipes(recipes.map(r => r.id === editingRecipe.id ? editingRecipe : r));
            showToast("Recipe updated successfully.");
        } else {
            setRecipes([...recipes, editingRecipe]);
            showToast("Recipe created successfully.");
        }
        setRecipeModalOpen(false);
        setEditingRecipe(null);
        setNewIngredient("");
    };

    const handleAddIngredient = () => {
        if (!newIngredient.trim()) return;
        setEditingRecipe({
            ...editingRecipe,
            ingredients: [...editingRecipe.ingredients, newIngredient.trim()]
        });
        setNewIngredient("");
    };

    const handleRemoveIngredient = (index: number) => {
        const updated = [...editingRecipe.ingredients];
        updated.splice(index, 1);
        setEditingRecipe({ ...editingRecipe, ingredients: updated });
    };

    return (
        <>
            <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div className="topbar">
                <div className="topbar-title">Chef & Recipe Management</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handlePhotoUpload} disabled={uploading}>
                        {uploading ? "Analyzing..." : "AI Photo Import"}
                    </button>
                    <button className="btn-secondary" onClick={handleNewRecipe}>New Recipe +</button>
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
                            {t === "All" ? "All Recipes" : t}
                        </button>
                    ))}
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* IMPROVED MODAL */}
            {recipeModalOpen && editingRecipe && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(8px)" }}>
                    <div className="card" style={{ width: 500, padding: 32, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 24 }}>
                            {recipes.some(r => r.id === editingRecipe.id) ? "Edit Master Recipe" : "Create Master Recipe"}
                        </h2>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={editingRecipe.name}
                                onChange={e => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14, outline: "none" }}
                                placeholder="Recipe name"
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Category</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    onClick={() => setEditingRecipe({ ...editingRecipe, category: "Food" })}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: editingRecipe.category === "Food" ? "1px solid #E8C96E" : "1px solid rgba(255,255,255,0.1)", background: editingRecipe.category === "Food" ? "rgba(201,168,76,0.1)" : "transparent", color: editingRecipe.category === "Food" ? "#E8C96E" : "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 700 }}>
                                    Food
                                </button>
                                <button
                                    onClick={() => setEditingRecipe({ ...editingRecipe, category: "Drink" })}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: editingRecipe.category === "Drink" ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.1)", background: editingRecipe.category === "Drink" ? "rgba(74,222,128,0.1)" : "transparent", color: editingRecipe.category === "Drink" ? "#4ade80" : "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 700 }}>
                                    Drink
                                </button>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editingRecipe.price}
                                    onChange={e => {
                                        const p = parseFloat(e.target.value) || 0;
                                        const c = editingRecipe.cost || 0;
                                        setEditingRecipe({ ...editingRecipe, price: p, cogs: p > 0 ? parseFloat(((c / p) * 100).toFixed(1)) : 0 });
                                    }}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>Unit Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editingRecipe.cost}
                                    onChange={e => {
                                        const c = parseFloat(e.target.value) || 0;
                                        const p = editingRecipe.price || 0;
                                        setEditingRecipe({ ...editingRecipe, cost: c, cogs: p > 0 ? parseFloat(((c / p) * 100).toFixed(1)) : 0 });
                                    }}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Bill of Materials (BOM)</label>
                                <button
                                    onClick={() => {
                                        showToast("Super AI: Suggesting ingredients...");
                                        setTimeout(() => {
                                            const suggestions = editingRecipe.category === "Drink" ? ["Garnish", "Ice Cubes"] : ["10g Salt", "5g Pepper"];
                                            setEditingRecipe({ ...editingRecipe, ingredients: [...editingRecipe.ingredients, ...suggestions] });
                                            showToast("AI added common prep ingredients.");
                                        }, 800);
                                    }}
                                    style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontSize: 10, padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
                                    ✨ Super AI Suggest
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <input
                                    type="text"
                                    placeholder="Add ingredient..."
                                    value={newIngredient}
                                    onChange={e => setNewIngredient(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleAddIngredient(); }}
                                    style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 10, fontSize: 13 }}
                                />
                                <button onClick={handleAddIngredient} className="btn-primary" style={{ padding: "0 16px", borderRadius: 10 }}>Add</button>
                            </div>
                            <div style={{ maxHeight: 150, overflowY: "auto", background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: "8px" }}>
                                {editingRecipe.ingredients.map((ing: string, i: number) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{ing}</span>
                                        <button onClick={() => handleRemoveIngredient(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18 }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setRecipeModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmRecipe} style={{ padding: "10px 24px" }}>Save Recipe</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content fade-in">

                {isDemo ? (
                    <div className="grid-3">
                        <div className="grid-3">
                            {recipes.filter(r => activeTab === "All" || r.category === activeTab).map(recipe => (
                                <div key={recipe.id} className="card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                                    <div style={{ height: 100, background: "linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1 }}>{recipe.category} — {recipe.type}</div>
                                        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 10 }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingRecipe({ ...recipe }); setRecipeModalOpen(true); }}
                                                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRecipes(recipes.filter(r => r.id !== recipe.id));
                                                    showToast(`${recipe.name} deleted.`);
                                                }}
                                                style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ padding: "20px" }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{recipe.name}</h3>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
                                            <span>{recipe.ingredients.length} ingredients</span>
                                            <span style={{ color: recipe.cogs > 30 ? "#f87171" : "#4ade80", fontWeight: 700 }}>{recipe.cogs}% COGS</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <div style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Price</div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>${recipe.price.toFixed(2)}</div>
                                            </div>
                                            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                                                <div style={{ fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Cost</div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>${recipe.cost.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Recipes Found</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Sync your POS and Inventory to automatically calculate recipe plate costs, BOMs, and margins. Or click "AI Photo Import" to try our AI recipe scanner.
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
