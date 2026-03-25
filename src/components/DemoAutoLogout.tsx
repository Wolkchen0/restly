"use client";
import { useEffect, useState } from "react";
import { useIsDemo } from "@/lib/use-demo";
import { signOut } from "next-auth/react";

/**
 * Demo Auto-Logout: Automatically logs out demo accounts every hour.
 * Shows a countdown warning in the last 5 minutes.
 * Only affects demo accounts — real accounts are never auto-logged out.
 */
export default function DemoAutoLogout() {
    const isDemo = useIsDemo();
    const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (!isDemo) return;

        // Store login time if not already stored
        const DEMO_KEY = "demo_session_start";
        let loginTime = sessionStorage.getItem(DEMO_KEY);
        if (!loginTime) {
            loginTime = String(Date.now());
            sessionStorage.setItem(DEMO_KEY, loginTime);
        }

        const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

        const checkTimer = () => {
            const elapsed = Date.now() - parseInt(loginTime!);
            const remaining = SESSION_DURATION_MS - elapsed;
            const remainingMinutes = Math.ceil(remaining / (60 * 1000));

            if (remaining <= 0) {
                // Time's up — auto logout
                sessionStorage.removeItem(DEMO_KEY);
                sessionStorage.removeItem("guests_consent");
                signOut({ callbackUrl: "/login?demo_expired=true" });
                return;
            }

            setMinutesLeft(remainingMinutes);

            // Show warning in the last 5 minutes
            if (remaining <= 5 * 60 * 1000) {
                setShowWarning(true);
            }
        };

        checkTimer(); // Initial check
        const interval = setInterval(checkTimer, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [isDemo]);

    if (!isDemo || !showWarning || minutesLeft === null) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "rgba(239,68,68,0.95)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 8px 30px rgba(239,68,68,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            backdropFilter: "blur(8px)",
        }}>
            <span>⏰</span>
            <span>Demo session expires in {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}. Data will reset on logout.</span>
        </div>
    );
}
