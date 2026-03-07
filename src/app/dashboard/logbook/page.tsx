"use client";
import { useState } from "react";

const LOGS = [
    { id: 1, date: "2026-03-05", shift: "AM", manager: "Sarah J.", notes: "Health inspector dropped by, everything passed (98/100). Need to order more degreaser. Slow lunch, about $1400 total.", tags: ["Audit", "Slow"] },
    { id: 2, date: "2026-03-05", shift: "PM", manager: "Mark T.", notes: "Bar was slammed due to the game. Ran out of draft IPA by 9 PM. Fire alarm tripped for 1 minute because grill hood wasn't switched on high. Total sales: $8,500.", tags: ["Busy", "Inventory Incident"] },
    { id: 3, date: "2026-03-06", shift: "AM", manager: "Sarah J.", notes: "Produce delivery late by 2 hours. Tomatoes looked bad, sent back 2 cases. Refund requested.", tags: ["Vendor", "Quality Issue"] },
];

export default function LogbookPage() {
    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📓 Shift Logbook</div>
                <div className="topbar-right">
                    <button className="btn-primary">New Entry +</button>
                    <button className="btn-secondary">Export Log</button>
                </div>
            </div>

            <div className="page-content fade-in">

                {/* AI SUMMARY */}
                <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: 16, padding: "20px", marginBottom: 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 24 }}>🧠</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>Restly AI Daily Recap (Past 24h)</div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                            You had an <strong>excellent health inspection (98)</strong> yesterday morning, but the evening rush caused a <strong>draft IPA stockout</strong>. Today began with a <strong>vendor issue</strong> (late delivery, rejected tomatoes). <br /><br />
                            <strong>Action Items:</strong> Follow up on tomato credit, update 86 list for IPA, and ensure grill cooks run hood fans on high during peak.
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Morning / Evening Handover Notes</span>
                    </div>
                    <div>
                        {LOGS.map(log => (
                            <div key={log.id} style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 24 }}>
                                <div style={{ minWidth: 120 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{log.date}</div>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`badge ${log.shift === "AM" ? "badge-yellow" : "badge-blue"}`}>{log.shift} Shift</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>Mgr: <strong>{log.manager}</strong></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>"{log.notes}"</div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                        {log.tags.map(t => (
                                            <span key={t} style={{ fontSize: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
