"use client";
import { useState, useEffect } from "react";

const INITIAL_LOGS = [
    { id: 1, date: "2026-03-05", shift: "AM", manager: "Sarah J.", notes: "Health inspector dropped by, everything passed (98/100). Need to order more degreaser. Slow lunch, about $1400 total.", tags: ["Audit", "Slow"] },
    { id: 2, date: "2026-03-05", shift: "PM", manager: "Mark T.", notes: "Bar was slammed due to the game. Ran out of draft IPA by 9 PM. Fire alarm tripped for 1 minute because grill hood wasn't switched on high. Total sales: $8,500.", tags: ["Busy", "Inventory Incident"] },
    { id: 3, date: "2026-03-11", shift: "AM", manager: "Sarah J.", notes: "The Hobart Dishwasher is acting up again, it's making a loud noise and not draining. Might be broken.", tags: ["Maintenance", "Urgent"] },
];

const INITIAL_EQUIPMENT = [
    { id: "EQ-1", name: "Walk-in Cooler (Main)", type: "Refrigeration", nextService: "2026-05-15", status: "OK", urgent: false, model: "Kolpak QS7-1010-FT", serial: "KP-2023-44891", warranty: "2027-08-15", phone: "+1 (800) 555-2671", email: "service@kolpak.com", installer: "CoolTech HVAC", notes: "Last filter replaced Jan 2026. Runs at 34F avg." },
    { id: "EQ-2", name: "Hobart Dishwasher", type: "Cleanup", nextService: "2026-03-10", status: "NEEDS_MAINTENANCE", urgent: true, model: "Hobart AM15-6", serial: "HB-2024-77342", warranty: "2028-01-20", phone: "+1 (800) 555-4482", email: "support@hobartservice.com", installer: "ProKitchen Installs", notes: "Making loud noise, not draining properly. Last serviced Dec 2025." },
    { id: "EQ-3", name: "Pitco Fryer #2", type: "Cooking", nextService: "2026-03-08", status: "BROKEN", urgent: true, model: "Pitco SSH75R", serial: "PT-2022-55190", warranty: "Expired (2025-06)", phone: "+1 (800) 555-9103", email: "repair@pitcofryer.com", installer: "Kitchen Pros LLC", notes: "Thermostat failure. Oil not heating past 280F. Needs replacement part." },
    { id: "EQ-4", name: "Ice Machine (Bar)", type: "Refrigeration", nextService: "2026-06-01", status: "OK", urgent: false, model: "Manitowoc IYT0620A", serial: "MW-2024-33215", warranty: "2028-04-10", phone: "+1 (800) 555-7744", email: "service@manitowoc.com", installer: "CoolTech HVAC", notes: "Produces 575 lbs/day. Last descaled Feb 2026." },
];

export default function MaintenancePage() {
    const [actioned, setActioned] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(true);
    const [equipmentList, setEquipmentList] = useState(INITIAL_EQUIPMENT);
    const [aiDispatched, setAiDispatched] = useState(false);
    const [expandedEq, setExpandedEq] = useState<string | null>(null);

    // Modal State
    const [eqModalOpen, setEqModalOpen] = useState(false);
    const [editingEqId, setEditingEqId] = useState<string | null>(null);
    const [newEqName, setNewEqName] = useState("");
    const [newEqType, setNewEqType] = useState("Custom");
    const [newEqModel, setNewEqModel] = useState("");
    const [newEqSerial, setNewEqSerial] = useState("");
    const [newEqWarranty, setNewEqWarranty] = useState("");
    const [newEqPhone, setNewEqPhone] = useState("");
    const [newEqEmail, setNewEqEmail] = useState("");
    const [newEqInstaller, setNewEqInstaller] = useState("");
    const [newEqNotes, setNewEqNotes] = useState("");
    const [hasReminder, setHasReminder] = useState(false);
    const [reminderPeriod, setReminderPeriod] = useState("monthly");
    const [monthlyDay, setMonthlyDay] = useState("1");

    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [detectedIssues, setDetectedIssues] = useState<string[]>([]);
    const [confirmDeleteEq, setConfirmDeleteEq] = useState<{ id: string; name: string } | null>(null);

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
        setEditingEqId(null);
        setNewEqName(""); setNewEqType("Custom"); setNewEqModel(""); setNewEqSerial("");
        setNewEqWarranty(""); setNewEqPhone(""); setNewEqEmail("");
        setNewEqInstaller(""); setNewEqNotes("");
        setHasReminder(false);
        setEqModalOpen(true);
    };

    const handleEditEquipment = (eqId: string) => {
        const eq = equipmentList.find(e => e.id === eqId);
        if (!eq) return;
        setEditingEqId(eqId);
        setNewEqName(eq.name); setNewEqType(eq.type); setNewEqModel(eq.model);
        setNewEqSerial(eq.serial); setNewEqWarranty(eq.warranty);
        setNewEqPhone(eq.phone); setNewEqEmail(eq.email);
        setNewEqInstaller(eq.installer); setNewEqNotes(eq.notes);
        setHasReminder(false);
        setEqModalOpen(true);
    };

    const handleDeleteEquipment = (eqId: string) => {
        setEquipmentList(prev => prev.filter(e => e.id !== eqId));
        setExpandedEq(null);
        showToast("Equipment removed.");
    };

    const confirmAddEquipment = () => {
        if (!newEqName.trim()) return;
        if (editingEqId) {
            // Editing existing
            setEquipmentList(prev => prev.map(eq => eq.id === editingEqId ? {
                ...eq,
                name: newEqName, type: newEqType, model: newEqModel,
                serial: newEqSerial, warranty: newEqWarranty,
                phone: newEqPhone, email: newEqEmail,
                installer: newEqInstaller, notes: newEqNotes,
                nextService: hasReminder ? `Next ${reminderPeriod} (Day ${monthlyDay})` : eq.nextService,
            } : eq));
            showToast("Equipment updated.");
        } else {
            // Adding new
            const newEq = {
                id: `EQ-${equipmentList.length + 1}`,
                name: newEqName, type: newEqType,
                nextService: hasReminder ? `Next ${reminderPeriod} (Day ${monthlyDay})` : "Not Set",
                status: "OK", urgent: false,
                model: newEqModel, serial: newEqSerial, warranty: newEqWarranty,
                phone: newEqPhone, email: newEqEmail,
                installer: newEqInstaller, notes: newEqNotes,
            };
            setEquipmentList([...equipmentList, newEq]);
            showToast("Equipment added.");
        }
        setEqModalOpen(false);
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

            {/* CONFIRM DELETE MODAL */}
            {confirmDeleteEq && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmDeleteEq(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(180deg, #141424 0%, #0e0e1c 100%)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "28px 32px", width: "min(400px, 85vw)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 22 }}>⚠️</span> Remove Equipment
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>
                            Remove <strong style={{ color: "#fff" }}>{confirmDeleteEq.name}</strong> from equipment list? This cannot be undone.
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setConfirmDeleteEq(null)} style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={() => { handleDeleteEquipment(confirmDeleteEq.id); setConfirmDeleteEq(null); }} style={{ flex: 1, padding: "12px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.9))", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM MODAL */}
            {eqModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(8px)" }}>
                    <div className="card" style={{ width: 520, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#fff" }}>{editingEqId ? "Edit Equipment" : "Add New Equipment"}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>EQUIPMENT NAME *</label>
                                <input autoFocus type="text" value={newEqName} onChange={e => setNewEqName(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="e.g. Dishwasher, Oven..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>CATEGORY</label>
                                <select value={newEqType} onChange={e => setNewEqType(e.target.value)}
                                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}>
                                    <option value="Cooking">Cooking</option>
                                    <option value="Refrigeration">Refrigeration</option>
                                    <option value="Cleanup">Cleanup</option>
                                    <option value="HVAC">HVAC</option>
                                    <option value="Custom">Other</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>MODEL</label>
                                <input type="text" value={newEqModel} onChange={e => setNewEqModel(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="Model number" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>SERIAL NUMBER</label>
                                <input type="text" value={newEqSerial} onChange={e => setNewEqSerial(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="Serial #" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>WARRANTY EXPIRY</label>
                                <input type="date" value={newEqWarranty} onChange={e => setNewEqWarranty(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>INSTALLED BY</label>
                                <input type="text" value={newEqInstaller} onChange={e => setNewEqInstaller(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="Company name" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>PHONE</label>
                                <input type="tel" value={newEqPhone} onChange={e => setNewEqPhone(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="+1 (800) 555-0000" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>EMAIL</label>
                                <input type="email" value={newEqEmail} onChange={e => setNewEqEmail(e.target.value)}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    placeholder="service@company.com" />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>NOTES</label>
                            <textarea value={newEqNotes} onChange={e => setNewEqNotes(e.target.value)} rows={3}
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                                placeholder="Service notes, maintenance history..." />
                        </div>

                        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasReminder ? 16 : 0 }}>
                                <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>Enable Periodic Reminder?</span>
                                <input type="checkbox" checked={hasReminder} onChange={e => setHasReminder(e.target.checked)}
                                    style={{ width: 20, height: 20, accentColor: 'var(--purple)' }} />
                            </div>
                            {hasReminder && (
                                <div className="fade-in">
                                    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>FREQUENCY</label>
                                    <select value={reminderPeriod} onChange={e => setReminderPeriod(e.target.value)}
                                        style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 14, marginBottom: 12 }}>
                                        <option value="daily">Every Day</option>
                                        <option value="weekly">Every Week</option>
                                        <option value="monthly">Every Month</option>
                                        <option value="yearly">Every Year</option>
                                    </select>
                                    {reminderPeriod === "monthly" && (
                                        <>
                                            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>DAY OF MONTH</label>
                                            <input type="number" min="1" max="31" value={monthlyDay} onChange={e => setMonthlyDay(e.target.value)}
                                                style={{ width: "100%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 8, fontSize: 14 }} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setEqModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmAddEquipment}>{editingEqId ? "Save Changes" : "Save Equipment"}</button>
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipmentList.map(eq => (
                                            <>
                                                <tr key={eq.id} onClick={() => setExpandedEq(expandedEq === eq.id ? null : eq.id)} style={{ cursor: "pointer", transition: "background 0.15s", background: expandedEq === eq.id ? "rgba(201,168,76,0.05)" : "transparent" }}>
                                                    <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{eq.id}</td>
                                                    <td style={{ fontWeight: 700, color: "#fff" }}>
                                                        <span style={{ marginRight: 6, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{expandedEq === eq.id ? "▼" : "▶"}</span>
                                                        {eq.name}
                                                    </td>
                                                    <td>{eq.type}</td>
                                                    <td>
                                                        {eq.status === "OK" && <span className="badge badge-green">Operational</span>}
                                                        {eq.status === "NEEDS_MAINTENANCE" && <span className="badge badge-yellow">Needs Service</span>}
                                                        {eq.status === "BROKEN" && <span className="badge badge-red">Out of Order</span>}
                                                    </td>
                                                    <td style={{ color: eq.urgent ? "var(--red)" : "inherit", fontWeight: eq.urgent ? 600 : 400 }}>
                                                        {eq.nextService}
                                                    </td>
                                                </tr>
                                                {expandedEq === eq.id && (
                                                    <tr key={`${eq.id}-detail`}>
                                                        <td colSpan={5} style={{ padding: 0, border: "none" }}>
                                                            <div style={{ padding: "16px 24px 20px", background: "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Model</div>
                                                                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{eq.model || "—"}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Serial Number</div>
                                                                        <div style={{ fontSize: 13, color: "#fff", fontFamily: "monospace" }}>{eq.serial || "—"}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Warranty</div>
                                                                        <div style={{ fontSize: 13, color: eq.warranty?.includes("Expired") ? "var(--red)" : "var(--green)", fontWeight: 600 }}>{eq.warranty || "—"}</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Service Phone</div>
                                                                        <div style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>{eq.phone || "Not set"}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Service Email</div>
                                                                        <div style={{ fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>{eq.email || "Not set"}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Installed By</div>
                                                                        <div style={{ fontSize: 13, color: "#fff" }}>{eq.installer || "—"}</div>
                                                                    </div>
                                                                </div>
                                                                {eq.notes && (
                                                                    <div style={{ marginBottom: 16 }}>
                                                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Notes</div>
                                                                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>{eq.notes}</div>
                                                                    </div>
                                                                )}
                                                                {/* ACTION BUTTONS */}
                                                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleEditEquipment(eq.id); }}
                                                                        style={{ padding: "8px 18px", fontSize: 12, fontWeight: 700, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, color: "#60a5fa", cursor: "pointer", fontFamily: "inherit" }}>
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteEq({ id: eq.id, name: eq.name }); }}
                                                                        style={{ padding: "8px 18px", fontSize: 12, fontWeight: 700, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#f87171", cursor: "pointer", fontFamily: "inherit" }}>
                                                                        🗑 Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
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
