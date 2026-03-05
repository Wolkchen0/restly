"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
    const [guests, setGuests] = useState<any>(null);
    const [inventory, setInventory] = useState<any>(null);
    const [schedule, setSchedule] = useState<any>(null);

    useEffect(() => {
        fetch("/api/guests").then(r => r.json()).then(setGuests);
        fetch("/api/inventory").then(r => r.json()).then(setInventory);
        fetch("/api/timeoff").then(r => r.json()).then(setSchedule);
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <>
            <div className="topbar">
                <div>
                    <div className="topbar-title">{greeting}, Manager 👋</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </div>
                </div>
                <div className="topbar-right">
                    <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                        🇺🇸 California · CCPA Compliant
                    </span>
                </div>
            </div>

            <div className="page-content fade-in">
                {/* KPIs */}
                <div className="kpi-grid">
                    {[
                        {
                            label: "Covers Tonight", icon: "🍽️",
                            value: guests?.todayReservations?.reduce((a: number, r: any) => a + r.partySize, 0) ?? "—",
                            sub: `${guests?.todayReservations?.length ?? 0} reservations`,
                            color: "var(--gold-light)",
                        },
                        {
                            label: "VIP Guests Tonight", icon: "⭐",
                            value: guests?.todayReservations?.filter((r: any) => r.isVip).length ?? "—",
                            sub: "Require special attention",
                            color: "var(--purple)",
                        },
                        {
                            label: "Stock Alerts", icon: "⚠️",
                            value: inventory?.lowStock?.length ?? "—",
                            sub: `${inventory?.stats?.outOfStock ?? 0} out of stock`,
                            color: inventory?.stats?.outOfStock > 0 ? "var(--red)" : "var(--yellow)",
                        },
                        {
                            label: "Pending Time-Off", icon: "📅",
                            value: schedule?.stats?.pending ?? "—",
                            sub: "Awaiting your review",
                            color: "var(--yellow)",
                        },
                    ].map(card => (
                        <div key={card.label} className="kpi-card">
                            <div className="kpi-label">{card.icon} {card.label}</div>
                            <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
                            <div className="kpi-sub">{card.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="grid-2" style={{ gap: 20 }}>
                    {/* Tonight's Reservations */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">🍽️ Tonight&apos;s Reservations</span>
                            <Link href="/dashboard/guests" style={{ fontSize: 12, color: "var(--gold-light)", textDecoration: "none" }}>View all →</Link>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="data-table">
                                <thead><tr><th>Time</th><th>Guest</th><th>Party</th><th>Table</th><th>Status</th></tr></thead>
                                <tbody>
                                    {!guests && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Loading…</td></tr>}
                                    {guests?.todayReservations?.slice(0, 7).map((r: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.time}</td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    {r.isVip && <span style={{ color: "var(--gold-light)", fontSize: 14 }}>⭐</span>}
                                                    <span style={{ color: r.isVip ? "var(--gold-light)" : "inherit", fontWeight: r.isVip ? 600 : 400 }}>{r.guestName}</span>
                                                </div>
                                            </td>
                                            <td>{r.partySize}</td>
                                            <td>T{r.tableNumber}</td>
                                            <td><span className={`badge badge-${r.status === "confirmed" ? "blue" : r.status === "seated" ? "green" : "yellow"}`}>{r.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stock Alerts */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">⚠️ Stock Alerts</span>
                            <Link href="/dashboard/inventory" style={{ fontSize: 12, color: "var(--gold-light)", textDecoration: "none" }}>Manage →</Link>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {inventory?.stats?.outOfStock > 0 && (
                                <div className="alert alert-danger" style={{ margin: 16, marginBottom: 8 }}>
                                    <span>🚨</span>
                                    <div><strong>{inventory.stats.outOfStock} items</strong> out of stock — may affect tonight&apos;s menu!</div>
                                </div>
                            )}
                            {!inventory && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>}
                            {inventory?.lowStock?.slice(0, 6).map((item: any, i: number) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.category}</div>
                                    </div>
                                    <span className={`badge ${item.status === "OUT_OF_STOCK" ? "badge-red" : "badge-yellow"}`}>
                                        {item.status === "OUT_OF_STOCK" ? "OUT" : `${item.quantity} ${item.unit}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pending Time-Off */}
                {schedule?.requests?.filter((r: any) => r.status === "PENDING").length > 0 && (
                    <div className="card" style={{ marginTop: 20 }}>
                        <div className="card-header">
                            <span className="card-title">📅 Pending Time-Off Requests</span>
                            <Link href="/dashboard/schedule" style={{ fontSize: 12, color: "var(--gold-light)", textDecoration: "none" }}>Review all →</Link>
                        </div>
                        <table className="data-table">
                            <thead><tr><th>Employee</th><th>Role</th><th>Dates</th><th>Reason</th><th>Action</th></tr></thead>
                            <tbody>
                                {schedule.requests.filter((r: any) => r.status === "PENDING").slice(0, 4).map((r: any) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.employeeName}</td>
                                        <td><span className="badge badge-blue">{r.employeeRole}</span></td>
                                        <td style={{ fontSize: 12 }}>{r.startDate} → {r.endDate}</td>
                                        <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 200 }}>{r.reason}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button style={{ fontSize: 11, padding: "5px 10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)", borderRadius: 6, cursor: "pointer" }}>✓ Approve</button>
                                                <button style={{ fontSize: 11, padding: "5px 10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: 6, cursor: "pointer" }}>✗ Deny</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
