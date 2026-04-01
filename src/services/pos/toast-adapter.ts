// ── Toast POS Adapter (Staff Performance) ────────────────────────────────────
// Used by: /api/team/performance, /api/pos/test
// Constructor pattern: new ToastAdapter(creds) → getOrders(), getEmployees()
// 
// NOTE: There is also src/lib/pos/toast-adapter.ts which is used by
// /api/pos-sync (dashboard sync). Both share the same Toast API endpoints
// but have different interface patterns for their consumers.
// Auth: OAuth2 client-credentials → clientId + clientSecret → Bearer token
// Docs: https://doc.toasttab.com/doc/devguide/authentication.html

import type { POSAdapter, POSCredentials, POSEmployee, POSOrder, POSOrderItem, POSTimeEntry } from "./types";

const TOAST_API_HOSTNAME = "https://ws-api.toasttab.com";
const AUTH_ENDPOINT = "/authentication/v1/authentication/login";

// ── Token cache (in-memory, per-process) ─────────────────────────────────────
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export class ToastAdapter implements POSAdapter {
    private clientId: string;
    private clientSecret: string;
    private restaurantGuid: string;
    private hostname: string;

    constructor(credentials: POSCredentials) {
        this.clientId = credentials.apiKey;
        this.clientSecret = credentials.secretKey;
        this.restaurantGuid = credentials.locationId;
        this.hostname = credentials.hostname || TOAST_API_HOSTNAME;
    }

    // ── Authentication ───────────────────────────────────────────────────────
    private async getToken(): Promise<string> {
        // Return cached token if still valid (with 60s buffer)
        if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
            return cachedToken.accessToken;
        }

        const res = await fetch(`${this.hostname}${AUTH_ENDPOINT}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                userAccessType: "TOAST_MACHINE_CLIENT",
            }),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Toast auth failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        if (data.status !== "SUCCESS" || !data.token?.accessToken) {
            throw new Error(`Toast auth unsuccessful: ${JSON.stringify(data)}`);
        }

        cachedToken = {
            accessToken: data.token.accessToken,
            expiresAt: Date.now() + (data.token.expiresIn || 3600) * 1000,
        };

        return cachedToken.accessToken;
    }

    // ── Generic API call with auth ───────────────────────────────────────────
    private async apiCall<T>(path: string, params?: Record<string, string>): Promise<T> {
        const token = await this.getToken();
        const url = new URL(`${this.hostname}${path}`);
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }

        const res = await fetch(url.toString(), {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Toast-Restaurant-External-ID": this.restaurantGuid,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Toast API ${path} failed (${res.status}): ${errText}`);
        }

        return res.json();
    }

    // ── Test Connection ──────────────────────────────────────────────────────
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            await this.getToken();
            // Try to fetch restaurant info to confirm GUID is valid
            await this.apiCall("/config/v2/restaurants/" + this.restaurantGuid);
            return { success: true, message: "Successfully connected to Toast POS" };
        } catch (err: any) {
            return { success: false, message: err.message || "Connection failed" };
        }
    }

    // ── Employees ────────────────────────────────────────────────────────────
    async getEmployees(): Promise<POSEmployee[]> {
        try {
            const data = await this.apiCall<any[]>("/labor/v1/employees");
            return (data || []).map((e: any) => ({
                id: e.guid || e.externalEmployeeId || "",
                firstName: e.firstName || "",
                lastName: e.lastName || "",
                email: e.email || undefined,
                role: e.jobReferences?.[0]?.title || e.wageOverrides?.[0]?.jobReference?.title || undefined,
                externalId: e.externalEmployeeId || undefined,
            }));
        } catch (err) {
            console.error("Toast getEmployees error:", err);
            return [];
        }
    }

    // ── Orders ───────────────────────────────────────────────────────────────
    // Toast Orders API v2: GET /orders/v2/orders
    // Uses businessDate format: YYYYMMDD
    async getOrders(startDate: string, endDate: string): Promise<POSOrder[]> {
        const allOrders: POSOrder[] = [];

        // Iterate through each business date in range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);

        while (current <= end) {
            const bizDate = current.toISOString().split("T")[0].replace(/-/g, "");
            try {
                const data = await this.apiCall<any[]>("/orders/v2/orders", {
                    businessDate: bizDate,
                });

                for (const order of data || []) {
                    // Only include closed/completed orders
                    if (order.voidDate || !order.closedDate) continue;

                    // Get server GUID
                    const serverId = order.server?.guid || order.server?.entityType === "RestaurantUser" && order.server?.externalId || "";
                    if (!serverId) continue;

                    // Parse order items
                    const items: POSOrderItem[] = [];
                    for (const check of order.checks || []) {
                        for (const sel of check.selections || []) {
                            items.push({
                                name: sel.displayName || sel.itemName || "Unknown Item",
                                quantity: sel.quantity || 1,
                                price: (sel.price || 0) / 100, // Toast stores in cents
                                category: sel.salesCategory?.name || sel.itemGroup?.name || "Food",
                            });
                        }
                    }

                    // Calculate totals
                    const subtotal = (order.checks || []).reduce((s: number, c: any) =>
                        s + (c.totalAmount || 0), 0) / 100;
                    const tax = (order.checks || []).reduce((s: number, c: any) =>
                        s + (c.taxAmount || 0), 0) / 100;
                    const tip = (order.checks || []).reduce((s: number, c: any) =>
                        s + (c.tipAmount || 0), 0) / 100;
                    const guestCount = order.numberOfGuests || order.guestCount || 1;

                    allOrders.push({
                        id: order.guid || "",
                        businessDate: bizDate,
                        employeeId: serverId,
                        items,
                        subtotal,
                        tax,
                        tip,
                        total: subtotal + tax + tip,
                        guestCount,
                        openedAt: order.openedDate || order.createdDate || "",
                        closedAt: order.closedDate || undefined,
                    });
                }
            } catch (err) {
                console.error(`Toast getOrders error for ${bizDate}:`, err);
            }

            current.setDate(current.getDate() + 1);
        }

        return allOrders;
    }

    // ── Time Entries / Labor ─────────────────────────────────────────────────
    async getTimeEntries(startDate: string, endDate: string): Promise<POSTimeEntry[]> {
        try {
            const data = await this.apiCall<any[]>("/labor/v1/timeEntries", {
                modifiedStartDate: new Date(startDate).toISOString(),
                modifiedEndDate: new Date(endDate + "T23:59:59").toISOString(),
            });

            return (data || []).map((t: any) => {
                const clockIn = t.clockInDate || t.inDate || "";
                const clockOut = t.clockOutDate || t.outDate || undefined;
                const hoursWorked = clockIn && clockOut
                    ? (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000
                    : 0;

                return {
                    employeeId: t.employeeReference?.guid || t.employeeGuid || "",
                    jobTitle: t.jobReference?.title || undefined,
                    clockIn,
                    clockOut,
                    hoursWorked: Math.round(hoursWorked * 100) / 100,
                    wage: t.hourlyWage != null ? t.hourlyWage / 100 : undefined,
                };
            });
        } catch (err) {
            console.error("Toast getTimeEntries error:", err);
            return [];
        }
    }
}
