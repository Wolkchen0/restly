"use client";
import { useState, useEffect } from "react";
import { useIsDemo } from "@/lib/use-demo";
import { useUserPrefix, userSave, userLoad } from "@/lib/use-persisted-state";

const INITIAL_LOGS = [
    { id: 1, date: "2026-03-05", shift: "AM", manager: "Sarah J.", notes: "Health inspector dropped by, everything passed (98/100). Need to order more degreaser. Slow lunch, about $1400 total.", tags: ["Audit", "Slow"] },
    { id: 2, date: "2026-03-05", shift: "PM", manager: "Mark T.", notes: "Bar was slammed due to the game. Ran out of draft IPA by 9 PM. Fire alarm tripped for 1 minute because grill hood wasn't switched on high. Total sales: $8,500.", tags: ["Busy", "Inventory Incident"] },
    { id: 3, date: "2026-03-06", shift: "AM", manager: "Sarah J.", notes: "Produce delivery late by 2 hours. Tomatoes looked bad, sent back 2 cases. Refund requested.", tags: ["Vendor", "Quality Issue"] },
    { id: 4, date: "2026-03-11", shift: "AM", manager: "Sarah J.", notes: "The Hobart Dishwasher is acting up again, it's making a loud noise and not draining. Might be broken.", tags: ["Maintenance", "Urgent"] },
];

export default function LogbookPage() {
    const isDemo = useIsDemo();
    const userPrefix = useUserPrefix();
    const [logs, setLogs] = useState<any[]>([]);

    // Load/save logs per user — non-demo starts empty
    useEffect(() => { if (userPrefix) { const saved = userLoad<any[]>(userPrefix, "logbook"); if (saved) setLogs(saved); else if (isDemo) setLogs(INITIAL_LOGS); } }, [userPrefix, isDemo]);
    useEffect(() => { userSave(userPrefix, "logbook", logs); }, [logs, userPrefix]);

    const [logModalOpen, setLogModalOpen] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleExportLog = () => {
        import("@/utils/pdf-export").then(({ exportToPDF }) => {
            exportToPDF({
                title: "Shift Logbook",
                subtitle: `Exported ${new Date().toLocaleDateString()}`,
                headers: ["Date", "Shift", "Manager", "Tags", "Notes"],
                rows: logs.map(l => [l.date, l.shift, l.manager, l.tags.join(", "), l.notes]),
                orientation: "landscape",
                fileName: `Restly_Logbook_${new Date().toISOString().split('T')[0]}`,
            });
            showToast("📥 Logbook PDF exported!");
        });
    };

    const handleNewEntry = () => {
        setLogModalOpen(true);
    };

    const confirmNewEntry = () => {
        if (!newNote.trim()) return;

        const newLog = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            shift: new Date().getHours() < 16 ? "AM" : "PM",
            manager: "Current User",
            notes: newNote,
            tags: ["Manual Entry"]
        };
        setLogs([newLog, ...logs]);
        setNewNote("");
        setLogModalOpen(false);
        showToast("Shift note added successfully.");
    };



    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📓 Shift Logbook</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handleNewEntry}>New Entry +</button>
                    <button className="btn-secondary" onClick={handleExportLog}>Export Log ↗</button>
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* CUSTOM MODAL */}
            {logModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 400, padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#fff" }}>Enter shift notes:</h3>
                        <textarea
                            autoFocus
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 20, minHeight: 120, resize: "none" }}
                            placeholder="e.g. Lunch rush was slow, printer jammed twice..."
                        />
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setLogModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmNewEntry}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content fade-in">

                {isDemo ? (
                    <>
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
                                {logs.map(log => (
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
                                                {log.tags.map((t: string) => (
                                                    <span key={t} style={{ fontSize: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Shift Logs yet</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Start adding manual End-of-Day shift reports, or connect your POS to have the AI automatically generate comprehensive recaps each night.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Connect POS for AI Auto-Logs
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
