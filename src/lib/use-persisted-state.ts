"use client";
import { useEffect, useState } from "react";

/**
 * Returns a unique storage key prefix for the current user + active location.
 * This ensures each location's data is isolated in localStorage.
 * Format: "user_{email}_{locationId}" e.g. "user_demo_restly_com_cmn6983x00001..."
 */
export function useUserPrefix(): string {
    const [prefix, setPrefix] = useState("");

    useEffect(() => {
        // Read active location from localStorage (set by Sidebar.tsx)
        const activeLocationId = localStorage.getItem("restly_active_location") || "default";
        const locSuffix = activeLocationId.replace(/[^a-zA-Z0-9]/g, "_");

        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const email = d.email || "anon";
                const emailKey = email.replace(/[^a-zA-Z0-9]/g, "_");
                setPrefix(`${emailKey}_${locSuffix}`);
            })
            .catch(() => setPrefix(`anon_${locSuffix}`));
    }, []);

    return prefix;
}

/** Save data to localStorage with user-specific key */
export function userSave(prefix: string, key: string, data: any) {
    if (!prefix) return;
    try {
        localStorage.setItem(`restly_${prefix}_${key}`, JSON.stringify(data));
    } catch { /* quota */ }
}

/** Load data from localStorage with user-specific key */
export function userLoad<T>(prefix: string, key: string): T | null {
    if (!prefix) return null;
    try {
        const raw = localStorage.getItem(`restly_${prefix}_${key}`);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
