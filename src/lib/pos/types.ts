// ═══════════════════════════════════════════════════════════════════
// POS-Agnostic Types — ALL POS adapters implement these interfaces
// Supports: Toast, Square, Clover, Lightspeed, Revel
// ═══════════════════════════════════════════════════════════════════

/** A single order from POS */
export interface POSOrder {
    id: string;
    externalId: string;          // POS-native order ID
    createdAt: string;           // ISO datetime
    closedAt?: string;
    status: "open" | "closed" | "voided";
    server?: string;             // Employee name
    guestCount: number;
    subtotal: number;            // cents
    tax: number;
    total: number;
    tip: number;
    discount: number;
    paymentMethod?: string;
    items: POSOrderItem[];
}

export interface POSOrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;           // cents
    total: number;
    category?: string;           // "Food", "Beverage", "Alcohol"
    modifiers?: string[];
}

/** Menu item from POS */
export interface POSMenuItem {
    id: string;
    externalId: string;
    name: string;
    price: number;               // cents
    category: string;
    description?: string;
    ingredients?: string[];      // Some POS systems include this
    isActive: boolean;
}

/** Employee/staff from POS */
export interface POSEmployee {
    id: string;
    externalId: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
}

/** Labor entry from POS */
export interface POSLaborEntry {
    employeeId: string;
    employeeName: string;
    role: string;
    clockIn: string;             // ISO
    clockOut?: string;
    regularHours: number;
    overtimeHours: number;
    laborCost: number;           // cents
}

/** Revenue summary for a time period */
export interface POSRevenueSummary {
    grossSales: number;          // cents
    netSales: number;
    tax: number;
    tips: number;
    discounts: number;
    refunds: number;
    totalOrders: number;
    totalCovers: number;
    avgOrderValue: number;       // cents
    avgSpendPerCover: number;
    topSellingItems: { name: string; quantity: number; revenue: number }[];
    salesByHour: { hour: number; revenue: number; orders: number }[];
    salesByCategory: { category: string; revenue: number; percentage: number }[];
    paymentBreakdown: { method: string; total: number; count: number }[];
}

/** Full sync result returned by any POS adapter */
export interface POSSyncResult {
    provider: string;
    locationId: string;
    syncedAt: string;
    revenue: POSRevenueSummary;
    orders: POSOrder[];
    menuItems: POSMenuItem[];
    employees: POSEmployee[];
    labor: POSLaborEntry[];
    laborCostTotal: number;       // cents
    laborPercentage: number;      // 0-100
    errors: string[];
}

/** Credentials shape per POS provider */
export interface POSCredentials {
    provider: string;
    apiKey?: string;       // posApiKey
    secretKey?: string;    // posSecretKey
    locationId?: string;   // posLocationId (GUID, Merchant ID, etc.)
}

/** Interface every POS adapter MUST implement */
export interface POSAdapter {
    readonly provider: string;
    authenticate(creds: POSCredentials): Promise<string>;   // returns token
    fetchOrders(token: string, guid: string, startDate: string, endDate: string): Promise<POSOrder[]>;
    fetchMenu(token: string, guid: string): Promise<POSMenuItem[]>;
    fetchEmployees(token: string, guid: string): Promise<POSEmployee[]>;
    fetchLabor(token: string, guid: string, startDate: string, endDate: string): Promise<POSLaborEntry[]>;
    buildRevenueSummary(orders: POSOrder[]): POSRevenueSummary;
}
