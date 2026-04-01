// ═══════════════════════════════════════════════════════════════════
// POS → Restly Category Mapping Agent
// Maps POS menu group names (e.g. "Entrees", "Starters") to
// Restly's internal categories: Main, Appetizer, Side, Dessert, Bread, Soup, Drinks
// Uses fuzzy keyword matching — works across all POS providers.
// ═══════════════════════════════════════════════════════════════════

export type RestlyCategory = "Main" | "Appetizer" | "Side" | "Dessert" | "Bread" | "Soup" | "Drinks";

// ── Keyword dictionary: POS names → Restly categories ────────────
// Each keyword list covers common naming patterns across Toast, Square, Clover, etc.
const CATEGORY_KEYWORDS: { category: RestlyCategory; keywords: string[] }[] = [
    {
        category: "Main",
        keywords: [
            "main", "mains", "entree", "entrees", "entrée", "entrées",
            "dinner", "lunch", "platter", "platters",
            "grill", "grilled", "roast", "roasted",
            "steak", "steaks", "seafood", "fish", "chicken", "meat",
            "pasta", "pizza", "burger", "burgers", "sandwich", "sandwiches",
            "wrap", "wraps", "bowl", "bowls", "tacos", "taco",
            "specialty", "specialties", "signature", "house specials",
            "ana yemek", "ana", "et", "tavuk", "kebap", "pide", "lahmacun",
            "hauptgericht", "hauptgerichte",
        ],
    },
    {
        category: "Appetizer",
        keywords: [
            "appetizer", "appetizers", "appetiser", "appetisers",
            "starter", "starters", "small plate", "small plates",
            "shareables", "shareable", "shared",
            "mezze", "meze", "tapas", "antipasti", "antipasto",
            "to start", "first course", "primi",
            "dip", "dips", "hummus",
            "başlangıç", "başlangıçlar", "meze", "soğuk meze", "sıcak meze",
            "vorspeise", "vorspeisen",
        ],
    },
    {
        category: "Side",
        keywords: [
            "side", "sides", "side dish", "side dishes",
            "add on", "add-on", "add ons", "add-ons", "extras",
            "vegetable", "vegetables", "veggies",
            "fries", "fry", "rice", "beans",
            "accompaniment", "accompaniments", "contorni",
            "garnitür", "yan", "yan lezzetler",
            "beilage", "beilagen",
        ],
    },
    {
        category: "Dessert",
        keywords: [
            "dessert", "desserts", "sweet", "sweets",
            "cake", "cakes", "pie", "pies", "pastry", "pastries",
            "ice cream", "sorbet", "gelato", "pudding",
            "chocolate", "cheesecake", "tiramisu",
            "dolci", "tatlı", "tatlılar",
            "nachtisch", "nachspeise",
        ],
    },
    {
        category: "Bread",
        keywords: [
            "bread", "breads", "bakery",
            "focaccia", "naan", "pita", "flatbread", "flatbreads",
            "roll", "rolls", "biscuit", "biscuits",
            "toast", "garlic bread", "cornbread",
            "ekmek", "simit", "pide",
            "brot",
        ],
    },
    {
        category: "Soup",
        keywords: [
            "soup", "soups", "chowder", "bisque", "stew", "stews",
            "broth", "consommé", "consomme", "gazpacho",
            "minestrone", "pho", "ramen",
            "çorba", "çorbalar",
            "suppe", "suppen",
        ],
    },
    {
        category: "Drinks",
        keywords: [
            "drink", "drinks", "beverage", "beverages",
            "cocktail", "cocktails", "beer", "beers", "wine", "wines",
            "spirits", "spirit", "liquor", "liquors",
            "margarita", "martini", "mojito",
            "non-alcoholic", "non alcoholic", "soft drink", "soft drinks",
            "soda", "juice", "juices", "water",
            "coffee", "tea", "espresso", "latte", "cappuccino",
            "bar", "bar menu",
            "içecek", "içecekler", "kokteyl", "bira", "şarap",
            "getränke",
        ],
    },
];

// ── Main mapping function ────────────────────────────────────────
/**
 * Maps a POS category/group name to a Restly internal category.
 * Uses fuzzy keyword matching (case-insensitive, partial match).
 * Returns "Main" as default if no match is found.
 *
 * @example
 * mapPOSCategory("Entrees")         → "Main"
 * mapPOSCategory("Small Plates")    → "Appetizer"
 * mapPOSCategory("Craft Cocktails") → "Drinks"
 * mapPOSCategory("Sides & Extras")  → "Side"
 * mapPOSCategory("Çorbalar")        → "Soup"
 */
export function mapPOSCategory(posCategory: string): RestlyCategory {
    if (!posCategory) return "Main";

    const lower = posCategory.toLowerCase().trim();

    // Phase 1: Exact match on any keyword
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
        if (keywords.includes(lower)) return category;
    }

    // Phase 2: Check if any keyword is contained within the POS category name
    // e.g. "Craft Cocktails & Spirits" contains "cocktail" → Drinks
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
        for (const kw of keywords) {
            if (lower.includes(kw) || kw.includes(lower)) {
                return category;
            }
        }
    }

    // Phase 3: Word-level matching
    // Split both sides into words and check overlap
    const posWords = lower.split(/[\s\-_&\/,]+/).filter(w => w.length > 2);
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
        for (const kw of keywords) {
            const kwWords = kw.split(/[\s\-_&\/,]+/);
            const hasOverlap = posWords.some(pw => kwWords.some(kw => kw.startsWith(pw) || pw.startsWith(kw)));
            if (hasOverlap) return category;
        }
    }

    // Default: if nothing matches, classify as "Main"
    return "Main";
}

// ── Batch mapping with confidence ────────────────────────────────
export interface CategoryMappingResult {
    original: string;
    mapped: RestlyCategory;
    confidence: "exact" | "partial" | "default";
}

/**
 * Map multiple POS categories at once, returning confidence levels.
 * Useful for debugging and displaying to the user.
 */
export function mapPOSCategories(posCategories: string[]): CategoryMappingResult[] {
    return posCategories.map(original => {
        const lower = original.toLowerCase().trim();
        
        // Check exact
        for (const { category, keywords } of CATEGORY_KEYWORDS) {
            if (keywords.includes(lower)) {
                return { original, mapped: category, confidence: "exact" as const };
            }
        }
        // Check partial
        for (const { category, keywords } of CATEGORY_KEYWORDS) {
            for (const kw of keywords) {
                if (lower.includes(kw) || kw.includes(lower)) {
                    return { original, mapped: category, confidence: "partial" as const };
                }
            }
        }
        // Default
        return { original, mapped: "Main" as RestlyCategory, confidence: "default" as const };
    });
}
