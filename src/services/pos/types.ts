// ── Shared POS Integration Types ──────────────────────────────────────────────
// All POS adapters (Toast, Square, Clover) implement the POSAdapter interface.
// This ensures consistent data shape regardless of POS provider.

export interface POSEmployee {
    id: string;             // POS-internal employee GUID
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;          // "Server", "Bartender", "Host", etc.
    externalId?: string;    // External employee ID (for cross-referencing)
}

export interface POSOrderItem {
    name: string;
    quantity: number;
    price: number;          // Item price in dollars
    category?: string;      // "Food", "Alcohol", "Beverage", etc.
}

export interface POSOrder {
    id: string;
    businessDate: string;   // YYYYMMDD
    employeeId: string;     // Server/bartender who handled this order
    items: POSOrderItem[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    guestCount: number;
    openedAt: string;       // ISO timestamp
    closedAt?: string;      // ISO timestamp
}

export interface POSTimeEntry {
    employeeId: string;
    jobTitle?: string;
    clockIn: string;        // ISO timestamp
    clockOut?: string;      // ISO timestamp
    hoursWorked: number;
    wage?: number;          // hourly wage
}

// ── Aggregated Staff Metrics (what the Team page displays) ───────────────────

export interface StaffMetrics {
    rank: number;
    name: string;
    role: string;
    daysWorked: number;
    totalSales: number;
    foodSales: number;
    drinkSales: number;
    checkAvg: number;
    turnTime: number;       // avg minutes between orders
    tipPct: number;
    trend: "up" | "down" | "flat";
    topItems: string[];
    upsellRate: number;     // % of orders that include drinks
}

// ── POS Adapter Interface ────────────────────────────────────────────────────

export interface POSAdapter {
    /** Test if credentials are valid */
    testConnection(): Promise<{ success: boolean; message: string }>;

    /** Get list of employees */
    getEmployees(): Promise<POSEmployee[]>;

    /** Get orders for a date range (for sales attribution) */
    getOrders(startDate: string, endDate: string): Promise<POSOrder[]>;

    /** Get time entries / shifts for a date range */
    getTimeEntries(startDate: string, endDate: string): Promise<POSTimeEntry[]>;
}

// ── POS Credentials (stored in Location model) ──────────────────────────────

export interface POSCredentials {
    provider: "toast" | "square" | "clover" | "lightspeed" | "revel" | "manual";
    apiKey: string;         // clientId (Toast) / accessToken (Square) / apiToken (Clover)
    secretKey: string;      // clientSecret (Toast) / not used (Square)
    locationId: string;     // Restaurant GUID (Toast) / Location ID (Square) / Merchant ID (Clover)
    hostname?: string;      // Toast API hostname (varies by region)
}

// ── Aggregation Helper ──────────────────────────────────────────────────────

export function aggregateStaffMetrics(
    employees: POSEmployee[],
    orders: POSOrder[],
    timeEntries: POSTimeEntry[]
): StaffMetrics[] {
    const employeeMap = new Map<string, POSEmployee>();
    employees.forEach(e => employeeMap.set(e.id, e));

    // Group orders by employee
    const ordersByEmployee = new Map<string, POSOrder[]>();
    orders.forEach(o => {
        const list = ordersByEmployee.get(o.employeeId) || [];
        list.push(o);
        ordersByEmployee.set(o.employeeId, list);
    });

    // Group time entries by employee
    const timeByEmployee = new Map<string, POSTimeEntry[]>();
    timeEntries.forEach(t => {
        const list = timeByEmployee.get(t.employeeId) || [];
        list.push(t);
        timeByEmployee.set(t.employeeId, list);
    });

    // Build metrics for each employee that has orders
    const metrics: StaffMetrics[] = [];

    for (const [empId, empOrders] of ordersByEmployee.entries()) {
        const emp = employeeMap.get(empId);
        if (!emp) continue;

        const totalSales = empOrders.reduce((s, o) => s + o.subtotal, 0);
        const totalTips = empOrders.reduce((s, o) => s + o.tip, 0);

        // Categorize sales
        let foodSales = 0;
        let drinkSales = 0;
        const itemCounts = new Map<string, number>();
        let ordersWithDrinks = 0;

        empOrders.forEach(o => {
            let hasDrink = false;
            o.items.forEach(item => {
                const cat = (item.category || "").toLowerCase();
                const revenue = item.price * item.quantity;
                if (cat.includes("alcohol") || cat.includes("beer") || cat.includes("wine") || cat.includes("cocktail") || cat.includes("drink") || cat.includes("beverage")) {
                    drinkSales += revenue;
                    hasDrink = true;
                } else {
                    foodSales += revenue;
                }
                const count = itemCounts.get(item.name) || 0;
                itemCounts.set(item.name, count + item.quantity);
            });
            if (hasDrink) ordersWithDrinks++;
        });

        // Top 2 most-sold items
        const topItems = [...itemCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([name]) => name);

        // Average turn time (minutes between order open→close)
        const turnTimes = empOrders
            .filter(o => o.closedAt && o.openedAt)
            .map(o => (new Date(o.closedAt!).getTime() - new Date(o.openedAt).getTime()) / 60000);
        const avgTurnTime = turnTimes.length > 0
            ? Math.round(turnTimes.reduce((s, t) => s + t, 0) / turnTimes.length)
            : 0;

        // Days worked from time entries
        const empTime = timeByEmployee.get(empId) || [];
        const uniqueDays = new Set(empTime.map(t => t.clockIn.substring(0, 10)));
        const daysWorked = Math.max(uniqueDays.size, 1);

        metrics.push({
            rank: 0, // assigned after sorting
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            role: emp.role || empTime[0]?.jobTitle || "Staff",
            daysWorked,
            totalSales: Math.round(totalSales * 100) / 100,
            foodSales: Math.round(foodSales * 100) / 100,
            drinkSales: Math.round(drinkSales * 100) / 100,
            checkAvg: empOrders.length > 0 ? Math.round(totalSales / empOrders.length) : 0,
            turnTime: avgTurnTime,
            tipPct: totalSales > 0 ? Math.round((totalTips / totalSales) * 1000) / 10 : 0,
            trend: "flat", // would compare with previous period — future enhancement
            topItems: topItems.length > 0 ? topItems : ["N/A"],
            upsellRate: empOrders.length > 0 ? Math.round((ordersWithDrinks / empOrders.length) * 100) : 0,
        });
    }

    // Sort by total sales descending, assign ranks
    metrics.sort((a, b) => b.totalSales - a.totalSales);
    metrics.forEach((m, i) => (m.rank = i + 1));

    return metrics;
}
