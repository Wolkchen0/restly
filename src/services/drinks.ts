// Drink Recipe & Bottle Tracking System
// Maps cocktails to their ingredients with exact pour amounts
// Tracks bottles (full + open) and calculates remaining pours

export interface DrinkRecipe {
    id: string;
    name: string;
    category: "Cocktail" | "Wine" | "Beer" | "Shot" | "Non-Alcoholic";
    menuPrice: number;
    ingredients: { spiritId: string; amountMl: number }[];
}

export interface BottleInfo {
    spiritId: string;
    name: string;
    sizeMl: number;
    fullBottles: number;
    openBottleMl: number; // remaining ml in the currently open bottle
    costPerBottle: number;
    supplier: string;
    category: "Vodka" | "Tequila" | "Gin" | "Bourbon" | "Rum" | "Whiskey" | "Wine" | "Champagne" | "Aperitif" | "Liqueur" | "Beer" | "Other";
}

// ─── BOTTLE INVENTORY ───────────────────────────────────────────────────────
export const BOTTLE_INVENTORY: BottleInfo[] = [
    // Vodka
    { spiritId: "sp_titos", name: "Tito's Handmade Vodka", sizeMl: 750, fullBottles: 4, openBottleMl: 320, costPerBottle: 22, supplier: "Southern Glazer's", category: "Vodka" },
    { spiritId: "sp_greygoose", name: "Grey Goose", sizeMl: 750, fullBottles: 5, openBottleMl: 580, costPerBottle: 32, supplier: "Southern Glazer's", category: "Vodka" },
    { spiritId: "sp_belvedere", name: "Belvedere", sizeMl: 750, fullBottles: 2, openBottleMl: 0, costPerBottle: 35, supplier: "Southern Glazer's", category: "Vodka" },
    // Tequila
    { spiritId: "sp_casamigos_rep", name: "Casamigos Reposado", sizeMl: 750, fullBottles: 1, openBottleMl: 450, costPerBottle: 45, supplier: "Southern Glazer's", category: "Tequila" },
    { spiritId: "sp_casamigos_blanco", name: "Casamigos Blanco", sizeMl: 750, fullBottles: 3, openBottleMl: 200, costPerBottle: 42, supplier: "Southern Glazer's", category: "Tequila" },
    { spiritId: "sp_patron", name: "Patron Silver", sizeMl: 750, fullBottles: 2, openBottleMl: 600, costPerBottle: 48, supplier: "Southern Glazer's", category: "Tequila" },
    // Gin
    { spiritId: "sp_hendricks", name: "Hendrick's Gin", sizeMl: 750, fullBottles: 3, openBottleMl: 500, costPerBottle: 35, supplier: "Southern Glazer's", category: "Gin" },
    { spiritId: "sp_tanqueray", name: "Tanqueray", sizeMl: 750, fullBottles: 2, openBottleMl: 400, costPerBottle: 24, supplier: "Southern Glazer's", category: "Gin" },
    // Bourbon / Whiskey
    { spiritId: "sp_woodford", name: "Woodford Reserve", sizeMl: 750, fullBottles: 4, openBottleMl: 300, costPerBottle: 38, supplier: "Southern Glazer's", category: "Bourbon" },
    { spiritId: "sp_bulleit", name: "Bulleit Bourbon", sizeMl: 750, fullBottles: 3, openBottleMl: 650, costPerBottle: 28, supplier: "Southern Glazer's", category: "Bourbon" },
    { spiritId: "sp_makers", name: "Maker's Mark", sizeMl: 750, fullBottles: 2, openBottleMl: 100, costPerBottle: 30, supplier: "Southern Glazer's", category: "Bourbon" },
    // Rum
    { spiritId: "sp_bacardi", name: "Bacardi Superior", sizeMl: 750, fullBottles: 3, openBottleMl: 400, costPerBottle: 16, supplier: "Southern Glazer's", category: "Rum" },
    { spiritId: "sp_captain", name: "Captain Morgan Spiced", sizeMl: 750, fullBottles: 2, openBottleMl: 550, costPerBottle: 18, supplier: "Southern Glazer's", category: "Rum" },
    // Aperitif / Liqueur
    { spiritId: "sp_aperol", name: "Aperol", sizeMl: 750, fullBottles: 0, openBottleMl: 0, costPerBottle: 24, supplier: "Southern Glazer's", category: "Aperitif" },
    { spiritId: "sp_campari", name: "Campari", sizeMl: 750, fullBottles: 2, openBottleMl: 350, costPerBottle: 26, supplier: "Southern Glazer's", category: "Aperitif" },
    { spiritId: "sp_cointreau", name: "Cointreau", sizeMl: 700, fullBottles: 1, openBottleMl: 400, costPerBottle: 36, supplier: "Southern Glazer's", category: "Liqueur" },
    { spiritId: "sp_kahlua", name: "Kahlua", sizeMl: 750, fullBottles: 2, openBottleMl: 600, costPerBottle: 22, supplier: "Southern Glazer's", category: "Liqueur" },
    { spiritId: "sp_baileys", name: "Baileys Irish Cream", sizeMl: 750, fullBottles: 1, openBottleMl: 500, costPerBottle: 25, supplier: "Southern Glazer's", category: "Liqueur" },
    // Wine
    { spiritId: "sp_prosecco", name: "Prosecco La Marca", sizeMl: 750, fullBottles: 35, openBottleMl: 0, costPerBottle: 14, supplier: "Wine Direct", category: "Wine" },
    { spiritId: "sp_champagne", name: "Moët & Chandon", sizeMl: 750, fullBottles: 4, openBottleMl: 500, costPerBottle: 55, supplier: "Wine Direct", category: "Champagne" },
];

// ─── COCKTAIL RECIPES ────────────────────────────────────────────────────────
// amounts in ml per serving
export const DRINK_RECIPES: DrinkRecipe[] = [
    // Signature Cocktails
    {
        id: "ck_meyh_martini", name: "Meyh Martini", category: "Cocktail", menuPrice: 18,
        ingredients: [
            { spiritId: "sp_greygoose", amountMl: 60 },
            { spiritId: "sp_cointreau", amountMl: 15 },
        ]
    },
    {
        id: "ck_classic_margarita", name: "Classic Margarita", category: "Cocktail", menuPrice: 16,
        ingredients: [
            { spiritId: "sp_casamigos_blanco", amountMl: 60 },
            { spiritId: "sp_cointreau", amountMl: 30 },
        ]
    },
    {
        id: "ck_spicy_margarita", name: "Spicy Margarita", category: "Cocktail", menuPrice: 17,
        ingredients: [
            { spiritId: "sp_casamigos_rep", amountMl: 60 },
            { spiritId: "sp_cointreau", amountMl: 20 },
        ]
    },
    {
        id: "ck_old_fashioned", name: "Old Fashioned", category: "Cocktail", menuPrice: 17,
        ingredients: [
            { spiritId: "sp_woodford", amountMl: 75 },
        ]
    },
    {
        id: "ck_manhattan", name: "Manhattan", category: "Cocktail", menuPrice: 18,
        ingredients: [
            { spiritId: "sp_bulleit", amountMl: 60 },
            { spiritId: "sp_campari", amountMl: 15 },
        ]
    },
    {
        id: "ck_negroni", name: "Negroni", category: "Cocktail", menuPrice: 16,
        ingredients: [
            { spiritId: "sp_hendricks", amountMl: 30 },
            { spiritId: "sp_campari", amountMl: 30 },
        ]
    },
    {
        id: "ck_aperol_spritz", name: "Aperol Spritz", category: "Cocktail", menuPrice: 15,
        ingredients: [
            { spiritId: "sp_aperol", amountMl: 60 },
            { spiritId: "sp_prosecco", amountMl: 90 },
        ]
    },
    {
        id: "ck_espresso_martini", name: "Espresso Martini", category: "Cocktail", menuPrice: 18,
        ingredients: [
            { spiritId: "sp_titos", amountMl: 45 },
            { spiritId: "sp_kahlua", amountMl: 30 },
        ]
    },
    {
        id: "ck_gin_tonic", name: "Gin & Tonic", category: "Cocktail", menuPrice: 14,
        ingredients: [
            { spiritId: "sp_hendricks", amountMl: 60 },
        ]
    },
    {
        id: "ck_mojito", name: "Mojito", category: "Cocktail", menuPrice: 15,
        ingredients: [
            { spiritId: "sp_bacardi", amountMl: 60 },
        ]
    },
    {
        id: "ck_whiskey_sour", name: "Whiskey Sour", category: "Cocktail", menuPrice: 16,
        ingredients: [
            { spiritId: "sp_makers", amountMl: 60 },
        ]
    },
    // Shots
    {
        id: "ck_tequila_shot", name: "Tequila Shot", category: "Shot", menuPrice: 12,
        ingredients: [
            { spiritId: "sp_patron", amountMl: 45 },
        ]
    },
    {
        id: "ck_vodka_shot", name: "Vodka Shot", category: "Shot", menuPrice: 10,
        ingredients: [
            { spiritId: "sp_titos", amountMl: 45 },
        ]
    },
    // Wine by Glass
    {
        id: "ck_prosecco_glass", name: "Prosecco (Glass)", category: "Wine", menuPrice: 12,
        ingredients: [
            { spiritId: "sp_prosecco", amountMl: 150 },
        ]
    },
    {
        id: "ck_champagne_glass", name: "Champagne (Glass)", category: "Wine", menuPrice: 22,
        ingredients: [
            { spiritId: "sp_champagne", amountMl: 150 },
        ]
    },
];

// ─── DEMO DAILY SALES (Today's drink sales from POS) ────────────────────────
export const DEMO_DRINK_SALES = [
    { recipeId: "ck_meyh_martini", sold: 8 },
    { recipeId: "ck_classic_margarita", sold: 12 },
    { recipeId: "ck_spicy_margarita", sold: 6 },
    { recipeId: "ck_old_fashioned", sold: 10 },
    { recipeId: "ck_manhattan", sold: 4 },
    { recipeId: "ck_negroni", sold: 5 },
    { recipeId: "ck_aperol_spritz", sold: 0 }, // Aperol out of stock
    { recipeId: "ck_espresso_martini", sold: 14 },
    { recipeId: "ck_gin_tonic", sold: 7 },
    { recipeId: "ck_mojito", sold: 6 },
    { recipeId: "ck_whiskey_sour", sold: 3 },
    { recipeId: "ck_tequila_shot", sold: 8 },
    { recipeId: "ck_vodka_shot", sold: 5 },
    { recipeId: "ck_prosecco_glass", sold: 10 },
    { recipeId: "ck_champagne_glass", sold: 4 },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/** Get total ml remaining for a spirit (full bottles + open bottle) */
export function getTotalMlRemaining(bottle: BottleInfo): number {
    return (bottle.fullBottles * bottle.sizeMl) + bottle.openBottleMl;
}

/** Get how many servings of a specific drink can be made from current stock */
export function getServingsRemaining(recipe: DrinkRecipe, bottles: BottleInfo[]): number {
    let minServings = Infinity;
    for (const ing of recipe.ingredients) {
        const bottle = bottles.find(b => b.spiritId === ing.spiritId);
        if (!bottle) return 0;
        const totalMl = getTotalMlRemaining(bottle);
        const servings = Math.floor(totalMl / ing.amountMl);
        minServings = Math.min(minServings, servings);
    }
    return minServings === Infinity ? 0 : minServings;
}

/** Get pour cost for a cocktail */
export function getPourCost(recipe: DrinkRecipe, bottles: BottleInfo[]): number {
    let cost = 0;
    for (const ing of recipe.ingredients) {
        const bottle = bottles.find(b => b.spiritId === ing.spiritId);
        if (!bottle) continue;
        cost += (ing.amountMl / bottle.sizeMl) * bottle.costPerBottle;
    }
    return Math.round(cost * 100) / 100;
}

/** Format bottle remaining as "X bottles + Yml" */
export function formatBottleRemaining(bottle: BottleInfo): string {
    if (bottle.fullBottles === 0 && bottle.openBottleMl === 0) return "OUT OF STOCK";
    const parts: string[] = [];
    if (bottle.fullBottles > 0) parts.push(`${bottle.fullBottles} bottle${bottle.fullBottles > 1 ? "s" : ""}`);
    if (bottle.openBottleMl > 0) parts.push(`${bottle.openBottleMl}ml open`);
    return parts.join(" + ");
}

/** Get which cocktails use a specific spirit */
export function getCocktailsUsing(spiritId: string): DrinkRecipe[] {
    return DRINK_RECIPES.filter(r => r.ingredients.some(i => i.spiritId === spiritId));
}
