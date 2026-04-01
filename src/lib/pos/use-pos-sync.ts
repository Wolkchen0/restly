// ═══════════════════════════════════════════════════════════════════
// usePOSSync — Client hook to fetch live POS data from /api/pos-sync
// Used by dashboard pages to get real sales, menu, labor data
// ═══════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import type { POSSyncResult, POSRevenueSummary } from "./types";

export interface POSSyncState {
    loading: boolean;
    connected: boolean;
    provider: string;
    locationName: string;
    data: POSSyncResult | null;
    error: string | null;
    lastSynced: string | null;
    refresh: (period?: string) => Promise<void>;
}

export function usePOSSync(locationId?: string, autoFetchPeriod: string = "today"): POSSyncState {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [provider, setProvider] = useState("");
    const [locationName, setLocationName] = useState("");
    const [data, setData] = useState<POSSyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastSynced, setLastSynced] = useState<string | null>(null);

    const refresh = useCallback(async (period?: string) => {
        setLoading(true);
        setError(null);

        try {
            // Get active location from localStorage if not provided
            const activeLocId = locationId || localStorage.getItem("restly_active_location") || undefined;

            const res = await fetch("/api/pos-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId: activeLocId,
                    period: period || autoFetchPeriod,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Sync failed");
                setConnected(false);
                return;
            }

            setConnected(json.connected || false);
            setProvider(json.provider || "");
            setLocationName(json.locationName || "");

            if (json.connected && json.revenue) {
                setData({
                    provider: json.provider,
                    locationId: json.locationId || "",
                    syncedAt: json.syncedAt || new Date().toISOString(),
                    revenue: json.revenue,
                    orders: json.orders || [],
                    menuItems: json.menuItems || [],
                    employees: json.employees || [],
                    labor: json.labor || [],
                    laborCostTotal: json.laborCostTotal || 0,
                    laborPercentage: json.laborPercentage || 0,
                    errors: json.errors || [],
                });
                setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
            } else {
                setData(null);
                if (json.message) setError(json.message);
            }
        } catch (err: any) {
            setError(err.message || "Network error");
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, [locationId, autoFetchPeriod]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { loading, connected, provider, locationName, data, error, lastSynced, refresh };
}

// Helper: convert cents to display dollars
export function centsToDisplay(cents: number): string {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function centsToFixed(cents: number): string {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
