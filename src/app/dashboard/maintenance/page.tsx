"use client";
import { useState, useEffect } from "react";

const EQUIPMENT = [
    { id: "EQ-1", name: "Walk-in Cooler (Main)", type: "Refrigeration", nextService: "2026-05-15", status: "OK", urgent: false },
    { id: "EQ-2", name: "Hobart Dishwasher", type: "Cleanup", nextService: "2026-03-10", status: "NEEDS_MAINTENANCE", urgent: true },
    { id: "EQ-3", name: "Pitco Fryer #2", type: "Cooking", nextService: "2026-03-08", status: "BROKEN", urgent: true },
    { id: "EQ-4", name: "Ice Machine (Bar)", type: "Refrigeration", nextService: "2026-06-01", status: "OK", urgent: false },
];

export default function MaintenancePage() {
    const [actioned, setActioned] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(true);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(restName.toLowerCase() === "meyhouse");
            })
            .catch(() => { });
    }, []);

    const handleDispatch = (id: string) => {
        setActioned(id);
        setTimeout(() => setActioned(null), 3000);
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">🔧 Equipment & Maintenance</div>
                <div className="topbar-right">
                    <button className="btn-primary">+ Add Equipment</button>
                    <button className="btn-secondary">Service Providers</button>
                </div>
            </div>

            <div className="page-content fade-in">

                {isDemo ? (
                    <>
                        {/* AI ALERT */}
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 16, padding: "20px", marginBottom: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div style={{ fontSize: 24 }}>🚨</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Critical Systems Alert</div>
                                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                    <strong>Pitco Fryer #2</strong> was marked broke by Charlie at 11:30 AM today. <strong>Hobart Dishwasher</strong> is past its scheduled maintenance date. Do you want to automatically dispatch emails to "Elite Tech Services"?
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <button className="btn-primary" style={{ fontSize: 12, padding: "6px 16px" }}>Dispatch Technician via Email ↗</button>
                                </div>
                            </div>
                        </div>

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
                                        {EQUIPMENT.map(eq => (
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
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Equipment Maintenance Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Please integrate your facility management systems or add your first piece of equipment to begin tracking asset health and scheduling maintenance.
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
