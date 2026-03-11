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
                setIsDemo(restName.toLowerCase() === "meyhouse");
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
                <div className="topbar-title">🍽️ Chef & Recipe Management</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handlePhotoUpload} disabled={uploading}>
                        {uploading ? "Analyzing Recipe..." : "📸 AI Photo Import"}
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
                            {t === "All" ? "📦 All Recipes" : t === "Food" ? "🍽️ Food" : "🍹 Drink"}
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

            {/* CUSTOM MODAL FOR NEW / EDIT RECIPE */}
            {recipeModalOpen && editingRecipe && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 440, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#fff" }}>
                            {recipes.some(r => r.id === editingRecipe.id) ? "Edit Recipe" : "Create New Recipe"}
                        </h3>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Recipe Name *</label>
                            <input
                                autoFocus
                                type="text"
                                value={editingRecipe.name}
                                onChange={e => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
                                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none" }}
                                placeholder="e.g. Lobster Bisque"
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Category (Food/Drink) *</label>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    onClick={() => setEditingRecipe({ ...editingRecipe, category: "Food" })}
                                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: editingRecipe.category === "Food" ? "1px solid #E8C96E" : "1px solid rgba(255,255,255,0.1)", background: editingRecipe.category === "Food" ? "rgba(201,168,76,0.1)" : "transparent", color: editingRecipe.category === "Food" ? "#E8C96E" : "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                                    🍽️ Food
                                </button>
                                <button
                                    onClick={() => setEditingRecipe({ ...editingRecipe, category: "Drink" })}
                                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: editingRecipe.category === "Drink" ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.1)", background: editingRecipe.category === "Drink" ? "rgba(74,222,128,0.1)" : "transparent", color: editingRecipe.category === "Drink" ? "#4ade80" : "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                                    🍹 Drink
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>BOM / Ingredients</label>
                            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <input
                                    type="text"
                                    value={newIngredient}
                                    onChange={e => setNewIngredient(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleAddIngredient(); }}
                                    style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 13, outline: "none" }}
                                    placeholder="e.g. 150g Beef Patty"
                                />
                                <button onClick={handleAddIngredient} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "0 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add</button>
                            </div>

                            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 150, overflowY: "auto", border: editingRecipe.ingredients.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", borderRadius: 8 }}>
                                {editingRecipe.ingredients.map((ing: string, i: number) => (
                                    <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{ing}</span>
                                        <button onClick={() => handleRemoveIngredient(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 12 }}>Remove</button>
                                    </li>
                                ))}
                                {editingRecipe.ingredients.length === 0 && (
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "12px 0" }}>No ingredients added yet.</div>
                                )}
                            </ul>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                            <button className="btn-secondary" onClick={() => setRecipeModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmRecipe}>Save Recipe</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content fade-in">

                {isDemo ? (
                    <div className="grid-3">
                        {recipes.filter(r => activeTab === "All" || r.category === activeTab).map(recipe => (
                            <div key={recipe.id} className="card">
                                <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                                    <span className="badge badge-purple">{recipe.type}</span>
                                    <button onClick={() => handleEditRecipe(recipe)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer", padding: "0 8px" }} title="Edit Recipe">⋮</button>
                                </div>
                                <div className="card-body">
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 10, marginBottom: 16 }}>{recipe.name}</h3>

                                    <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px", marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Plate Cost</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--red)" }}>${recipe.cost.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Menu Price</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green)" }}>${recipe.price.toFixed(2)}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>COGS</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: recipe.cogs > 25 ? "var(--yellow)" : "inherit" }}>{recipe.cogs}%</div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>BOM (Bill of Materials)</div>
                                    <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                                        {recipe.ingredients.length > 0 ? recipe.ingredients.map((ing: string, i: number) => (
                                            <li key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "6px 0", display: "flex", justifyContent: "space-between" }}>
                                                <span>{ing}</span>
                                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Linked ✓</span>
                                            </li>
                                        )) : (
                                            <li style={{ padding: "6px 0", cursor: "pointer", color: "rgba(201,168,76,0.8)", fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }} onClick={() => handleEditRecipe(recipe)}>
                                                <span>+</span> Tap to add ingredients to BOM
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ))}
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
