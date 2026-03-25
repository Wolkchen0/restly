// AI Dynamic Menu Pricing Engine
// Analyzes ingredient costs, demand patterns, and market context to generate
// intelligent price recommendations for each menu item

import { FOOD_RECIPES, FOOD_INGREDIENTS, DEMO_FOOD_SALES, getFoodCost, type FoodRecipe, type FoodIngredient } from "./food-recipes";
import { DRINK_RECIPES, BOTTLE_INVENTORY, DEMO_DRINK_SALES, getPourCost, type DrinkRecipe, type BottleInfo } from "./drinks";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface PriceRecommendation {
    recipeId: string;
    recipeName: string;
    category: string;
    type: "food" | "drink";
    currentPrice: number;
    currentCost: number;
    currentMargin: number;
    targetMargin: number;
    suggestedPrice: number;
    priceChange: number;
    reason: "cost_increase" | "cost_decrease" | "high_demand" | "low_demand" | "overpriced" | "optimal";
    reasonText: string;
    reasonShort: string;
    dailySold: number;
    demandLevel: "hot" | "steady" | "cold";
    weeklyTrend: number[]; // 7 margin values for sparkline
    monthlyRevenueImpact: number;
    confidence: "high" | "medium" | "low";
}

export interface PricingStats {
    totalItems: number;
    avgMargin: number;
    underpricedCount: number;
    highDemandCount: number;
    monthlyRevenueImpact: number;
    optimalCount: number;
}

// ─── COST FLUCTUATION SIMULATOR (Demo Mode) ─────────────────────────────────
// Simulates realistic ingredient cost changes based on day-of-month patterns

const COST_MULTIPLIERS: Record<string, number> = {
    fi_salmon: 1.28,       // Salmon up 28% this period
    fi_shrimp: 1.15,       // Shrimp up 15%
    fi_duck: 1.10,         // Duck up 10%
    fi_avocado: 1.22,      // Avocado season spike
    fi_truffle_oil: 1.35,  // Truffle oil scarce
    fi_lobster_base: 1.18, // Lobster up
    fi_wagyu: 1.08,        // Wagyu slight increase
    fi_ribeye: 0.95,       // Ribeye slightly cheaper (good deal from supplier)
    fi_mushroom: 0.90,     // Mushroom in season — cheaper
    fi_tomato: 0.88,       // Tomato cheap in spring
};

// Day-of-week demand multipliers (Mon=0, Sun=6)
const DOW_DEMAND: number[] = [0.65, 0.70, 0.75, 0.80, 1.20, 1.40, 1.10];

// ─── PRICING ENGINE ──────────────────────────────────────────────────────────

function getSimulatedCost(recipe: FoodRecipe, ingredients: FoodIngredient[]): number {
    let cost = 0;
    for (const ing of recipe.ingredients) {
        const inv = ingredients.find(i => i.inventoryId === ing.inventoryId);
        if (!inv) continue;
        const multiplier = COST_MULTIPLIERS[ing.inventoryId] || 1.0;
        const unitCost = inv.costPerUnit * multiplier;
        // Simple normalization
        let amount = ing.amount;
        if (ing.unit === "oz" && inv.unit === "lbs") amount /= 16;
        else if (ing.unit === "oz" && inv.unit === "quarts") amount /= 32;
        else if (ing.unit === "oz" && inv.unit === "bottles") amount /= 25.4;
        else if (ing.unit === "oz" && inv.unit === "gallons") amount /= 128;
        cost += amount * unitCost;
    }
    return Math.round(cost * 100) / 100;
}

function getDemandLevel(dailySold: number): "hot" | "steady" | "cold" {
    if (dailySold >= 18) return "hot";
    if (dailySold >= 10) return "steady";
    return "cold";
}

function generateWeeklyTrend(baseMargin: number, reason: string): number[] {
    // Generate 7 margin values showing a trend
    const noise = () => (Math.random() - 0.5) * 4;
    const trend = reason === "cost_increase" ? -1.5 : reason === "cost_decrease" ? 1.2 : 0;
    return Array.from({ length: 7 }, (_, i) => {
        const val = baseMargin + trend * (i - 3) + noise();
        return Math.round(Math.max(0, Math.min(100, val)) * 10) / 10;
    });
}

export function generateFoodRecommendations(): PriceRecommendation[] {
    const TARGET_MARGIN = 70; // Industry standard: 70% food margin target
    const results: PriceRecommendation[] = [];

    for (const recipe of FOOD_RECIPES) {
        const baseCost = getFoodCost(recipe, FOOD_INGREDIENTS);
        const simulatedCost = getSimulatedCost(recipe, FOOD_INGREDIENTS);
        const costChange = simulatedCost / baseCost;
        const currentMargin = recipe.menuPrice > 0
            ? Math.round(((recipe.menuPrice - simulatedCost) / recipe.menuPrice) * 100)
            : 0;

        const sale = DEMO_FOOD_SALES.find(s => s.recipeId === recipe.id);
        const dailySold = sale?.sold || 0;
        const demandLevel = getDemandLevel(dailySold);
        const dow = new Date().getDay();
        const dowMultiplier = DOW_DEMAND[dow === 0 ? 6 : dow - 1];

        // Calculate suggested price
        let suggestedPrice = recipe.menuPrice;
        let reason: PriceRecommendation["reason"] = "optimal";
        let reasonText = "";
        let reasonShort = "";
        let confidence: PriceRecommendation["confidence"] = "medium";

        // Rule 1: Cost increase → raise price to maintain target margin
        if (costChange > 1.10 && currentMargin < TARGET_MARGIN) {
            const targetPrice = Math.ceil(simulatedCost / (1 - TARGET_MARGIN / 100));
            suggestedPrice = Math.min(targetPrice, recipe.menuPrice * 1.20); // Cap at 20%
            suggestedPrice = Math.ceil(suggestedPrice); // Round up to whole dollar
            reason = "cost_increase";
            const pctUp = Math.round((costChange - 1) * 100);
            reasonText = `Ingredient costs up ${pctUp}% this period. Current margin ${currentMargin}% is below ${TARGET_MARGIN}% target. Raise price to maintain profitability.`;
            reasonShort = `Cost ↑${pctUp}%`;
            confidence = "high";
        }
        // Rule 2: Cost decrease → option to lower price for volume
        else if (costChange < 0.92 && currentMargin > TARGET_MARGIN + 10) {
            suggestedPrice = Math.floor(recipe.menuPrice * 0.95); // Suggest 5% lower
            reason = "cost_decrease";
            const pctDown = Math.round((1 - costChange) * 100);
            reasonText = `Ingredient costs down ${pctDown}%. With ${currentMargin}% margin, a small price cut could boost volume without hurting profit.`;
            reasonShort = `Cost ↓${pctDown}%`;
            confidence = "medium";
        }
        // Rule 3: High demand + good margin → can increase
        else if (demandLevel === "hot" && currentMargin > TARGET_MARGIN - 5) {
            const boost = dailySold >= 25 ? 3 : 2;
            suggestedPrice = recipe.menuPrice + boost;
            reason = "high_demand";
            reasonText = `Selling ${dailySold}/day (top performer). ${currentMargin}% margin is healthy. Market can absorb a $${boost} increase without demand drop.`;
            reasonShort = `High Demand`;
            confidence = "high";
        }
        // Rule 4: Low demand → try promotional price
        else if (demandLevel === "cold" && dailySold > 0) {
            suggestedPrice = Math.max(Math.ceil(simulatedCost * 1.5), recipe.menuPrice - Math.ceil(recipe.menuPrice * 0.12));
            reason = "low_demand";
            reasonText = `Only ${dailySold}/day. Try a promotional price to boost volume. Train servers to upsell this item.`;
            reasonShort = `Low Sales`;
            confidence = "medium";
        }
        // Rule 5: Margin critically low
        else if (currentMargin < 35) {
            suggestedPrice = Math.ceil(simulatedCost / 0.30); // Get to 70% margin
            suggestedPrice = Math.min(suggestedPrice, recipe.menuPrice * 1.20);
            reason = "cost_increase";
            reasonText = `Margin at critical ${currentMargin}%. Immediate price adjustment recommended to avoid selling at near-cost.`;
            reasonShort = `Low Margin`;
            confidence = "high";
        }
        // Rule 6: Overpriced — very high margin + low demand
        else if (currentMargin > 85 && demandLevel === "cold") {
            suggestedPrice = Math.floor(recipe.menuPrice * 0.90);
            reason = "overpriced";
            reasonText = `${currentMargin}% margin but only ${dailySold}/day. Price may be deterring customers. A small reduction could increase traffic.`;
            reasonShort = `Overpriced`;
            confidence = "low";
        }
        // Optimal
        else {
            reason = "optimal";
            reasonText = `Price is well-balanced. ${currentMargin}% margin with ${dailySold} sales/day. No change needed.`;
            reasonShort = `Optimal ✓`;
            confidence = "high";
        }

        const priceChange = suggestedPrice - recipe.menuPrice;
        const monthlyImpact = priceChange * dailySold * 30 * dowMultiplier;

        results.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            category: recipe.category,
            type: "food",
            currentPrice: recipe.menuPrice,
            currentCost: simulatedCost,
            currentMargin,
            targetMargin: TARGET_MARGIN,
            suggestedPrice,
            priceChange: Math.round(priceChange * 100) / 100,
            reason,
            reasonText,
            reasonShort,
            dailySold,
            demandLevel,
            weeklyTrend: generateWeeklyTrend(currentMargin, reason),
            monthlyRevenueImpact: Math.round(monthlyImpact),
            confidence,
        });
    }

    // Sort: critical items first (cost_increase, low margin), then by revenue impact
    return results.sort((a, b) => {
        const priority: Record<string, number> = { cost_increase: 0, low_demand: 1, overpriced: 2, high_demand: 3, cost_decrease: 4, optimal: 5 };
        const pa = priority[a.reason] ?? 5;
        const pb = priority[b.reason] ?? 5;
        if (pa !== pb) return pa - pb;
        return Math.abs(b.priceChange) - Math.abs(a.priceChange);
    });
}

export function generateDrinkRecommendations(): PriceRecommendation[] {
    const TARGET_MARGIN = 80;
    const results: PriceRecommendation[] = [];

    for (const recipe of DRINK_RECIPES) {
        let pourCost = 0;
        for (const ing of recipe.ingredients) {
            const bot = BOTTLE_INVENTORY.find(b => b.spiritId === ing.spiritId);
            if (bot) pourCost += (ing.amountMl / bot.sizeMl) * bot.costPerBottle;
        }
        pourCost = Math.round(pourCost * 100) / 100;

        const currentMargin = recipe.menuPrice > 0
            ? Math.round(((recipe.menuPrice - pourCost) / recipe.menuPrice) * 100) : 0;

        const sale = DEMO_DRINK_SALES.find(s => s.recipeId === recipe.id);
        const dailySold = sale?.sold || 0;
        const demandLevel = getDemandLevel(dailySold);

        let suggestedPrice = recipe.menuPrice;
        let reason: PriceRecommendation["reason"] = "optimal";
        let reasonText = `Drink margin at ${currentMargin}% with ${dailySold} sold/day. Well priced.`;
        let reasonShort = "Optimal ✓";
        let confidence: PriceRecommendation["confidence"] = "high";

        if (currentMargin < TARGET_MARGIN - 10 && dailySold > 0) {
            suggestedPrice = Math.ceil(pourCost / (1 - TARGET_MARGIN / 100));
            reason = "cost_increase";
            reasonText = `Pour cost margin at ${currentMargin}%, below ${TARGET_MARGIN}% target. Adjust price.`;
            reasonShort = `Low Margin`;
            confidence = "high";
        } else if (demandLevel === "hot" && currentMargin > TARGET_MARGIN) {
            suggestedPrice = recipe.menuPrice + 2;
            reason = "high_demand";
            reasonText = `Top seller at ${dailySold}/day. Can sustain a $2 increase.`;
            reasonShort = `High Demand`;
            confidence = "medium";
        }

        const priceChange = suggestedPrice - recipe.menuPrice;
        results.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            category: recipe.category || "Cocktail",
            type: "drink",
            currentPrice: recipe.menuPrice,
            currentCost: pourCost,
            currentMargin,
            targetMargin: TARGET_MARGIN,
            suggestedPrice,
            priceChange: Math.round(priceChange * 100) / 100,
            reason,
            reasonText,
            reasonShort,
            dailySold,
            demandLevel,
            weeklyTrend: generateWeeklyTrend(currentMargin, reason),
            monthlyRevenueImpact: Math.round(priceChange * dailySold * 30),
            confidence,
        });
    }

    return results.sort((a, b) => {
        const priority: Record<string, number> = { cost_increase: 0, high_demand: 1, optimal: 5 };
        return (priority[a.reason] ?? 5) - (priority[b.reason] ?? 5);
    });
}

export function getAllRecommendations(): PriceRecommendation[] {
    return [...generateFoodRecommendations(), ...generateDrinkRecommendations()];
}

export function getPricingStats(): PricingStats {
    const all = getAllRecommendations();
    const margins = all.map(r => r.currentMargin);
    const avgMargin = margins.length > 0 ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0;
    const underpriced = all.filter(r => r.reason === "cost_increase" || r.currentMargin < 40);
    const highDemand = all.filter(r => r.demandLevel === "hot");
    const optimal = all.filter(r => r.reason === "optimal");
    const impact = all.filter(r => r.priceChange > 0).reduce((a, r) => a + r.monthlyRevenueImpact, 0);

    return {
        totalItems: all.length,
        avgMargin,
        underpricedCount: underpriced.length,
        highDemandCount: highDemand.length,
        monthlyRevenueImpact: impact,
        optimalCount: optimal.length,
    };
}

export function getTopInsights(): { type: "critical" | "opportunity" | "info"; text: string }[] {
    const recs = getAllRecommendations();
    const insights: { type: "critical" | "opportunity" | "info"; text: string }[] = [];

    // Critical: items with margin below 40%
    const critical = recs.filter(r => r.currentMargin < 40 && r.dailySold > 0);
    if (critical.length > 0) {
        const item = critical[0];
        const costPct = Math.round((1 - item.currentCost / item.currentPrice) * 100);
        insights.push({
            type: "critical",
            text: `${item.recipeName} margin is only ${item.currentMargin}% (target: ${item.targetMargin}%). Ingredient cost at $${item.currentCost.toFixed(2)} — raise price from $${item.currentPrice} to $${item.suggestedPrice} to recover $${Math.abs(item.monthlyRevenueImpact).toLocaleString()}/mo.`,
        });
    }

    // Opportunity: high demand items that can be priced higher
    const opportunity = recs.filter(r => r.reason === "high_demand");
    if (opportunity.length > 0) {
        const topItems = opportunity.slice(0, 2).map(r => r.recipeName).join(" and ");
        const totalImpact = opportunity.reduce((a, r) => a + r.monthlyRevenueImpact, 0);
        insights.push({
            type: "opportunity",
            text: `${topItems} are top sellers with healthy margins. A small price increase could add +$${totalImpact.toLocaleString()}/mo without reducing demand.`,
        });
    }

    // Info: cost savings
    const savings = recs.filter(r => r.reason === "cost_decrease");
    if (savings.length > 0) {
        const item = savings[0];
        insights.push({
            type: "info",
            text: `${item.recipeName} ingredient costs dropped. Current margin is ${item.currentMargin}%. You could lower the price to attract more customers or keep the extra profit.`,
        });
    }

    // Fallback if fewer than 3 insights
    if (insights.length < 3) {
        const optimal = recs.filter(r => r.reason === "optimal");
        insights.push({
            type: "info",
            text: `${optimal.length} of ${recs.length} menu items are optimally priced. Your overall average margin is ${getPricingStats().avgMargin}%.`,
        });
    }

    return insights.slice(0, 3);
}
