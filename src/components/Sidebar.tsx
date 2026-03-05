"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const NAV = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/guests", label: "Guest Intelligence", icon: "👤" },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦", badge: 2 },
    { href: "/dashboard/schedule", label: "Schedule", icon: "📅", badge: 3 },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

interface Props {
    restaurantName: string;
    plan: string;
}

export default function Sidebar({ restaurantName, plan }: Props) {
    const path = usePathname();
    const [time, setTime] = useState("");

    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit" }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const isActive = (href: string) =>
        href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">✦ Restly</div>
                <div className="sidebar-restaurant">{restaurantName}</div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Management</div>
                {NAV.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item${isActive(item.href) ? " active" : ""}`}
                    >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        {item.label}
                        {item.badge ? <span className="badge">{item.badge}</span> : null}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                {/* Plan badge */}
                <div style={{ marginBottom: 12 }}>
                    <span className={`plan-badge plan-${plan}`}>
                        {plan === "trial" ? "⏳ Trial" : plan === "pro" ? "✦ Pro" : "✓ Starter"}
                    </span>
                </div>

                {/* Clock */}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
                    California, PST<br />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "monospace" }}>{time}</span>
                </div>

                <div style={{ fontSize: 11, color: "var(--green)", marginBottom: 12 }}>✓ CCPA/CPRA Compliant</div>

                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    style={{ width: "100%", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textAlign: "left" }}
                >
                    ↩ Sign Out
                </button>
            </div>
        </aside>
    );
}
