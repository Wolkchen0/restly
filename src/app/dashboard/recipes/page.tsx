"use client";
import { useState, useEffect, useRef } from "react";

const INITIAL_RECIPES = [
    { id: 1, name: "Truffle Burger", cost: 3.45, price: 16.00, cogs: 21.5, type: "Main", ingredients: ["150g Beef Patty", "1x Brioche Bun", "15g Truffle Mayo", "1x Cheddar Slice"] },
    { id: 2, name: "Avocado Toast", cost: 1.80, price: 12.00, cogs: 15.0, type: "Breakfast", ingredients: ["2x Sourdough Slices", "1/2 Hass Avocado", "Chili Flakes", "Olive Oil"] },
    { id: 3, name: "Spicy Marg", cost: 1.10, price: 14.00, cogs: 7.8, type: "Drink", ingredients: ["2oz Tequila", "1oz Lime Juice", "0.5oz Agave", "Jalapeno Slices"] },
];

export default function RecipesPage() {
    const [recipes, setRecipes] = useState(INITIAL_RECIPES);
    const [uploading, setUploading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    setAiResult({
                        name: "AI Generated: " + data.name,
                        ingredients: data.ingredients,
                        totalCost: data.totalCost,
                        suggestedPrice: data.suggestedPrice,
                        projectedCOGS: data.projectedCOGS
                    });
                } else {
                    alert("Failed to analyze image. Please try again.");
                }
            } catch (err) {
                console.error("AI Analysis error:", err);
                alert("Failed to connect to the AI engine.");
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    const handleNewRecipe = () => {
        const name = prompt("Enter a name for the new recipe:");
        if (!name) return;

        const newRecipe = {
            id: Date.now(),
            name,
            cost: 0.0,
            price: 0.0,
            cogs: 0.0,
            type: "Custom",
            ingredients: ["Tap to add ingredients..."]
        };
        setRecipes([...recipes, newRecipe]);
    };

    const saveAiRecipe = () => {
        if (!aiResult) return;
        const newRecipe = {
            id: Date.now(),
            name: aiResult.name,
            cost: aiResult.totalCost,
            price: aiResult.suggestedPrice,
            cogs: aiResult.projectedCOGS,
            type: "AI Import",
            ingredients: aiResult.ingredients
        };
        setRecipes([newRecipe, ...recipes]);
        setAiResult(null);
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

            <div className="page-content fade-in">

                {/* AI RESULT BANNER */}
                {aiResult && (
                    <div style={{ background: "rgba(201,168,76, 0.1)", border: "1px solid rgba(201,168,76, 0.3)", borderRadius: 16, padding: "24px", marginBottom: 24, display: "flex", gap: 20 }}>
                        <div style={{ fontSize: 40 }}>✨</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#E8C96E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>AI Recipe Extracted</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12 }}>{aiResult.name}</div>

                            <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Live Plate Cost</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--red)" }}>${aiResult.totalCost.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Suggested Price</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>${aiResult.suggestedPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Projected COGS</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{aiResult.projectedCOGS}%</div>
                                </div>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "12px 16px" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MAPPED INGREDIENTS FROM INVENTORY</div>
                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                                    {aiResult.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button className="btn-primary" onClick={saveAiRecipe}>Save to Menu</button>
                            <button className="btn-secondary" onClick={() => setAiResult(null)}>Discard</button>
                        </div>
                    </div>
                )}

                {isDemo ? (
                    <div className="grid-3">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="card">
                                <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                                    <span className="badge badge-purple">{recipe.type}</span>
                                    <span style={{ fontSize: 18 }}>⋮</span>
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
                                        {recipe.ingredients.map((ing, i) => (
                                            <li key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "6px 0", display: "flex", justifyContent: "space-between" }}>
                                                <span>{ing}</span>
                                                <span style={{ color: "#4ade80" }}>Linked ✓</span>
                                            </li>
                                        ))}
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
