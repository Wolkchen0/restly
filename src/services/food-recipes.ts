// Food Recipe & Ingredient Tracking System
// Maps menu dishes to their ingredients with exact US measurements
// Tracks ingredient usage based on daily POS sales and auto-deducts from inventory

export interface FoodRecipe {
    id: string;
    name: string;
    category: "Main" | "Appetizer" | "Side" | "Dessert" | "Breakfast" | "Bread" | "Soup";
    menuPrice: number;
    ingredients: { inventoryId: string; name: string; amount: number; unit: string }[];
}

export interface FoodIngredient {
    inventoryId: string;
    name: string;
    onHand: number;
    unit: string;
    costPerUnit: number;
    supplier: string;
    source: "pos" | "manual";
}

// ─── FOOD INGREDIENT INVENTORY (US Units: lbs, oz, portions, pieces, quarts, gallons) ──
export const FOOD_INGREDIENTS: FoodIngredient[] = [
    // Proteins
    { inventoryId: "fi_beef_patty", name: "Ground Beef (80/20)", onHand: 45, unit: "lbs", costPerUnit: 5.5, supplier: "US Foods", source: "pos" },
    { inventoryId: "fi_wagyu", name: "Wagyu Beef Tenderloin", onHand: 24, unit: "lbs", costPerUnit: 45, supplier: "US Foods", source: "pos" },
    { inventoryId: "fi_ribeye", name: "Prime Ribeye 16oz", onHand: 20, unit: "portions", costPerUnit: 38, supplier: "US Foods", source: "pos" },
    { inventoryId: "fi_salmon", name: "Atlantic Salmon Fillet", onHand: 18, unit: "portions", costPerUnit: 18, supplier: "Sysco", source: "pos" },
    { inventoryId: "fi_duck", name: "Duck Breast", onHand: 6, unit: "portions", costPerUnit: 22, supplier: "Sysco", source: "pos" },
    { inventoryId: "fi_chicken", name: "Chicken Breast (Organic)", onHand: 30, unit: "lbs", costPerUnit: 6, supplier: "US Foods", source: "pos" },
    { inventoryId: "fi_shrimp", name: "Jumbo Shrimp (16/20)", onHand: 12, unit: "lbs", costPerUnit: 14, supplier: "Sysco", source: "pos" },
    // Bread & Bakery
    { inventoryId: "fi_brioche_bun", name: "Brioche Buns", onHand: 48, unit: "pieces", costPerUnit: 0.85, supplier: "Local Bakery", source: "manual" },
    { inventoryId: "fi_sourdough", name: "Sourdough Bread (Artisan)", onHand: 20, unit: "loaves", costPerUnit: 6, supplier: "Local Bakery", source: "manual" },
    { inventoryId: "fi_flour", name: "All-Purpose Flour", onHand: 50, unit: "lbs", costPerUnit: 0.65, supplier: "Restaurant Depot", source: "pos" },
    { inventoryId: "fi_focaccia", name: "Focaccia Bread", onHand: 15, unit: "pieces", costPerUnit: 2.5, supplier: "Local Bakery", source: "manual" },
    // Dairy
    { inventoryId: "fi_cheddar", name: "Aged Cheddar Slices", onHand: 120, unit: "slices", costPerUnit: 0.35, supplier: "Dairy Farm Co", source: "pos" },
    { inventoryId: "fi_burrata", name: "Burrata (Fresh)", onHand: 12, unit: "pieces", costPerUnit: 9, supplier: "Dairy Farm Co", source: "pos" },
    { inventoryId: "fi_cream", name: "Heavy Cream", onHand: 10, unit: "quarts", costPerUnit: 5, supplier: "Dairy Farm Co", source: "pos" },
    { inventoryId: "fi_parmesan", name: "Parmesan Reggiano", onHand: 6, unit: "lbs", costPerUnit: 18, supplier: "Euro Foods", source: "pos" },
    { inventoryId: "fi_butter", name: "European Butter", onHand: 15, unit: "lbs", costPerUnit: 7, supplier: "Dairy Farm Co", source: "pos" },
    // Produce
    { inventoryId: "fi_avocado", name: "Hass Avocado", onHand: 36, unit: "pieces", costPerUnit: 1.5, supplier: "Farm Fresh", source: "pos" },
    { inventoryId: "fi_truffle_mayo", name: "Truffle Mayo (House)", onHand: 4, unit: "quarts", costPerUnit: 12, supplier: "House", source: "manual" },
    { inventoryId: "fi_tomato", name: "Heirloom Tomatoes", onHand: 15, unit: "lbs", costPerUnit: 4, supplier: "Farm Fresh", source: "pos" },
    { inventoryId: "fi_mushroom", name: "Wild Mushroom Mix", onHand: 8, unit: "lbs", costPerUnit: 14, supplier: "Farm Fresh", source: "pos" },
    { inventoryId: "fi_arugula", name: "Baby Arugula", onHand: 6, unit: "lbs", costPerUnit: 8, supplier: "Farm Fresh", source: "pos" },
    { inventoryId: "fi_potato", name: "Yukon Gold Potatoes", onHand: 40, unit: "lbs", costPerUnit: 1.2, supplier: "Farm Fresh", source: "pos" },
    // Dry Goods & Specialty
    { inventoryId: "fi_rice", name: "Arborio Rice", onHand: 30, unit: "lbs", costPerUnit: 2.5, supplier: "Restaurant Depot", source: "pos" },
    { inventoryId: "fi_pasta", name: "Fresh Pasta (House)", onHand: 20, unit: "lbs", costPerUnit: 4, supplier: "House", source: "manual" },
    { inventoryId: "fi_olive_oil", name: "Extra Virgin Olive Oil", onHand: 8, unit: "bottles", costPerUnit: 22, supplier: "Farm Fresh", source: "manual" },
    { inventoryId: "fi_truffle_oil", name: "Truffle Oil (Premium)", onHand: 3, unit: "bottles", costPerUnit: 65, supplier: "Euro Foods", source: "pos" },
    { inventoryId: "fi_saffron", name: "Saffron", onHand: 0.3, unit: "oz", costPerUnit: 220, supplier: "Euro Foods", source: "pos" },
    // Desserts
    { inventoryId: "fi_chocolate", name: "Valrhona Dark Chocolate", onHand: 8, unit: "lbs", costPerUnit: 16, supplier: "Specialty Foods", source: "pos" },
    { inventoryId: "fi_vanilla", name: "Madagascar Vanilla Extract", onHand: 3, unit: "bottles", costPerUnit: 28, supplier: "Specialty Foods", source: "pos" },
    { inventoryId: "fi_sugar", name: "Granulated Sugar", onHand: 25, unit: "lbs", costPerUnit: 0.5, supplier: "Restaurant Depot", source: "pos" },
    { inventoryId: "fi_eggs", name: "Eggs (Organic, Large)", onHand: 180, unit: "pieces", costPerUnit: 0.45, supplier: "Dairy Farm Co", source: "pos" },
    // Soups
    { inventoryId: "fi_lobster_base", name: "Lobster Stock", onHand: 3, unit: "gallons", costPerUnit: 18, supplier: "Sysco", source: "pos" },
];

// ─── FOOD RECIPES (US measurements) ─────────────────────────────────────────
export const FOOD_RECIPES: FoodRecipe[] = [
    {
        id: "fr_truffle_burger", name: "Truffle Burger", category: "Main", menuPrice: 24,
        ingredients: [
            { inventoryId: "fi_beef_patty", name: "Ground Beef", amount: 0.5, unit: "lbs" },
            { inventoryId: "fi_brioche_bun", name: "Brioche Bun", amount: 1, unit: "piece" },
            { inventoryId: "fi_truffle_mayo", name: "Truffle Mayo", amount: 1, unit: "oz" },
            { inventoryId: "fi_cheddar", name: "Cheddar", amount: 1, unit: "slice" },
            { inventoryId: "fi_arugula", name: "Arugula", amount: 0.5, unit: "oz" },
        ]
    },
    {
        id: "fr_ribeye", name: "Prime Ribeye 16oz", category: "Main", menuPrice: 62,
        ingredients: [
            { inventoryId: "fi_ribeye", name: "Ribeye Steak", amount: 1, unit: "portion" },
            { inventoryId: "fi_butter", name: "Herb Butter", amount: 1, unit: "oz" },
            { inventoryId: "fi_potato", name: "Roasted Potatoes", amount: 0.5, unit: "lbs" },
            { inventoryId: "fi_arugula", name: "Arugula Salad", amount: 1, unit: "oz" },
        ]
    },
    {
        id: "fr_salmon", name: "Pan-Seared Salmon", category: "Main", menuPrice: 38,
        ingredients: [
            { inventoryId: "fi_salmon", name: "Salmon Fillet", amount: 1, unit: "portion" },
            { inventoryId: "fi_rice", name: "Arborio Rice", amount: 0.25, unit: "lbs" },
            { inventoryId: "fi_butter", name: "Lemon Butter", amount: 0.5, unit: "oz" },
            { inventoryId: "fi_arugula", name: "Greens", amount: 1, unit: "oz" },
        ]
    },
    {
        id: "fr_duck", name: "Pan-Seared Duck Breast", category: "Main", menuPrice: 45,
        ingredients: [
            { inventoryId: "fi_duck", name: "Duck Breast", amount: 1, unit: "portion" },
            { inventoryId: "fi_mushroom", name: "Mushroom Ragout", amount: 3, unit: "oz" },
            { inventoryId: "fi_potato", name: "Potato Puree", amount: 0.3, unit: "lbs" },
        ]
    },
    {
        id: "fr_risotto", name: "Truffle Mushroom Risotto", category: "Main", menuPrice: 32,
        ingredients: [
            { inventoryId: "fi_rice", name: "Arborio Rice", amount: 0.3, unit: "lbs" },
            { inventoryId: "fi_mushroom", name: "Wild Mushrooms", amount: 3, unit: "oz" },
            { inventoryId: "fi_parmesan", name: "Parmesan", amount: 1.5, unit: "oz" },
            { inventoryId: "fi_truffle_oil", name: "Truffle Oil", amount: 0.25, unit: "oz" },
            { inventoryId: "fi_butter", name: "Butter", amount: 1, unit: "oz" },
            { inventoryId: "fi_cream", name: "Heavy Cream", amount: 2, unit: "oz" },
        ]
    },
    {
        id: "fr_avocado_toast", name: "Avocado Toast", category: "Breakfast", menuPrice: 16,
        ingredients: [
            { inventoryId: "fi_sourdough", name: "Sourdough", amount: 0.25, unit: "loaf" },
            { inventoryId: "fi_avocado", name: "Hass Avocado", amount: 1, unit: "piece" },
            { inventoryId: "fi_olive_oil", name: "Olive Oil", amount: 0.25, unit: "oz" },
            { inventoryId: "fi_eggs", name: "Poached Eggs", amount: 2, unit: "pieces" },
        ]
    },
    {
        id: "fr_shrimp_pasta", name: "Shrimp Scampi Pasta", category: "Main", menuPrice: 34,
        ingredients: [
            { inventoryId: "fi_shrimp", name: "Jumbo Shrimp", amount: 0.35, unit: "lbs" },
            { inventoryId: "fi_pasta", name: "Fresh Pasta", amount: 0.35, unit: "lbs" },
            { inventoryId: "fi_butter", name: "Garlic Butter", amount: 1.5, unit: "oz" },
            { inventoryId: "fi_olive_oil", name: "Olive Oil", amount: 0.5, unit: "oz" },
        ]
    },
    {
        id: "fr_lobster_bisque", name: "Lobster Bisque", category: "Soup", menuPrice: 18,
        ingredients: [
            { inventoryId: "fi_lobster_base", name: "Lobster Stock", amount: 8, unit: "oz" },
            { inventoryId: "fi_cream", name: "Heavy Cream", amount: 3, unit: "oz" },
            { inventoryId: "fi_butter", name: "Butter", amount: 0.5, unit: "oz" },
        ]
    },
    {
        id: "fr_burrata_salad", name: "Burrata & Heirloom Tomato", category: "Appetizer", menuPrice: 22,
        ingredients: [
            { inventoryId: "fi_burrata", name: "Burrata", amount: 1, unit: "piece" },
            { inventoryId: "fi_tomato", name: "Heirloom Tomatoes", amount: 0.5, unit: "lbs" },
            { inventoryId: "fi_olive_oil", name: "Olive Oil", amount: 0.5, unit: "oz" },
            { inventoryId: "fi_arugula", name: "Arugula", amount: 0.5, unit: "oz" },
        ]
    },
    {
        id: "fr_chocolate_cake", name: "Chocolate Lava Cake", category: "Dessert", menuPrice: 16,
        ingredients: [
            { inventoryId: "fi_chocolate", name: "Dark Chocolate", amount: 3, unit: "oz" },
            { inventoryId: "fi_butter", name: "Butter", amount: 2, unit: "oz" },
            { inventoryId: "fi_eggs", name: "Eggs", amount: 2, unit: "pieces" },
            { inventoryId: "fi_sugar", name: "Sugar", amount: 1.5, unit: "oz" },
            { inventoryId: "fi_flour", name: "Flour", amount: 1, unit: "oz" },
        ]
    },
    {
        id: "fr_artisan_bread", name: "Artisan Sourdough (Baked)", category: "Bread", menuPrice: 8,
        ingredients: [
            { inventoryId: "fi_flour", name: "All-Purpose Flour", amount: 12, unit: "oz" },
            { inventoryId: "fi_butter", name: "Butter", amount: 0.5, unit: "oz" },
            { inventoryId: "fi_olive_oil", name: "Olive Oil", amount: 0.25, unit: "oz" },
        ]
    },
    {
        id: "fr_truffle_fries", name: "Truffle Parmesan Fries", category: "Side", menuPrice: 14,
        ingredients: [
            { inventoryId: "fi_potato", name: "Yukon Potatoes", amount: 0.75, unit: "lbs" },
            { inventoryId: "fi_truffle_oil", name: "Truffle Oil", amount: 0.15, unit: "oz" },
            { inventoryId: "fi_parmesan", name: "Parmesan", amount: 1, unit: "oz" },
        ]
    },
];

// ─── DEMO DAILY FOOD SALES (from POS) ────────────────────────────────────────
export const DEMO_FOOD_SALES = [
    { recipeId: "fr_truffle_burger", sold: 22 },
    { recipeId: "fr_ribeye", sold: 14 },
    { recipeId: "fr_salmon", sold: 16 },
    { recipeId: "fr_duck", sold: 6 },
    { recipeId: "fr_risotto", sold: 10 },
    { recipeId: "fr_avocado_toast", sold: 18 },
    { recipeId: "fr_shrimp_pasta", sold: 8 },
    { recipeId: "fr_lobster_bisque", sold: 12 },
    { recipeId: "fr_burrata_salad", sold: 9 },
    { recipeId: "fr_chocolate_cake", sold: 15 },
    { recipeId: "fr_artisan_bread", sold: 30 },
    { recipeId: "fr_truffle_fries", sold: 25 },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/** Get food cost per dish */
export function getFoodCost(recipe: FoodRecipe, ingredients: FoodIngredient[]): number {
    let cost = 0;
    for (const ing of recipe.ingredients) {
        const inv = ingredients.find(i => i.inventoryId === ing.inventoryId);
        if (!inv) continue;
        // Normalize: convert recipe amount to inventory units
        const ratio = normalizeToInventoryUnit(ing.amount, ing.unit, inv.unit);
        cost += ratio * inv.costPerUnit;
    }
    return Math.round(cost * 100) / 100;
}

/** Get how many servings can be made from current stock */
export function getFoodServingsRemaining(recipe: FoodRecipe, ingredients: FoodIngredient[]): number {
    let min = Infinity;
    for (const ing of recipe.ingredients) {
        const inv = ingredients.find(i => i.inventoryId === ing.inventoryId);
        if (!inv) return 0;
        const ratio = normalizeToInventoryUnit(ing.amount, ing.unit, inv.unit);
        if (ratio <= 0) continue;
        const servings = Math.floor(inv.onHand / ratio);
        min = Math.min(min, servings);
    }
    return min === Infinity ? 0 : min;
}

/** Get which recipes use a specific ingredient */
export function getRecipesUsing(inventoryId: string): FoodRecipe[] {
    return FOOD_RECIPES.filter(r => r.ingredients.some(i => i.inventoryId === inventoryId));
}

/** Normalize recipe amount to match inventory unit. All in US units */
function normalizeToInventoryUnit(amount: number, fromUnit: string, toUnit: string): number {
    // Same unit
    if (fromUnit === toUnit || fromUnit + "s" === toUnit || fromUnit === toUnit + "s") return amount;

    // oz to lbs
    if (fromUnit === "oz" && toUnit === "lbs") return amount / 16;
    // oz to quarts (fluid)
    if (fromUnit === "oz" && toUnit === "quarts") return amount / 32;
    // oz to bottles (assume 25.4 oz/750ml bottle)
    if (fromUnit === "oz" && toUnit === "bottles") return amount / 25.4;
    // oz to gallons
    if (fromUnit === "oz" && toUnit === "gallons") return amount / 128;
    // lbs to lbs
    if (fromUnit === "lbs" && toUnit === "lbs") return amount;
    // piece/portion mapping
    if ((fromUnit === "piece" || fromUnit === "portion") && (toUnit === "pieces" || toUnit === "portions")) return amount;
    if ((fromUnit === "pieces" || fromUnit === "portions") && (toUnit === "pieces" || toUnit === "portions" || toUnit === "piece" || toUnit === "portion")) return amount;
    // slice to slices
    if (fromUnit === "slice" && toUnit === "slices") return amount;
    // loaf to loaves
    if (fromUnit === "loaf" && toUnit === "loaves") return amount;

    // Fallback: assume same unit
    return amount;
}
