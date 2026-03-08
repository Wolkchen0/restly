"use client";
import { useState, useEffect } from "react";

const FORM_TIME_ENTRY = "/forms/time-entry";
const FORM_TIME_OFF = "/forms/time-off";

const STATUS_CLASS: Record<string, string> = {
    PENDING: "badge-yellow", APPROVED: "badge-green", DENIED: "badge-red",
};

const DEMO_REQUESTS = [
    { id: "req1", employeeName: "Sarah Jenkins", employeeRole: "Server", startDate: "2026-03-12", endDate: "2026-03-14", reason: "Family event out of town", status: "PENDING", formSource: 2 },
    { id: "req2", employeeName: "Marcus Torres", employeeRole: "Bartender", startDate: "2026-04-01", endDate: "2026-04-05", reason: "Vacation to Miami", status: "APPROVED", formSource: 2 },
    { id: "req3", employeeName: "David Chen", employeeRole: "Line Cook", startDate: "2026-03-10", endDate: "2026-03-10", reason: "Doctor appointment", status: "DENIED", formSource: 2 },
    { id: "req4", employeeName: "Lisa Park", employeeRole: "Hostess", startDate: "2026-03-08", endDate: "2026-03-08", reason: "Forgot to clock in yesterday morning shift", status: "PENDING", formSource: 1 },
];

export default function SchedulePage() {
    const [data, setData] = useState<any>(null);
    const [localRequests, setLocalRequests] = useState<any[]>([]);
    const [filter, setFilter] = useState("PENDING");
    const [activeTab, setActiveTab] = useState<"timeoff" | "timeentry">("timeoff");
    const [copied, setCopied] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string>("");
    const [isDemo, setIsDemo] = useState(true);

    useEffect(() => {
        const loc = localStorage.getItem("restly_active_location");
        if (loc) setLocationId(loc);

        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                if (restName.toLowerCase() === "meyhouse") {
                    setIsDemo(true);
                    setData({ requests: DEMO_REQUESTS });
                    setLocalRequests(DEMO_REQUESTS);
                } else {
                    setIsDemo(false);
                    fetch("/api/timeoff").then(res => res.json()).then(tData => {
                        setData(tData);
                        setLocalRequests(tData.requests ?? []);
                    });
                }
            })
            .catch(() => { });
    }, []);

    const handleStatusChange = (id: string, newStatus: string) => {
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    const requests = localRequests;

    // Filter by Tab (formSource 1 = Time Entry Fix, 2 = Time Off)
    const tabRequests = requests.filter(r => activeTab === "timeoff" ? r.formSource === 2 : r.formSource === 1);

    // Filter by Status (ALL, PENDING, etc)
    const filtered = filter === "ALL" ? tabRequests : tabRequests.filter(r => r.status === filter);

    function copyLink(url: string, key: string) {
        navigator.clipboard.writeText(url).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
    }

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">📅 Schedule & Time-Off</div>
                <div className="topbar-right">
                    <a href={FORM_TIME_ENTRY} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: 12 }}>🕐 Time Entry Fix ↗</a>
                    <a href={FORM_TIME_OFF} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: 12 }}>🏖️ Time Off Request ↗</a>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
                    <button
                        onClick={() => setActiveTab("timeoff")}
                        style={{
                            background: "none", border: "none", padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            color: activeTab === "timeoff" ? "#E8C96E" : "rgba(255,255,255,0.4)",
                            borderBottom: activeTab === "timeoff" ? "2px solid #C9A84C" : "2px solid transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        🏖️ Time Off Requests
                    </button>
                    <button
                        onClick={() => setActiveTab("timeentry")}
                        style={{
                            background: "none", border: "none", padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            color: activeTab === "timeentry" ? "#E8C96E" : "rgba(255,255,255,0.4)",
                            borderBottom: activeTab === "timeentry" ? "2px solid #C9A84C" : "2px solid transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        🕐 Time Entry Fixes
                    </button>
                </div>
            </div>

            <div className="page-content fade-in">

                {/* HOW IT WORKS EXPLANATION BANNER */}
                <div style={{ background: "rgba(201,168,76, 0.1)", border: "1px solid rgba(201,168,76, 0.25)", padding: "16px 20px", borderRadius: 12, marginBottom: 24, display: "flex", gap: 14 }}>
                    <div style={{ fontSize: 24 }}>✦</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#E8C96E", marginBottom: 4 }}>Restly Native Forms</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                            Employees can now securely submit their time off and fix requests using direct, Restly-branded forms. You don't need Google Forms or Zapier—data instantly flows directly into this dashboard when they click submit.
                        </div>
                    </div>
                </div>

                {isDemo ? (
                    <>
                        <div className="kpi-grid">
                            {[
                                { label: "Pending", icon: "⏳", value: tabRequests.filter(r => r.status === "PENDING").length, color: "var(--yellow)" },
                                { label: "Approved", icon: "✅", value: tabRequests.filter(r => r.status === "APPROVED").length, color: "var(--green)" },
                                { label: "Denied", icon: "❌", value: tabRequests.filter(r => r.status === "DENIED").length, color: "var(--red)" },
                                { label: "Total", icon: "📋", value: tabRequests.length, color: "var(--text-primary)" },
                            ].map(c => (
                                <div key={c.label} className="kpi-card">
                                    <div className="kpi-label">{c.icon} {c.label}</div>
                                    <div className="kpi-value" style={{ color: c.color }}>{c.value ?? "—"}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                            {["ALL", "PENDING", "APPROVED", "DENIED"].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{
                                    fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                    background: filter === f ? "var(--bg-card-hover)" : "var(--bg-card)",
                                    border: `1px solid ${filter === f ? "var(--border-light)" : "var(--border)"}`,
                                    color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                                    fontWeight: filter === f ? 600 : 400,
                                }}>
                                    {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
                                    {f !== "ALL" && <span style={{ marginLeft: 6, background: "var(--bg-secondary)", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "var(--text-muted)" }}>{tabRequests.filter(r => r.status === f).length}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="card">
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th><th>Role</th><th>Start</th><th>End</th>
                                            <th>Days</th><th>Reason</th><th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</td></tr>}
                                        {filtered.length === 0 && data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No {filter.toLowerCase()} requests</td></tr>}
                                        {filtered.map((r: any) => {
                                            const days = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.employeeName}</td>
                                                    <td><span className="badge badge-blue">{r.employeeRole}</span></td>
                                                    <td>{r.startDate}</td><td>{r.endDate}</td>
                                                    <td style={{ fontWeight: 600, color: days > 2 ? "var(--yellow)" : "inherit" }}>{days}d</td>
                                                    <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180 }}>{r.reason}</td>
                                                    <td><span className={`badge ${STATUS_CLASS[r.status]}`}>{r.status}</span></td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            {r.status === "PENDING" ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleStatusChange(r.id, "APPROVED")}
                                                                        style={{ fontSize: 11, padding: "5px 10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)", borderRadius: 6, cursor: "pointer" }}>✓ Approve</button>
                                                                    <button
                                                                        onClick={() => handleStatusChange(r.id, "DENIED")}
                                                                        style={{ fontSize: 11, padding: "5px 10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: 6, cursor: "pointer" }}>✗ Deny</button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleStatusChange(r.id, "PENDING")}
                                                                    style={{ fontSize: 11, padding: "5px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", borderRadius: 6, cursor: "pointer" }}>↩ Undo</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Schedule System Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            Sync your 7shifts, Homebase, or other scheduling software to automatically approve requests based on staffing levels.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Go to Integrations
                        </button>
                    </div>
                )}

                {/* Form links */}
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <span className="card-title">📨 Employee Submission Forms</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Copy link and send to staff</span>
                    </div>
                    <div className="card-body">
                        <div className="grid-2">
                            {[
                                { key: "entry", icon: "🕐", title: "Time Entry Fix Request", desc: "For correcting clock-in/out errors", path: FORM_TIME_ENTRY },
                                { key: "off", icon: "🏖️", title: "Time Off Request", desc: "For vacation, sick days & personal time", path: FORM_TIME_OFF },
                            ].map(f => {
                                const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${f.path}?locId=${locationId}` : `${f.path}?locId=${locationId}`;
                                return (
                                    <div key={f.key} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                            <span style={{ fontSize: 28 }}>{f.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11, background: "var(--bg-card)", padding: "8px 12px", borderRadius: 8, marginBottom: 14, wordBreak: "break-all", fontFamily: "monospace", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                            {fullUrl}
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <a href={fullUrl} target="_blank" rel="noopener" className="btn-primary" style={{ fontSize: 12, textDecoration: "none" }}>Open Form ↗</a>
                                            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => copyLink(fullUrl, f.key)}>
                                                {copied === f.key ? "✓ Copied!" : "📋 Copy Link"}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
