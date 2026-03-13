"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const STATION_DATA = [
    { name: "Grill", avgTime: 24, load: 85 },
    { name: "Saute", avgTime: 18, load: 60 },
    { name: "Fryer", avgTime: 12, load: 90 },
    { name: "Garde Manger", avgTime: 8, load: 40 },
    { name: "Expo", avgTime: 4, load: 95 },
];

const INITIAL_TICKETS = [
    { id: "T-8902", table: "14", server: "Lisa P.", items: ["2x Ribeye (M)", "1x Caesar", "1x Truffle Fries"], time: "28m", status: "LATE" },
    { id: "T-8903", table: "22", server: "Carlos R.", items: ["1x Salmon", "1x Vegan Bowl"], time: "18m", status: "WARNING" },
    { id: "T-8904", table: "8", server: "Marco T.", items: ["3x Burger", "1x Wings", "4x Coke"], time: "12m", status: "ON_TIME" },
    { id: "T-8905", table: "Bar 2", server: "Dave", items: ["1x Nachos"], time: "4m", status: "ON_TIME" },
];

export default function KDSPage() {
    const [isDemo, setIsDemo] = useState(true);
    const [tickets, setTickets] = useState(INITIAL_TICKETS);
    const [escalatedId, setEscalatedId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleEscalate = (id: string) => {
        setEscalatedId(id);
        showToast(`Ticket ${id} has been escalated to the Kitchen Manager via SMS/Push.`);
    };

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(!!restName);
            })
            .catch(() => { });
    }, []);

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🍳 Kitchen Performance (KDS Data)</div>
                <div className="topbar-right">
                    <span style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 10px var(--green)" }} />
                        Live Toast KDS Sync
                    </span>
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            <div className="page-content fade-in">

                {/* AI INSIGHT */}
                {isDemo && (
                    <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, padding: "20px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ fontSize: 24 }}>🤖</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>Restly AI Kitchen Insight</div>
                            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                The <strong>Grill station</strong> is currently averaging 24 minutes per ticket (Target: 15m), causing a bottleneck for Table 14 and 18. I recommend shifting a prep cook to the Grill line immediately or 86'ing well-done steaks to clear the backlog.
                            </div>
                        </div>
                    </div>
                )}

                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-label">Average Ticket Time</div>
                        <div className="kpi-value" style={{ color: "var(--yellow)" }}>{isDemo ? "18m 30s" : "0m 0s"}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Longest Ticket</div>
                        <div className="kpi-value" style={{ color: "var(--red)" }}>{isDemo ? "28m 05s" : "0m 0s"}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Open Tickets</div>
                        <div className="kpi-value" style={{ color: "var(--text-primary)" }}>{isDemo ? "14" : "0"}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Throughput / hr</div>
                        <div className="kpi-value" style={{ color: "var(--green)" }}>{isDemo ? "42 plates" : "0 plates"}</div>
                    </div>
                </div>

                {isDemo ? (
                    <div className="grid-2">
                        {/* STATION ANALYTICS CHART */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Station Bottleneck Analysis</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Avg Min/Ticket</span>
                            </div>
                            <div className="card-body" style={{ height: 300, padding: "20px 0 0 0" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={STATION_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                        <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={11} domain={[0, 30]} tickFormatter={v => `${v}m`} />
                                        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={80} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="avgTime" radius={[0, 4, 4, 0]} barSize={24}>
                                            {STATION_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.avgTime > 20 ? "#ef4444" : entry.avgTime > 15 ? "#eab308" : "#4ade80"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* LIVE TICKETS */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Live Late/Warning Tickets</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                {tickets.map(t => (
                                    <div key={t.id} style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: escalatedId === t.id ? "rgba(220,38,38,0.05)" : "transparent" }}>
                                        <div>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{t.id} (Table {t.table})</span>
                                                {t.status === "LATE" && <span className="badge badge-red" style={{ animation: "pulse 2s infinite" }}>LATE</span>}
                                                {t.status === "WARNING" && <span className="badge badge-yellow">APPROACHING</span>}
                                            </div>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Server: {t.server}</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 8, background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: 6 }}>
                                                {t.items.join("   •   ")}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", paddingLeft: 16 }}>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: t.status === "LATE" ? "#ef4444" : t.status === "WARNING" ? "#eab308" : "#4ade80" }}>{t.time}</div>
                                            {/* Escalate only available with real POS/KDS integration */}
                                            {!isDemo && (
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: "4px 8px", fontSize: 11, marginTop: 8, opacity: escalatedId === t.id ? 0.5 : 1 }}
                                                onClick={() => handleEscalate(t.id)}
                                                disabled={escalatedId === t.id}
                                            >
                                                {escalatedId === t.id ? "Escalated ✓" : "Escalate ↗"}
                                            </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <style>{`@keyframes pulse { 0% {opacity:1} 50% {opacity:0.4} 100% {opacity:1} }`}</style>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Kitchen Display System (KDS) Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            To monitor live ticket times, station bottlenecks, and AI alerts, please connect your KDS integration (Toast/Square/Lightspeed).
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Go to Integrations
                        </button>
                    </div>
                )}

            </div>
        </>
    );
}
