"use client";
import { useState, useEffect } from "react";

/**
 * Hook to determine whether to show demo data.
 * Returns true ONLY for the demo account (demo@restly.com / Sample Restaurant).
 * Real users see empty states, not fake data.
 */
export function useIsDemo(): boolean {
    const [isDemo, setIsDemo] = useState(false); // Default: NOT demo

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const name = (d.restaurantName || "").toLowerCase();
                const email = d.email || "";
                const isDemoAccount = email === "demo@restly.com" || name.includes("sample");
                setIsDemo(isDemoAccount);
            })
            .catch(() => setIsDemo(false));
    }, []);

    return isDemo;
}
