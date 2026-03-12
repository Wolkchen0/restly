// Multi-POS Integration Service
// Supports Toast, Clover, Square, Lightspeed, Revel, and generic CSV upload
// Each tenant stores their chosen POS type in the DB

export type POSProvider = "toast" | "clover" | "square" | "lightspeed" | "revel" | "manual";

export interface InventoryItem {
    guid: string;
    name: string;
    category: string;
    status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    quantity: number;
    unit: string;
    threshold: number;
    costPerUnit: number;
    lastUpdated: string;
    supplier?: string;
    source?: "pos" | "manual";
    dailyUsage?: number;
}

// ─── MOCK DATA (shared across all POS providers in demo mode) ───────────────
const MOCK_INVENTORY: InventoryItem[] = [
    // FOOD - Proteins
    { guid: "t1", name: "Wagyu Beef Tenderloin", category: "Proteins", status: "IN_STOCK", quantity: 24, unit: "lbs", threshold: 10, costPerUnit: 45, lastUpdated: "2026-03-12", supplier: "US Foods", source: "pos", dailyUsage: 3.5 },
    { guid: "t2", name: "Pan-Seared Duck Breast", category: "Proteins", status: "LOW_STOCK", quantity: 6, unit: "portions", threshold: 8, costPerUnit: 22, lastUpdated: "2026-03-12", supplier: "Sysco", source: "pos", dailyUsage: 4 },
    { guid: "t3", name: "Atlantic Salmon", category: "Proteins", status: "IN_STOCK", quantity: 18, unit: "portions", threshold: 6, costPerUnit: 18, lastUpdated: "2026-03-12", supplier: "Sysco", source: "pos", dailyUsage: 5 },
    { guid: "t4", name: "Prime Ribeye 16oz", category: "Proteins", status: "IN_STOCK", quantity: 20, unit: "portions", threshold: 8, costPerUnit: 38, lastUpdated: "2026-03-12", supplier: "US Foods", source: "pos", dailyUsage: 6 },
    // FOOD - Soups & Apps
    { guid: "t5", name: "Lobster Bisque", category: "Soups & Apps", status: "LOW_STOCK", quantity: 4, unit: "servings", threshold: 10, costPerUnit: 12, lastUpdated: "2026-03-12", supplier: "Local", source: "pos", dailyUsage: 8 },
    // FOOD - Dairy
    { guid: "t6", name: "Burrata (Fresh)", category: "Dairy", status: "IN_STOCK", quantity: 12, unit: "pieces", threshold: 4, costPerUnit: 9, lastUpdated: "2026-03-12", supplier: "Dairy Farm Co", source: "pos", dailyUsage: 3 },
    { guid: "t16", name: "Heavy Cream", category: "Dairy", status: "IN_STOCK", quantity: 10, unit: "quarts", threshold: 3, costPerUnit: 5, lastUpdated: "2026-03-12", supplier: "Dairy Farm Co", source: "pos", dailyUsage: 2 },
    { guid: "t17", name: "Parmesan Reggiano", category: "Dairy", status: "IN_STOCK", quantity: 6, unit: "lbs", threshold: 2, costPerUnit: 18, lastUpdated: "2026-03-12", supplier: "Euro Foods", source: "pos", dailyUsage: 0.5 },
    // FOOD - Specialty
    { guid: "t7", name: "Black Truffle", category: "Specialty", status: "OUT_OF_STOCK", quantity: 0, unit: "grams", threshold: 50, costPerUnit: 5.5, lastUpdated: "2026-03-11", supplier: "Euro Foods", source: "pos", dailyUsage: 10 },
    { guid: "t18", name: "Saffron", category: "Specialty", status: "LOW_STOCK", quantity: 8, unit: "grams", threshold: 10, costPerUnit: 8, lastUpdated: "2026-03-12", supplier: "Euro Foods", source: "pos", dailyUsage: 2 },
    // FOOD - Other
    { guid: "t8", name: "Truffle Oil (Premium)", category: "Oils & Condiments", status: "IN_STOCK", quantity: 3, unit: "bottles", threshold: 1, costPerUnit: 65, lastUpdated: "2026-03-12", supplier: "Euro Foods", source: "pos" },
    { guid: "t20", name: "Local Olive Oil", category: "Oils & Condiments", status: "IN_STOCK", quantity: 8, unit: "bottles", threshold: 2, costPerUnit: 22, lastUpdated: "2026-03-12", supplier: "Farm Fresh", source: "manual" },
    { guid: "t11", name: "Wild Mushroom Mix", category: "Produce", status: "IN_STOCK", quantity: 8, unit: "lbs", threshold: 3, costPerUnit: 14, lastUpdated: "2026-03-12", supplier: "Farm Fresh", source: "pos", dailyUsage: 1.5 },
    { guid: "t12", name: "Heirloom Tomatoes", category: "Produce", status: "IN_STOCK", quantity: 15, unit: "lbs", threshold: 5, costPerUnit: 4, lastUpdated: "2026-03-12", supplier: "Farm Fresh", source: "pos", dailyUsage: 3 },
    { guid: "t13", name: "Arborio Rice", category: "Dry Goods", status: "IN_STOCK", quantity: 30, unit: "lbs", threshold: 10, costPerUnit: 2.5, lastUpdated: "2026-03-12", supplier: "Restaurant Depot", source: "pos", dailyUsage: 2 },
    { guid: "t14", name: "Crème Brûlée Mix", category: "Desserts", status: "OUT_OF_STOCK", quantity: 0, unit: "portions", threshold: 12, costPerUnit: 6, lastUpdated: "2026-03-11", supplier: "Sysco", source: "pos", dailyUsage: 6 },
    { guid: "t15", name: "Tiramisu (Pre-made)", category: "Desserts", status: "IN_STOCK", quantity: 16, unit: "portions", threshold: 8, costPerUnit: 7, lastUpdated: "2026-03-12", supplier: "Sysco", source: "pos", dailyUsage: 4 },
    { guid: "t19", name: "Sourdough Bread (Artisan)", category: "Bakery", status: "IN_STOCK", quantity: 20, unit: "loaves", threshold: 6, costPerUnit: 6, lastUpdated: "2026-03-12", supplier: "Local Bakery", source: "manual", dailyUsage: 8 },
    // ALCOHOL - Wine
    { guid: "d1", name: "Bordeaux Red (House)", category: "Alcohol", status: "IN_STOCK", quantity: 48, unit: "bottles", threshold: 12, costPerUnit: 35, lastUpdated: "2026-03-12", supplier: "Wine Direct", source: "pos", dailyUsage: 6 },
    { guid: "d2", name: "Champagne Moët & Chandon", category: "Alcohol", status: "LOW_STOCK", quantity: 5, unit: "bottles", threshold: 6, costPerUnit: 55, lastUpdated: "2026-03-12", supplier: "Wine Direct", source: "pos", dailyUsage: 2 },
    { guid: "d3", name: "Pinot Grigio Santa Margherita", category: "Alcohol", status: "IN_STOCK", quantity: 24, unit: "bottles", threshold: 8, costPerUnit: 22, lastUpdated: "2026-03-12", supplier: "Wine Direct", source: "pos", dailyUsage: 4 },
    { guid: "d4", name: "Cabernet Sauvignon Caymus", category: "Alcohol", status: "IN_STOCK", quantity: 12, unit: "bottles", threshold: 4, costPerUnit: 72, lastUpdated: "2026-03-12", supplier: "Wine Direct", source: "pos", dailyUsage: 1 },
    { guid: "d5", name: "Prosecco La Marca", category: "Alcohol", status: "IN_STOCK", quantity: 36, unit: "bottles", threshold: 10, costPerUnit: 14, lastUpdated: "2026-03-12", supplier: "Wine Direct", source: "pos", dailyUsage: 5 },
    // ALCOHOL - Spirits
    { guid: "d6", name: "Grey Goose Vodka", category: "Alcohol", status: "IN_STOCK", quantity: 6, unit: "bottles", threshold: 3, costPerUnit: 32, lastUpdated: "2026-03-12", supplier: "Southern Glazer's", source: "pos", dailyUsage: 0.5 },
    { guid: "d7", name: "Casamigos Reposado Tequila", category: "Alcohol", status: "LOW_STOCK", quantity: 2, unit: "bottles", threshold: 3, costPerUnit: 45, lastUpdated: "2026-03-12", supplier: "Southern Glazer's", source: "pos", dailyUsage: 0.4 },
    { guid: "d8", name: "Hendrick's Gin", category: "Alcohol", status: "IN_STOCK", quantity: 4, unit: "bottles", threshold: 2, costPerUnit: 35, lastUpdated: "2026-03-12", supplier: "Southern Glazer's", source: "pos", dailyUsage: 0.3 },
    { guid: "d9", name: "Woodford Reserve Bourbon", category: "Alcohol", status: "IN_STOCK", quantity: 5, unit: "bottles", threshold: 2, costPerUnit: 38, lastUpdated: "2026-03-12", supplier: "Southern Glazer's", source: "pos", dailyUsage: 0.3 },
    { guid: "d10", name: "Aperol", category: "Alcohol", status: "OUT_OF_STOCK", quantity: 0, unit: "bottles", threshold: 2, costPerUnit: 24, lastUpdated: "2026-03-11", supplier: "Southern Glazer's", source: "pos", dailyUsage: 0.5 },
    // ALCOHOL - Beer
    { guid: "d11", name: "Stella Artois (Draft)", category: "Alcohol", status: "IN_STOCK", quantity: 4, unit: "kegs", threshold: 2, costPerUnit: 145, lastUpdated: "2026-03-12", supplier: "AB InBev", source: "pos", dailyUsage: 0.3 },
    { guid: "d12", name: "IPA Local Craft", category: "Alcohol", status: "IN_STOCK", quantity: 3, unit: "kegs", threshold: 1, costPerUnit: 165, lastUpdated: "2026-03-12", supplier: "Local Brewery", source: "pos", dailyUsage: 0.2 },
    // BEVERAGES - Non-Alcoholic & Mixers
    { guid: "d13", name: "San Pellegrino Sparkling", category: "Beverages", status: "IN_STOCK", quantity: 48, unit: "bottles", threshold: 12, costPerUnit: 2.5, lastUpdated: "2026-03-12", supplier: "Restaurant Depot", source: "pos", dailyUsage: 8 },
    { guid: "d14", name: "Fresh Lime Juice", category: "Beverages", status: "IN_STOCK", quantity: 8, unit: "bottles", threshold: 3, costPerUnit: 6, lastUpdated: "2026-03-12", supplier: "Farm Fresh", source: "manual", dailyUsage: 2 },
    { guid: "d15", name: "Simple Syrup (House)", category: "Beverages", status: "LOW_STOCK", quantity: 2, unit: "bottles", threshold: 3, costPerUnit: 4, lastUpdated: "2026-03-12", supplier: "House", source: "manual", dailyUsage: 1 },
    { guid: "d16", name: "Espresso Beans (Lavazza)", category: "Beverages", status: "IN_STOCK", quantity: 12, unit: "lbs", threshold: 4, costPerUnit: 15, lastUpdated: "2026-03-12", supplier: "Specialty Coffee", source: "pos", dailyUsage: 1.5 },
    { guid: "d17", name: "Orange Juice (Fresh)", category: "Beverages", status: "IN_STOCK", quantity: 6, unit: "gallons", threshold: 2, costPerUnit: 8, lastUpdated: "2026-03-12", supplier: "Farm Fresh", source: "manual", dailyUsage: 1 },
    { guid: "d18", name: "Tonic Water (Fever-Tree)", category: "Beverages", status: "IN_STOCK", quantity: 36, unit: "bottles", threshold: 12, costPerUnit: 2, lastUpdated: "2026-03-12", supplier: "Restaurant Depot", source: "pos", dailyUsage: 4 },
];

// ─── POS PROVIDER INFO ───────────────────────────────────────────────────────
export const POS_PROVIDERS: Record<POSProvider, { name: string; icon: string; color: string; setupFields: string[] }> = {
    toast: {
        name: "Toast POS",
        icon: "🍞",
        color: "#FF6B35",
        setupFields: ["TOAST_API_KEY", "TOAST_RESTAURANT_GUID"],
    },
    clover: {
        name: "Clover",
        icon: "🍀",
        color: "#1DA462",
        setupFields: ["CLOVER_MERCHANT_ID", "CLOVER_API_TOKEN"],
    },
    square: {
        name: "Square",
        icon: "⬛",
        color: "#3E4348",
        setupFields: ["SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"],
    },
    lightspeed: {
        name: "Lightspeed",
        icon: "⚡",
        color: "#005EB8",
        setupFields: ["LIGHTSPEED_CLIENT_ID", "LIGHTSPEED_CLIENT_SECRET"],
    },
    revel: {
        name: "Revel Systems",
        icon: "🔴",
        color: "#C41A1A",
        setupFields: ["REVEL_API_KEY", "REVEL_API_SECRET", "REVEL_ESTABLISHMENT_ID"],
    },
    manual: {
        name: "Manual / CSV Upload",
        icon: "📋",
        color: "#6B7280",
        setupFields: [],
    },
};

// ─── PUBLIC API ─────────────────────────────────────────────────────────────
// In demo mode, all providers return the same mock data.
// In production: call the respective POS API with the tenant's credentials.

export function getInventory(_provider: POSProvider = "toast"): InventoryItem[] {
    return MOCK_INVENTORY;
}

export function getLowStockItems(): InventoryItem[] {
    return MOCK_INVENTORY.filter(i => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK");
}

export function getOutOfStockItems(): InventoryItem[] {
    return MOCK_INVENTORY.filter(i => i.status === "OUT_OF_STOCK");
}

export function getInventoryByCategory(): Record<string, InventoryItem[]> {
    return MOCK_INVENTORY.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, InventoryItem[]>);
}

export function getInventoryStats() {
    const total = MOCK_INVENTORY.length;
    const inStock = MOCK_INVENTORY.filter(i => i.status === "IN_STOCK").length;
    const lowStock = MOCK_INVENTORY.filter(i => i.status === "LOW_STOCK").length;
    const outOfStock = MOCK_INVENTORY.filter(i => i.status === "OUT_OF_STOCK").length;
    const totalValue = MOCK_INVENTORY.reduce((acc, i) => acc + i.quantity * i.costPerUnit, 0);
    return { total, inStock, lowStock, outOfStock, totalValue };
}
