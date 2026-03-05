// Mock Toast POS Data - Demo mode (replace with real API when credentials are ready)
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
}

const MOCK_INVENTORY: InventoryItem[] = [
    { guid: "t1", name: "Wagyu Beef Tenderloin", category: "Proteins", status: "IN_STOCK", quantity: 24, unit: "lbs", threshold: 10, costPerUnit: 45, lastUpdated: "2026-03-04" },
    { guid: "t2", name: "Pan-Seared Duck Breast", category: "Proteins", status: "LOW_STOCK", quantity: 6, unit: "portions", threshold: 8, costPerUnit: 22, lastUpdated: "2026-03-04" },
    { guid: "t3", name: "Atlantic Salmon", category: "Proteins", status: "IN_STOCK", quantity: 18, unit: "portions", threshold: 6, costPerUnit: 18, lastUpdated: "2026-03-04" },
    { guid: "t4", name: "Prime Ribeye 16oz", category: "Proteins", status: "IN_STOCK", quantity: 20, unit: "portions", threshold: 8, costPerUnit: 38, lastUpdated: "2026-03-04" },
    { guid: "t5", name: "Lobster Bisque", category: "Soups & Appetizers", status: "LOW_STOCK", quantity: 4, unit: "servings", threshold: 10, costPerUnit: 12, lastUpdated: "2026-03-04" },
    { guid: "t6", name: "Burrata (Fresh)", category: "Dairy", status: "IN_STOCK", quantity: 12, unit: "pieces", threshold: 4, costPerUnit: 9, lastUpdated: "2026-03-04" },
    { guid: "t7", name: "Black Truffle", category: "Specialty", status: "OUT_OF_STOCK", quantity: 0, unit: "grams", threshold: 50, costPerUnit: 5.5, lastUpdated: "2026-03-03" },
    { guid: "t8", name: "Truffle Oil (Premium)", category: "Oils & Condiments", status: "IN_STOCK", quantity: 3, unit: "bottles", threshold: 1, costPerUnit: 65, lastUpdated: "2026-03-04" },
    { guid: "t9", name: "Bordeaux Wine (House)", category: "Beverages", status: "IN_STOCK", quantity: 48, unit: "bottles", threshold: 12, costPerUnit: 35, lastUpdated: "2026-03-04" },
    { guid: "t10", name: "Champagne (Moët)", category: "Beverages", status: "LOW_STOCK", quantity: 5, unit: "bottles", threshold: 6, costPerUnit: 55, lastUpdated: "2026-03-04" },
    { guid: "t11", name: "Wild Mushroom Mix", category: "Produce", status: "IN_STOCK", quantity: 8, unit: "lbs", threshold: 3, costPerUnit: 14, lastUpdated: "2026-03-04" },
    { guid: "t12", name: "Heirloom Tomatoes", category: "Produce", status: "IN_STOCK", quantity: 15, unit: "lbs", threshold: 5, costPerUnit: 4, lastUpdated: "2026-03-04" },
    { guid: "t13", name: "Arborio Rice", category: "Dry Goods", status: "IN_STOCK", quantity: 30, unit: "lbs", threshold: 10, costPerUnit: 2.5, lastUpdated: "2026-03-04" },
    { guid: "t14", name: "Crème Brûlée Mix", category: "Desserts", status: "OUT_OF_STOCK", quantity: 0, unit: "portions", threshold: 12, costPerUnit: 6, lastUpdated: "2026-03-03" },
    { guid: "t15", name: "Tiramisu (Pre-made)", category: "Desserts", status: "IN_STOCK", quantity: 16, unit: "portions", threshold: 8, costPerUnit: 7, lastUpdated: "2026-03-04" },
    { guid: "t16", name: "Heavy Cream", category: "Dairy", status: "IN_STOCK", quantity: 10, unit: "quarts", threshold: 3, costPerUnit: 5, lastUpdated: "2026-03-04" },
    { guid: "t17", name: "Parmesan Reggiano", category: "Dairy", status: "IN_STOCK", quantity: 6, unit: "lbs", threshold: 2, costPerUnit: 18, lastUpdated: "2026-03-04" },
    { guid: "t18", name: "Saffron", category: "Specialty", status: "LOW_STOCK", quantity: 8, unit: "grams", threshold: 10, costPerUnit: 8, lastUpdated: "2026-03-04" },
    { guid: "t19", name: "Sourdough Bread (Artisan)", category: "Bakery", status: "IN_STOCK", quantity: 20, unit: "loaves", threshold: 6, costPerUnit: 6, lastUpdated: "2026-03-04" },
    { guid: "t20", name: "Local Olive Oil", category: "Oils & Condiments", status: "IN_STOCK", quantity: 8, unit: "bottles", threshold: 2, costPerUnit: 22, lastUpdated: "2026-03-04" },
];

export function getInventory(): InventoryItem[] {
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
