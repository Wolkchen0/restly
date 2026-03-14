"use client";
import { useEffect, useState } from "react";

/**
 * Returns a unique storage key prefix for the current user.
 * This ensures each account's data is isolated in localStorage.
 */
export function useUserPrefix(): string {
    const [prefix, setPrefix] = useState("");

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const email = d.email || "anon";
                setPrefix(email.replace(/[^a-zA-Z0-9]/g, "_"));
            })
            .catch(() => setPrefix("anon"));
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
