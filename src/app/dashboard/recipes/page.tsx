"use client";
import { useState, useEffect } from "react";

const RECIPES = [
    { id: 1, name: "Truffle Burger", cost: 3.45, price: 16.00, cogs: 21.5, type: "Main", ingredients: ["150g Beef Patty", "1x Brioche Bun", "15g Truffle Mayo", "1x Cheddar Slice"] },
    { id: 2, name: "Avocado Toast", cost: 1.80, price: 12.00, cogs: 15.0, type: "Breakfast", ingredients: ["2x Sourdough Slices", "1/2 Hass Avocado", "Chili Flakes", "Olive Oil"] },
    { id: 3, name: "Spicy Marg", cost: 1.10, price: 14.00, cogs: 7.8, type: "Drink", ingredients: ["2oz Tequila", "1oz Lime Juice", "0.5oz Agave", "Jalapeno Slices"] },
];

export default function RecipesPage() {
    const [uploading, setUploading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(true);

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
        setUploading(true);
        // Simulate AI analyzing a hand-written recipe card 
        setTimeout(() => {
            setUploading(false);
            setAiResult({
                name: "AI Generated: Lobster Roll",
                ingredients: ["100g Lobster Meat ($5.00)", "1x Split Top Bun ($0.40)", "10g Lemon Butter ($0.15)", "Mayo ($0.05)"],
                totalCost: 5.60,
                suggestedPrice: 24.00,
                projectedCOGS: 23.3
            });
        }, 2000);
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🍽️ Chef & Recipe Management</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handlePhotoUpload} disabled={uploading}>
                        {uploading ? "Analyzing Recipe..." : "📸 AI Photo Import"}
                    </button>
                    <button className="btn-secondary">New Recipe +</button>
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
                            <button className="btn-primary">Save to Menu</button>
                            <button className="btn-secondary" onClick={() => setAiResult(null)}>Discard</button>
                        </div>
                    </div>
                )}

                {isDemo ? (
                    <div className="grid-3">
                        {RECIPES.map(recipe => (
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
