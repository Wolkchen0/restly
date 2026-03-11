"use client";
import { useState, useEffect } from "react";

const INITIAL_LOGS = [
    { id: 1, date: "2026-03-05", shift: "AM", manager: "Sarah J.", notes: "Health inspector dropped by, everything passed (98/100). Need to order more degreaser. Slow lunch, about $1400 total.", tags: ["Audit", "Slow"] },
    { id: 2, date: "2026-03-05", shift: "PM", manager: "Mark T.", notes: "Bar was slammed due to the game. Ran out of draft IPA by 9 PM. Fire alarm tripped for 1 minute because grill hood wasn't switched on high. Total sales: $8,500.", tags: ["Busy", "Inventory Incident"] },
    { id: 3, date: "2026-03-11", shift: "AM", manager: "Sarah J.", notes: "The Hobart Dishwasher is acting up again, it's making a loud noise and not draining. Might be broken.", tags: ["Maintenance", "Urgent"] },
];

const INITIAL_EQUIPMENT = [
    { id: "EQ-1", name: "Walk-in Cooler (Main)", type: "Refrigeration", nextService: "2026-05-15", status: "OK", urgent: false },
    { id: "EQ-2", name: "Hobart Dishwasher", type: "Cleanup", nextService: "2026-03-10", status: "NEEDS_MAINTENANCE", urgent: true },
    { id: "EQ-3", name: "Pitco Fryer #2", type: "Cooking", nextService: "2026-03-08", status: "BROKEN", urgent: true },
    { id: "EQ-4", name: "Ice Machine (Bar)", type: "Refrigeration", nextService: "2026-06-01", status: "OK", urgent: false },
];

export default function MaintenancePage() {
    const [actioned, setActioned] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(true);
    const [equipmentList, setEquipmentList] = useState(INITIAL_EQUIPMENT);
    const [aiDispatched, setAiDispatched] = useState(false);

    // Modal State
    const [eqModalOpen, setEqModalOpen] = useState(false);
    const [newEqName, setNewEqName] = useState("");
    const [newEqPhone, setNewEqPhone] = useState("");
    const [newEqEmail, setNewEqEmail] = useState("");
    const [hasReminder, setHasReminder] = useState(false);
    const [reminderPeriod, setReminderPeriod] = useState("monthly");
    const [monthlyDay, setMonthlyDay] = useState("1");

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [detectedIssues, setDetectedIssues] = useState<string[]>([]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(!!restName);
            })
            .catch(() => { });

        // AI Logic: Scan logs for maintenance issues
        const issues: string[] = [];
        const keywords = ["broken", "not working", "fails", "arizali", "bozuk", "tamir", "leak", "noise"];
        INITIAL_LOGS.forEach(log => {
            const lowerNote = log.notes.toLowerCase();
            if (keywords.some(k => lowerNote.includes(k))) {
                // Try to find which equipment is mentioned
                INITIAL_EQUIPMENT.forEach(eq => {
                    if (lowerNote.includes(eq.name.toLowerCase().split(' ')[0])) {
                        issues.push(`${eq.name} issue detected in today's logs: "${log.notes}"`);
                    }
                });
            }
        });
        setDetectedIssues(issues);
    }, []);

    const handleDispatch = (id: string) => {
        setActioned(id);
        setTimeout(() => setActioned(null), 3000);
    };

    const handleAddEquipment = () => {
        setEqModalOpen(true);
    };

    const confirmAddEquipment = () => {
        if (!newEqName.trim()) return;
        const newEq = {
            id: `EQ-${equipmentList.length + 1}`,
            name: newEqName,
            type: "Custom",
            nextService: hasReminder ? `Next ${reminderPeriod} (Day ${monthlyDay})` : "Not Set",
            status: "OK",
            urgent: false,
            phone: newEqPhone,
            email: newEqEmail
        };
        setEquipmentList([...equipmentList, newEq]);
        // Reset form
        setNewEqName("");
        setNewEqPhone("");
        setNewEqEmail("");
        setHasReminder(false);
        setEqModalOpen(false);
        showToast("Equipment added successfully.");
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🔧 Equipment & Maintenance</div>
                <div className="topbar-right">
                    <button className="btn-primary" onClick={handleAddEquipment}>+ Add Equipment</button>
                </div>
            </div>

            {/* CUSTOM TOAST */}
            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}

            {/* CUSTOM MODAL */}
            {eqModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(8px)" }}>
                    <div className="card" style={{ width: 450, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#fff" }}>Add New Equipment</h3>
                        
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>EQUIPMENT NAME *</label>
                            <input
                                autoFocus
                                type="text"
                                value={newEqName}
                                onChange={e => setNewEqName(e.target.value)}
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none" }}
                                placeholder="e.g. Dishwasher, Oven..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>PHONE (OPTIONAL)</label>
                                <input
                                    type="text"
                                    value={newEqPhone}
                                    onChange={e => setNewEqPhone(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none" }}
                                    placeholder="+1..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>EMAIL (OPTIONAL)</label>
                                <input
                                    type="email"
                                    value={newEqEmail}
                                    onChange={e => setNewEqEmail(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none" }}
                                    placeholder="service@..."
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasReminder ? 16 : 0 }}>
                                <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>Enable Periodic Reminder?</span>
                                <input 
                                    type="checkbox" 
                                    checked={hasReminder} 
                                    onChange={e => setHasReminder(e.target.checked)}
                                    style={{ width: 20, height: 20, accentColor: 'var(--purple)' }}
                                />
                            </div>

                            {hasReminder && (
                                <div className="fade-in">
                                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>FREQUENCY</label>
                                    <select 
                                        value={reminderPeriod}
                                        onChange={e => setReminderPeriod(e.target.value)}
                                        style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 14, marginBottom: 12 }}
                                    >
                                        <option value="daily">Every Day</option>
                                        <option value="weekly">Every Week</option>
                                        <option value="monthly">Every Month</option>
                                        <option value="yearly">Every Year</option>
                                    </select>

                                    {reminderPeriod === "monthly" && (
                                        <>
                                            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>DAY OF MONTH</label>
                                            <input 
                                                type="number" 
                                                min="1" max="31"
                                                value={monthlyDay}
                                                onChange={e => setMonthlyDay(e.target.value)}
                                                style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 14 }}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setEqModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmAddEquipment}>Save Equipment</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-content fade-in">

                {isDemo ? (
                    <>
                        {/* AI ALERT - Now Dynamic */}
                        {(detectedIssues.length > 0) && (
                            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 16, padding: "20px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ fontSize: 24 }}>🚨</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Maintenance Required (AI Detected)</div>
                                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                        {detectedIssues.map((issue, idx) => (
                                            <div key={idx} style={{ marginBottom: 8 }}>• {issue}</div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <button
                                            className="btn-primary"
                                            style={{ fontSize: 12, padding: "6px 16px", background: aiDispatched ? "var(--green)" : "var(--purple)", borderColor: aiDispatched ? "var(--green)" : "var(--purple)" }}
                                            onClick={() => setAiDispatched(true)}
                                        >
                                            {aiDispatched ? "✓ Request Sent to Technician" : "Dispatch Repair Service ↗"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Assets & Appliances Tracker</span>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Asset ID</th>
                                            <th>Equipment Name</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Next Scheduled Service</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipmentList.map(eq => (
                                            <tr key={eq.id}>
                                                <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{eq.id}</td>
                                                <td style={{ fontWeight: 700, color: "#fff" }}>{eq.name}</td>
                                                <td>{eq.type}</td>
                                                <td>
                                                    {eq.status === "OK" && <span className="badge badge-green">Operational</span>}
                                                    {eq.status === "NEEDS_MAINTENANCE" && <span className="badge badge-yellow">Needs Service</span>}
                                                    {eq.status === "BROKEN" && <span className="badge badge-red">Out of Order</span>}
                                                </td>
                                                <td style={{ color: eq.urgent ? "var(--red)" : "inherit", fontWeight: eq.urgent ? 600 : 400 }}>
                                                    {eq.nextService}
                                                </td>
                                                <td>
                                                    {actioned === eq.id ? (
                                                        <button disabled style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--green)", padding: "6px 12px", borderRadius: 6, fontSize: 11 }}>
                                                            ✓ Request Sent
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleDispatch(eq.id)} style={{ background: eq.urgent ? "var(--red)" : "var(--bg-card)", border: eq.urgent ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--border)", color: eq.urgent ? "#fff" : "var(--text-muted)", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
                                                            {eq.urgent ? "Email Fix-it ↗" : "Log Maintenance"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Equipment Maintenance Tracker</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Manage your restaurant's equipment, set reminders for periodic maintenance, and track repair logs in one place.
                        </p>
                        <button className="btn-primary" onClick={handleAddEquipment}>
                            + Add New Equipment
                        </button>
                    </div>
                )}

            </div>
        </>
    );
}
