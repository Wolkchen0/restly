// ═══════════════════════════════════════════════════════════════════
// Toast POS Adapter (Dashboard Sync)
// Used by: /api/pos-sync → usePOSSync hook → Overview, Finance, Recipes, KDS
// Factory pattern: authenticate(creds) → fetchOrders(token, guid, ...)
//
// NOTE: There is also src/services/pos/toast-adapter.ts which is used by
// /api/team/performance and /api/pos/test. Both share the same Toast API
// endpoints but have different interface patterns for their consumers.
// Docs: https://doc.toasttab.com/openapi
// ═══════════════════════════════════════════════════════════════════

import type {
    POSAdapter, POSCredentials, POSOrder, POSOrderItem,
    POSMenuItem, POSEmployee, POSLaborEntry, POSRevenueSummary,
} from "./types";
import { mapPOSCategory } from "./category-mapper";

const TOAST_BASE = "https://ws-api.toasttab.com";

export class ToastAdapter implements POSAdapter {
    readonly provider = "toast";

    // ── Auth ────────────────────────────────────────────────────────
    async authenticate(creds: POSCredentials): Promise<string> {
        const res = await fetch(`${TOAST_BASE}/authentication/v1/authentication/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: creds.apiKey,
                clientSecret: creds.secretKey,
                userScope: "API",
            }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Toast auth failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        const token = data?.token?.accessToken;
        if (!token) throw new Error("Toast auth response missing accessToken");
        return token;
    }

    // ── Orders ──────────────────────────────────────────────────────
    async fetchOrders(token: string, guid: string, startDate: string, endDate: string): Promise<POSOrder[]> {
        // Toast Orders API v2 — paginated
        const allOrders: POSOrder[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            const url = `${TOAST_BASE}/orders/v2/orders?businessDate=${startDate}&pageSize=${pageSize}&page=${page}`;
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Toast-Restaurant-External-ID": guid,
                },
            });

            if (!res.ok) {
                // If 404 or error, break gracefully
                if (res.status === 404) break;
                const text = await res.text().catch(() => "");
                throw new Error(`Toast orders failed (${res.status}): ${text.substring(0, 200)}`);
            }

            const orders = await res.json();
            if (!Array.isArray(orders) || orders.length === 0) {
                hasMore = false;
                break;
            }

            for (const o of orders) {
                allOrders.push(this.mapOrder(o));
            }

            if (orders.length < pageSize) hasMore = false;
            else page++;

            // Safety: max 10 pages (1000 orders)
            if (page > 10) break;
        }

        return allOrders;
    }

    private mapOrder(o: any): POSOrder {
        const checks = o.checks || [];
        let subtotal = 0, tax = 0, total = 0, tip = 0, discount = 0;
        const items: POSOrderItem[] = [];
        let paymentMethod = "Unknown";

        for (const check of checks) {
            subtotal += check.totalAmount || 0;
            tax += check.taxAmount || 0;
            tip += check.tip?.amount || 0;

            // Selections = line items
            for (const sel of (check.selections || [])) {
                items.push({
                    id: sel.guid || sel.externalId || `item_${items.length}`,
                    name: sel.displayName || sel.itemName || "Unknown Item",
                    quantity: sel.quantity || 1,
                    unitPrice: Math.round((sel.price || 0) * 100),
                    total: Math.round((sel.price || 0) * (sel.quantity || 1) * 100),
                    category: sel.salesCategory?.name || "Uncategorized",
                    modifiers: (sel.modifiers || []).map((m: any) => m.displayName || m.name),
                });
            }

            // Applied discounts
            for (const d of (check.appliedDiscounts || [])) {
                discount += d.discountAmount || 0;
            }

            // Payment
            const payments = check.payments || [];
            if (payments.length > 0) {
                paymentMethod = payments[0].type || payments[0].cardType || "Card";
            }

            total += (check.totalAmount || 0) + (check.taxAmount || 0);
        }

        return {
            id: o.guid || o.externalId || `toast_${Date.now()}`,
            externalId: o.guid || "",
            createdAt: o.openedDate || o.createdDate || new Date().toISOString(),
            closedAt: o.closedDate || undefined,
            status: o.voided ? "voided" : o.closedDate ? "closed" : "open",
            server: o.server?.firstName ? `${o.server.firstName} ${o.server.lastName || ""}`.trim() : undefined,
            guestCount: o.numberOfGuests || 1,
            subtotal: Math.round(subtotal * 100),
            tax: Math.round(tax * 100),
            total: Math.round(total * 100),
            tip: Math.round(tip * 100),
            discount: Math.round(discount * 100),
            paymentMethod,
            items,
        };
    }

    // ── Menu ────────────────────────────────────────────────────────
    async fetchMenu(token: string, guid: string): Promise<POSMenuItem[]> {
        const res = await fetch(`${TOAST_BASE}/configuration/v1/menus`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Toast-Restaurant-External-ID": guid,
            },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Toast menu failed (${res.status}): ${text.substring(0, 200)}`);
        }

        const menus = await res.json();
        const items: POSMenuItem[] = [];

        // Toast menus structure: menus[] -> groups[] -> items[]
        for (const menu of (Array.isArray(menus) ? menus : [])) {
            for (const group of (menu.groups || [])) {
                const rawCategory = group.name || "Uncategorized";
                const category = mapPOSCategory(rawCategory);
                for (const item of (group.items || [])) {
                    items.push({
                        id: item.guid || `menu_${items.length}`,
                        externalId: item.guid || "",
                        name: item.name || "Unknown",
                        price: Math.round((item.price || item.prices?.[0]?.price || 0) * 100),
                        category,
                        description: item.description || undefined,
                        isActive: item.visibility !== "HIDDEN",
                    });
                }
            }
        }

        return items;
    }

    // ── Employees ───────────────────────────────────────────────────
    async fetchEmployees(token: string, guid: string): Promise<POSEmployee[]> {
        const res = await fetch(`${TOAST_BASE}/labor/v1/employees`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Toast-Restaurant-External-ID": guid,
            },
        });

        if (!res.ok) {
            // Some Toast plans don't include labor API — gracefully return empty
            if (res.status === 403) return [];
            const text = await res.text().catch(() => "");
            throw new Error(`Toast employees failed (${res.status}): ${text.substring(0, 200)}`);
        }

        const employees = await res.json();
        return (Array.isArray(employees) ? employees : []).map((e: any) => ({
            id: e.guid || `emp_${Date.now()}`,
            externalId: e.guid || "",
            firstName: e.firstName || "",
            lastName: e.lastName || "",
            role: e.jobTitles?.[0]?.name || e.wageOverrides?.[0]?.jobTitle || "Staff",
            email: e.email || undefined,
        }));
    }

    // ── Labor / Time Entries ────────────────────────────────────────
    async fetchLabor(token: string, guid: string, startDate: string, endDate: string): Promise<POSLaborEntry[]> {
        const res = await fetch(`${TOAST_BASE}/labor/v1/timeEntries?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Toast-Restaurant-External-ID": guid,
            },
        });

        if (!res.ok) {
            if (res.status === 403) return []; // Labor API not in plan
            return [];
        }

        const entries = await res.json();
        return (Array.isArray(entries) ? entries : []).map((e: any) => ({
            employeeId: e.employeeReference?.guid || "",
            employeeName: `${e.employeeReference?.firstName || ""} ${e.employeeReference?.lastName || ""}`.trim() || "Unknown",
            role: e.jobReference?.title || "Staff",
            clockIn: e.inDate || "",
            clockOut: e.outDate || undefined,
            regularHours: e.regularHours || 0,
            overtimeHours: e.overtimeHours || 0,
            laborCost: Math.round((e.totalWage || 0) * 100),
        }));
    }

    // ── Revenue Summary Builder ─────────────────────────────────────
    buildRevenueSummary(orders: POSOrder[]): POSRevenueSummary {
        const closed = orders.filter(o => o.status === "closed");
        const grossSales = closed.reduce((a, o) => a + o.subtotal, 0);
        const tax = closed.reduce((a, o) => a + o.tax, 0);
        const tips = closed.reduce((a, o) => a + o.tip, 0);
        const discounts = closed.reduce((a, o) => a + o.discount, 0);
        const totalCovers = closed.reduce((a, o) => a + o.guestCount, 0);
        const voided = orders.filter(o => o.status === "voided");
        const refunds = voided.reduce((a, o) => a + o.total, 0);

        // Top selling items
        const itemMap = new Map<string, { quantity: number; revenue: number }>();
        for (const order of closed) {
            for (const item of order.items) {
                const existing = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
                existing.quantity += item.quantity;
                existing.revenue += item.total;
                itemMap.set(item.name, existing);
            }
        }
        const topSellingItems = [...itemMap.entries()]
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Sales by hour
        const hourMap = new Map<number, { revenue: number; orders: number }>();
        for (const order of closed) {
            const hour = new Date(order.createdAt).getHours();
            const existing = hourMap.get(hour) || { revenue: 0, orders: 0 };
            existing.revenue += order.total;
            existing.orders += 1;
            hourMap.set(hour, existing);
        }
        const salesByHour = Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            revenue: hourMap.get(h)?.revenue || 0,
            orders: hourMap.get(h)?.orders || 0,
        }));

        // Sales by category
        const catMap = new Map<string, number>();
        for (const order of closed) {
            for (const item of order.items) {
                const cat = item.category || "Other";
                catMap.set(cat, (catMap.get(cat) || 0) + item.total);
            }
        }
        const totalCatRevenue = [...catMap.values()].reduce((a, b) => a + b, 0) || 1;
        const salesByCategory = [...catMap.entries()]
            .map(([category, revenue]) => ({
                category,
                revenue,
                percentage: Math.round((revenue / totalCatRevenue) * 100),
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // Payment breakdown
        const payMap = new Map<string, { total: number; count: number }>();
        for (const order of closed) {
            const method = order.paymentMethod || "Other";
            const existing = payMap.get(method) || { total: 0, count: 0 };
            existing.total += order.total;
            existing.count += 1;
            payMap.set(method, existing);
        }
        const paymentBreakdown = [...payMap.entries()]
            .map(([method, data]) => ({ method, ...data }))
            .sort((a, b) => b.total - a.total);

        const netSales = grossSales - discounts - refunds;

        return {
            grossSales,
            netSales,
            tax,
            tips,
            discounts,
            refunds,
            totalOrders: closed.length,
            totalCovers,
            avgOrderValue: closed.length > 0 ? Math.round(grossSales / closed.length) : 0,
            avgSpendPerCover: totalCovers > 0 ? Math.round(grossSales / totalCovers) : 0,
            topSellingItems,
            salesByHour,
            salesByCategory,
            paymentBreakdown,
        };
    }
}
