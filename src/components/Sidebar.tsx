"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

const NAV = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/finance", label: "P&L / Finance", icon: "📈" },
    { href: "/dashboard/kds", label: "Kitchen Performance", icon: "🍳" },
    { href: "/dashboard/recipes", label: "Chef & Recipes", icon: "🍽️" },
    { href: "/dashboard/pricing", label: "Dynamic Pricing", icon: "💲" },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
    { href: "/dashboard/maintenance", label: "Maintenance", icon: "🔧" },
    { href: "/dashboard/guests", label: "Guests & VIPs", icon: "👤" },
    { href: "/dashboard/inbox", label: "Social Inbox", icon: "💬" },
    { href: "/dashboard/schedule", label: "Schedule & Forms", icon: "📅" },
    { href: "/dashboard/team", label: "Staff Performance", icon: "🏆" },
    { href: "/dashboard/logbook", label: "Shift Logbook", icon: "📓" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const POS_COLORS: Record<string, string> = {
    toast: "#FF6B35", clover: "#1DA462", square: "#3E4348",
    lightspeed: "#005EB8", revel: "#C41A1A", manual: "#6B7280",
};

const POS_ICONS: Record<string, string> = {
    toast: "🍞", clover: "🍀", square: "⬛", lightspeed: "⚡", revel: "🔴", manual: "📋",
};

interface Location {
    id: string;
    name: string;
    city: string | null;
    posProvider: string | null;
    isDefault: boolean;
    isActive: boolean;
}

interface Props {
    restaurantName: string;
    plan: string;
}

// Active location is stored in localStorage — persists across page loads, no re-login
const STORAGE_KEY = "restly_active_location";

export default function Sidebar({ restaurantName, plan }: Props) {
    const path = usePathname();
    const [time, setTime] = useState("");
    const [locations, setLocations] = useState<Location[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [switcherOpen, setSwitcher] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    // Clock
    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit" }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // Load locations
    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(data => {
                if (data.locations?.length) {
                    setLocations(data.locations);
                    // Restore last used location from localStorage
                    const saved = localStorage.getItem(STORAGE_KEY);
                    const valid = data.locations.find((l: Location) => l.id === saved);
                    setActiveId(valid ? valid.id : data.locations.find((l: Location) => l.isDefault)?.id || data.locations[0].id);
                }
            })
            .catch(() => { });
    }, []);

    // Close switcher when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
                setSwitcher(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const switchTo = (locationId: string) => {
        setActiveId(locationId);
        localStorage.setItem(STORAGE_KEY, locationId);
        setSwitcher(false);
        // Reload page so dashboard data reflects the new location
        window.location.reload();
    };

    const active = locations.find(l => l.id === activeId);
    const isActive = (href: string) => href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [path]);

    return (
        <>
            {/* Mobile Header / Toggle */}
            <div className="desktop-only-hidden" style={{
                position: "fixed", top: 0, left: 0, right: 0, height: 60,
                background: "rgba(10, 10, 15, 0.9)", backdropFilter: "blur(12px)",
                borderBottom: "1px solid var(--border)", zIndex: 45,
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px"
            }}>
                <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800,
                    background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>
                    ✦ Restly
                </div>
                <button
                    onClick={() => setMobileOpen(v => !v)}
                    style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "white", padding: "8px", borderRadius: 8, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36
                    }}
                >
                    <span style={{ fontSize: 18 }}>{mobileOpen ? "✕" : "☰"}</span>
                </button>
            </div>

            {/* Backdrop */}
            {mobileOpen && (
                <div
                    className="desktop-only-hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 48, backdropFilter: "blur(4px)" }}
                />
            )}

            <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
                {/* ── BRAND HEADER ── */}
                <div className="sidebar-brand">
                    <div className="sidebar-logo">✦ Restly</div>

                    {/* Location Switcher */}
                    <div ref={switcherRef} style={{ position: "relative" }}>
                        <button
                            onClick={() => setSwitcher(v => !v)}
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                                padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
                                cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                        >
                            <div style={{ flex: 1, textAlign: "left" }}>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 2 }}>
                                    {restaurantName}
                                </div>
                                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
                                    {active ? active.name.replace(`${restaurantName} — `, "") : "—"}
                                </div>
                                {active?.city && (
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{active.city}</div>
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {active?.posProvider && (
                                    <span style={{ fontSize: 14 }}>{POS_ICONS[active.posProvider] || "📋"}</span>
                                )}
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", transform: switcherOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>▼</span>
                            </div>
                        </button>

                        {/* Dropdown */}
                        {switcherOpen && (
                            <div style={{
                                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 200,
                                background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 12, overflow: "hidden",
                                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                                animation: "fadeIn 0.15s ease",
                            }}>
                                <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
                                <div style={{ padding: "10px 12px 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>
                                    SWITCH LOCATION
                                </div>
                                {locations.map(loc => (
                                    <button
                                        key={loc.id}
                                        onClick={() => switchTo(loc.id)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                                            padding: "10px 12px", background: loc.id === activeId ? "rgba(201,168,76,0.08)" : "transparent",
                                            border: "none", borderLeft: loc.id === activeId ? "2px solid #C9A84C" : "2px solid transparent",
                                            cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
                                        }}
                                        onMouseEnter={e => { if (loc.id !== activeId) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                        onMouseLeave={e => { if (loc.id !== activeId) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                            background: loc.posProvider ? `${POS_COLORS[loc.posProvider]}20` : "rgba(255,255,255,0.06)",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                                        }}>
                                            {loc.posProvider ? POS_ICONS[loc.posProvider] : "📍"}
                                        </div>
                                        <div style={{ textAlign: "left", flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: loc.id === activeId ? "#E8C96E" : "#fff" }}>
                                                {loc.name.replace(`${restaurantName} — `, "")}
                                            </div>
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                                {loc.city || "—"} · {loc.posProvider ? `${loc.posProvider.charAt(0).toUpperCase()}${loc.posProvider.slice(1)} POS` : "No POS"}
                                            </div>
                                        </div>
                                        {loc.id === activeId && <span style={{ fontSize: 12, color: "#C9A84C" }}>✓</span>}
                                    </button>
                                ))}
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px" }}>
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setSwitcher(false)}
                                        style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                                    >
                                        + Add location
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── NAVIGATION ── */}
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
                        </Link>
                    ))}
                </nav>

                {/* ── FOOTER ── */}
                <div className="sidebar-footer">
                    <span className={`plan-badge plan-${plan}`}>
                        {plan === "trial" ? "⏳ Trial" : plan === "pro" ? "✦ Pro" : plan === "enterprise" ? "👑 Enterprise" : "✓ Starter"}
                    </span>

                    <div style={{ fontSize: 11, color: "var(--text-muted)", margin: "12px 0" }}>
                        California, PST<br />
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "monospace" }}>{time}</span>
                    </div>

                    <div style={{ fontSize: 11, color: "var(--green)", marginBottom: 12 }}>✓ CCPA/CPRA Compliant</div>

                    <button
                        onClick={() => { try { sessionStorage.removeItem("demo_session_start"); sessionStorage.removeItem("guests_consent"); sessionStorage.removeItem("restly_guest_patches"); } catch {} signOut({ callbackUrl: "/" }); }}
                        style={{ width: "100%", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ""; (e.currentTarget as HTMLElement).style.borderColor = ""; }}
                    >
                        ↩ Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
