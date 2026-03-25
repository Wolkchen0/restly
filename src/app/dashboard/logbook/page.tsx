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

const TAG_OPTIONS = ["Busy", "Slow", "Maintenance", "Vendor", "Quality Issue", "Inventory Incident", "Audit", "Urgent", "Staffing", "Manual Entry"];

export default function LogbookPage() {
    const isDemo = useIsDemo();
    const userPrefix = useUserPrefix();
    const [logs, setLogs] = useState<any[]>([]);
    const [restaurantName, setRestaurantName] = useState("");

    // Load restaurant name for manager field
    useEffect(() => {
        fetch("/api/locations").then(r => r.json()).then(d => {
            setRestaurantName(d.restaurantName || "Manager");
        }).catch(() => {});
    }, []);

    // Load/save logs per user — non-demo starts empty
    useEffect(() => { if (userPrefix) { const saved = userLoad<any[]>(userPrefix, "logbook"); if (saved) setLogs(saved); else if (isDemo) setLogs(INITIAL_LOGS); } }, [userPrefix, isDemo]);
    useEffect(() => { userSave(userPrefix, "logbook", logs); }, [logs, userPrefix]);

    const [logModalOpen, setLogModalOpen] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [newShift, setNewShift] = useState<"AM" | "PM">(new Date().getHours() < 16 ? "AM" : "PM");
    const [newManager, setNewManager] = useState("");
    const [newTags, setNewTags] = useState<string[]>([]);
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
        setNewManager(restaurantName || "Manager");
        setNewShift(new Date().getHours() < 16 ? "AM" : "PM");
        setNewTags([]);
        setNewNote("");
        setLogModalOpen(true);
    };

    const confirmNewEntry = () => {
        if (!newNote.trim()) return;

        const newLog = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            shift: newShift,
            manager: newManager.trim() || "Manager",
            notes: newNote,
            tags: newTags.length > 0 ? newTags : ["Manual Entry"]
        };
        setLogs([newLog, ...logs]);
        setNewNote("");
        setNewManager("");
        setNewTags([]);
        setLogModalOpen(false);
        showToast("✅ Shift note added successfully.");
    };

    const toggleTag = (tag: string) => {
        setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const hasLogs = logs.length > 0;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📓 Shift Logbook</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handleNewEntry}>New Entry +</button>
                    {hasLogs && <button className="btn-secondary" onClick={handleExportLog}>Export Log ↗</button>}
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* NEW ENTRY MODAL */}
            {logModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 480, padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#fff" }}>📝 New Shift Entry</h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Manager Name</div>
                                <input
                                    value={newManager}
                                    onChange={e => setNewManager(e.target.value)}
                                    style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "10px 12px", borderRadius: 8, fontSize: 14, outline: "none" }}
                                    placeholder="e.g. Sarah J."
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Shift</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => setNewShift("AM")}
                                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${newShift === "AM" ? "#E8C96E" : "var(--border)"}`, background: newShift === "AM" ? "rgba(232,201,110,0.15)" : "var(--bg-secondary)", color: newShift === "AM" ? "#E8C96E" : "rgba(255,255,255,0.6)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                                    >☀ AM</button>
                                    <button
                                        onClick={() => setNewShift("PM")}
                                        style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${newShift === "PM" ? "#60a5fa" : "var(--border)"}`, background: newShift === "PM" ? "rgba(96,165,250,0.15)" : "var(--bg-secondary)", color: newShift === "PM" ? "#60a5fa" : "rgba(255,255,255,0.6)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                                    >🌙 PM</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Shift Notes</div>
                            <textarea
                                autoFocus
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", minHeight: 120, resize: "none" }}
                                placeholder="e.g. Lunch rush was slow, printer jammed twice, 86'd salmon..."
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tags</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {TAG_OPTIONS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        style={{
                                            fontSize: 11, padding: "5px 10px", borderRadius: 4, cursor: "pointer",
                                            border: `1px solid ${newTags.includes(tag) ? "#E8C96E" : "rgba(255,255,255,0.1)"}`,
                                            background: newTags.includes(tag) ? "rgba(232,201,110,0.15)" : "rgba(255,255,255,0.03)",
                                            color: newTags.includes(tag) ? "#E8C96E" : "rgba(255,255,255,0.6)",
                                            fontWeight: newTags.includes(tag) ? 700 : 500,
                                            textTransform: "uppercase", letterSpacing: 0.5,
                                        }}
                                    >{tag}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setLogModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmNewEntry} disabled={!newNote.trim()}>Save Entry</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content fade-in">

                {/* AI SUMMARY — show for demo or when there are logs */}
                {isDemo && hasLogs && (
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
                )}

                {hasLogs ? (
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Morning / Evening Handover Notes</span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{logs.length} entries</span>
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
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Shift Logs yet</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Click <strong>"New Entry +"</strong> above to add your first shift handover note, or connect your POS for automated AI recaps.
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn-primary" onClick={handleNewEntry}>Add First Entry +</button>
                            <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>
                                Connect POS
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
