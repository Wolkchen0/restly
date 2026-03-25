"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsDemo } from "@/lib/use-demo";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function KDSPage() {
    const isDemo = useIsDemo();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [escalatedId, setEscalatedId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<string>("");
    const [autoRefresh, setAutoRefresh] = useState(true);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const fetchKDS = useCallback(async () => {
        try {
            const res = await fetch("/api/kds");
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setLastRefresh(new Date().toLocaleTimeString());
            }
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    // Initial fetch + auto-refresh every 15 seconds
    useEffect(() => {
        fetchKDS();
        if (!autoRefresh) return;
        const interval = setInterval(fetchKDS, 15000);
        return () => clearInterval(interval);
    }, [fetchKDS, autoRefresh]);

    const handleEscalate = (id: string) => {
        setEscalatedId(id);
        showToast(`Ticket ${id} has been escalated to the Kitchen Manager via SMS/Push.`);
    };

    const handleBumpTicket = (id: string) => {
        setData((prev: any) => {
            if (!prev) return prev;
            return { ...prev, tickets: prev.tickets.filter((t: any) => t.id !== id), lateTickets: prev.lateTickets.filter((t: any) => t.id !== id) };
        });
        showToast(`Ticket ${id} bumped — marked as complete.`);
    };

    if (loading) {
        return (
            <>
                <div className="topbar">
                    <div className="topbar-title">🍳 Kitchen Performance (KDS Data)</div>
                </div>
                <div className="page-content fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: 36, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }}>🍳</div>
                        <div style={{ fontSize: 14 }}>Connecting to Kitchen Display System...</div>
                    </div>
                </div>
            </>
        );
    }

    if (!isDemo) {
        return (
            <>
                <div className="topbar">
                    <div className="topbar-title">🍳 Kitchen Performance (KDS Data)</div>
                </div>
                <div className="page-content fade-in">
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
                </div>
            </>
        );
    }

    const lateCount = data?.lateTickets?.length || 0;
    const stationData = (data?.stations || []).map((s: any) => ({ name: s.name, avgTime: s.avgTime, load: s.load }));

    return (
        <>
            <style>{`
                @keyframes pulse { 0% {opacity:1} 50% {opacity:0.4} 100% {opacity:1} }
                @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
            `}</style>

            <div className="topbar">
                <div className="topbar-title">🍳 Kitchen Performance (KDS Data)</div>
                <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {data?.period && (
                        <span style={{ fontSize: 12, color: "var(--gold-light)", background: "rgba(201,168,76,0.1)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.2)" }}>
                            🕐 {data.period}
                        </span>
                    )}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: autoRefresh ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: autoRefresh ? "var(--green)" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
                    >
                        {autoRefresh ? "● Live" : "○ Paused"}
                    </button>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: autoRefresh ? "var(--green)" : "var(--text-muted)", display: "inline-block", boxShadow: autoRefresh ? "0 0 10px var(--green)" : "none", animation: autoRefresh ? "blink 2s ease-in-out infinite" : "none" }} />
                        {autoRefresh ? "Live KDS Sync" : "Paused"} {lastRefresh && `· ${lastRefresh}`}
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

                {/* AI INSIGHT — Dynamic */}
                {data?.aiRecommendation && (
                    <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, padding: "20px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start", animation: "slideIn 0.3s ease" }}>
                        <div style={{ fontSize: 24 }}>🤖</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>Restly AI Kitchen Insight</div>
                            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                {data.aiRecommendation}
                            </div>
                        </div>
                    </div>
                )}

                {/* KPIs — Dynamic */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-label">Average Ticket Time</div>
                        <div className="kpi-value" style={{ color: "var(--yellow)" }}>{data?.avgTicketTime || "—"}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Longest Ticket</div>
                        <div className="kpi-value" style={{ color: data?.longestTicketMinutes > 20 ? "var(--red)" : "var(--yellow)" }}>{data?.longestTicketMinutes ? `${data.longestTicketMinutes}m` : "—"}</div>
                        {data?.longestTicket && data.longestTicket !== "—" && (
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {data.longestTicket.substring(data.longestTicket.indexOf("("))}
                            </div>
                        )}
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Open Tickets</div>
                        <div className="kpi-value" style={{ color: "var(--text-primary)" }}>{data?.openTickets ?? "—"}</div>
                        {lateCount > 0 && (
                            <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, fontWeight: 700 }}>
                                {lateCount} late/warning
                            </div>
                        )}
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label">Throughput / hr</div>
                        <div className="kpi-value" style={{ color: "var(--green)" }}>{data?.throughputNum ? `${data.throughputNum} plates` : "—"}</div>
                    </div>
                </div>

                <div className="grid-2">
                    {/* STATION ANALYTICS CHART — Dynamic */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Station Bottleneck Analysis</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Avg Min/Ticket · Load %</span>
                        </div>
                        <div className="card-body" style={{ height: 300, padding: "20px 0 0 0" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stationData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={11} domain={[0, 'auto']} tickFormatter={v => `${v}m`} />
                                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={90} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: "rgba(255,255,255,0.02)" }}
                                        contentStyle={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                                        formatter={(value: any, name?: string) => [`${value}m`, name === "avgTime" ? "Avg Time" : (name || "")]}
                                    />
                                    <Bar dataKey="avgTime" radius={[0, 4, 4, 0]} barSize={24}>
                                        {stationData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.avgTime > 20 ? "#ef4444" : entry.avgTime > 15 ? "#eab308" : "#4ade80"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Station status badges */}
                        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {(data?.stations || []).map((s: any) => (
                                <div key={s.name} style={{
                                    fontSize: 11, padding: "4px 10px", borderRadius: 20,
                                    background: s.status === "BOTTLENECK" ? "rgba(239,68,68,0.1)" : s.status === "HIGH" ? "rgba(234,179,8,0.1)" : s.status === "IDLE" ? "rgba(255,255,255,0.04)" : "rgba(74,222,128,0.1)",
                                    color: s.status === "BOTTLENECK" ? "#ef4444" : s.status === "HIGH" ? "#eab308" : s.status === "IDLE" ? "var(--text-muted)" : "#4ade80",
                                    border: `1px solid ${s.status === "BOTTLENECK" ? "rgba(239,68,68,0.2)" : s.status === "HIGH" ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.06)"}`,
                                    fontWeight: 700,
                                }}>
                                    {s.name}: {s.load}% · {s.activeTickets}/{s.capacity}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIVE TICKETS — Dynamic */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Live Tickets ({data?.tickets?.length || 0})</span>
                            <span style={{ fontSize: 12, color: lateCount > 0 ? "var(--red)" : "var(--text-muted)", fontWeight: lateCount > 0 ? 700 : 400 }}>
                                {lateCount > 0 ? `⚠ ${lateCount} need attention` : "All on time ✓"}
                            </span>
                        </div>
                        <div className="card-body" style={{ padding: 0, maxHeight: 500, overflowY: "auto" }}>
                            {(data?.tickets || []).map((t: any) => (
                                <div key={t.id} style={{
                                    padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    background: escalatedId === t.id ? "rgba(220,38,38,0.05)" : t.status === "LATE" ? "rgba(239,68,68,0.03)" : "transparent",
                                    animation: "slideIn 0.2s ease",
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.id}</span>
                                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tbl {t.table}</span>
                                            {t.status === "LATE" && <span className="badge badge-red" style={{ animation: "pulse 2s infinite" }}>LATE</span>}
                                            {t.status === "WARNING" && <span className="badge badge-yellow">WARNING</span>}
                                            {t.status === "FIRED" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(96,165,250,0.1)", color: "#60a5fa", fontWeight: 700 }}>JUST FIRED</span>}
                                            {t.priority === "vip" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(201,168,76,0.15)", color: "#E8C96E", fontWeight: 700 }}>⭐ VIP</span>}
                                            {t.priority === "rush" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#f87171", fontWeight: 700 }}>🔥 RUSH</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
                                            {t.server} · {t.station} {t.coursing ? `· ${t.coursing}` : ""}
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.03)", padding: "5px 10px", borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.items.join("  •  ")}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", paddingLeft: 16, flexShrink: 0 }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: t.status === "LATE" ? "#ef4444" : t.status === "WARNING" ? "#eab308" : t.status === "FIRED" ? "#60a5fa" : "#4ade80" }}>
                                            {t.time}
                                        </div>
                                        <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => handleBumpTicket(t.id)}
                                                style={{ padding: "3px 8px", fontSize: 10, borderRadius: 4, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", color: "#4ade80", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
                                            >
                                                ✓ Bump
                                            </button>
                                            {(t.status === "LATE" || t.status === "WARNING") && (
                                                <button
                                                    onClick={() => handleEscalate(t.id)}
                                                    disabled={escalatedId === t.id}
                                                    style={{ padding: "3px 8px", fontSize: 10, borderRadius: 4, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, opacity: escalatedId === t.id ? 0.5 : 1 }}
                                                >
                                                    {escalatedId === t.id ? "Sent ✓" : "Escalate ↗"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data?.tickets || data.tickets.length === 0) && (
                                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                                    No active tickets
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
