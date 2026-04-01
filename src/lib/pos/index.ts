// ═══════════════════════════════════════════════════════════════════
// POS Factory — Returns the correct adapter based on provider name
// Add new POS systems here as they're implemented
// ═══════════════════════════════════════════════════════════════════

import type { POSAdapter, POSCredentials, POSSyncResult, POSOrder, POSMenuItem, POSEmployee, POSLaborEntry, POSRevenueSummary } from "./types";
import { ToastAdapter } from "./toast-adapter";

const adapters: Record<string, () => POSAdapter> = {
    toast: () => new ToastAdapter(),
    // square: () => new SquareAdapter(),    // TODO
    // clover: () => new CloverAdapter(),    // TODO
    // lightspeed: () => new LightspeedAdapter(), // TODO
    // revel: () => new RevelAdapter(),      // TODO
};

export function getPOSAdapter(provider: string): POSAdapter | null {
    const factory = adapters[provider];
    return factory ? factory() : null;
}

export function getSupportedProviders(): string[] {
    return Object.keys(adapters);
}

/**
 * Full sync: authenticate → fetch orders + menu + employees + labor → build summary
 * This is the main entry point called by the API route.
 */
export async function runPOSSync(
    creds: POSCredentials,
    locationId: string,
    dateRange: { start: string; end: string }
): Promise<POSSyncResult> {
    const adapter = getPOSAdapter(creds.provider);
    if (!adapter) {
        return {
            provider: creds.provider,
            locationId,
            syncedAt: new Date().toISOString(),
            revenue: emptyRevenue(),
            orders: [],
            menuItems: [],
            employees: [],
            labor: [],
            laborCostTotal: 0,
            laborPercentage: 0,
            errors: [`POS provider "${creds.provider}" is not yet supported for live sync.`],
        };
    }

    const errors: string[] = [];
    let token: string;

    try {
        token = await adapter.authenticate(creds);
    } catch (e: any) {
        return {
            provider: creds.provider,
            locationId,
            syncedAt: new Date().toISOString(),
            revenue: emptyRevenue(),
            orders: [],
            menuItems: [],
            employees: [],
            labor: [],
            laborCostTotal: 0,
            laborPercentage: 0,
            errors: [`Authentication failed: ${e.message}`],
        };
    }

    const guid = creds.locationId || "";

    // Fetch all data in parallel for speed
    const [ordersResult, menuResult, employeesResult, laborResult] = await Promise.allSettled([
        adapter.fetchOrders(token, guid, dateRange.start, dateRange.end),
        adapter.fetchMenu(token, guid),
        adapter.fetchEmployees(token, guid),
        adapter.fetchLabor(token, guid, dateRange.start, dateRange.end),
    ]);

    const orders = ordersResult.status === "fulfilled" ? ordersResult.value : (errors.push(`Orders: ${(ordersResult as any).reason?.message}`), []);
    const menuItems = menuResult.status === "fulfilled" ? menuResult.value : (errors.push(`Menu: ${(menuResult as any).reason?.message}`), []);
    const employees = employeesResult.status === "fulfilled" ? employeesResult.value : (errors.push(`Employees: ${(employeesResult as any).reason?.message}`), []);
    const labor = laborResult.status === "fulfilled" ? laborResult.value : (errors.push(`Labor: ${(laborResult as any).reason?.message}`), []);

    const revenue = adapter.buildRevenueSummary(orders);
    const laborCostTotal = labor.reduce((a, l) => a + l.laborCost, 0);
    const laborPercentage = revenue.grossSales > 0
        ? Math.round((laborCostTotal / revenue.grossSales) * 100)
        : 0;

    return {
        provider: creds.provider,
        locationId,
        syncedAt: new Date().toISOString(),
        revenue,
        orders,
        menuItems,
        employees,
        labor,
        laborCostTotal,
        laborPercentage,
        errors,
    };
}

function emptyRevenue() {
    return {
        grossSales: 0, netSales: 0, tax: 0, tips: 0, discounts: 0, refunds: 0,
        totalOrders: 0, totalCovers: 0, avgOrderValue: 0, avgSpendPerCover: 0,
        topSellingItems: [], salesByHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, orders: 0 })),
        salesByCategory: [], paymentBreakdown: [],
    };
}

export type { POSSyncResult, POSCredentials, POSAdapter, POSOrder, POSMenuItem, POSEmployee, POSLaborEntry, POSRevenueSummary };
