"use client";
import { useState, useEffect } from "react";

const FORM_TIME_ENTRY = "https://docs.google.com/forms/d/e/1FAIpQLSfyZjvuMiBSiO2PV3HCmFZGVZ1wdDC-C3GzP7mroYIOPUgd8w/viewform";
const FORM_TIME_OFF = "https://docs.google.com/forms/d/e/1FAIpQLSc9KBEglmGSeyIkv0pN5byJyslGBzAstYHe9Cq6fykglkhO8Q/viewform";

const STATUS_CLASS: Record<string, string> = {
    PENDING: "badge-yellow", APPROVED: "badge-green", DENIED: "badge-red",
};

export default function SchedulePage() {
    const [data, setData] = useState<any>(null);
    const [filter, setFilter] = useState("PENDING");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => { fetch("/api/timeoff").then(r => r.json()).then(setData); }, []);

    const requests: any[] = data?.requests ?? [];
    const filtered = filter === "ALL" ? requests : requests.filter(r => r.status === filter);

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

            <div className="page-content fade-in">
                <div className="kpi-grid">
                    {[
                        { label: "Pending", icon: "⏳", value: data?.stats?.pending, color: "var(--yellow)" },
                        { label: "Approved", icon: "✅", value: data?.stats?.approved, color: "var(--green)" },
                        { label: "Denied", icon: "❌", value: data?.stats?.denied, color: "var(--red)" },
                        { label: "Total", icon: "📋", value: data?.stats?.total, color: "var(--text-primary)" },
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
                            {f !== "ALL" && <span style={{ marginLeft: 6, background: "var(--bg-secondary)", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "var(--text-muted)" }}>{requests.filter(r => r.status === f).length}</span>}
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
                                    {filter === "PENDING" && <th>Actions</th>}
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
                                            {filter === "PENDING" && (
                                                <td>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button style={{ fontSize: 11, padding: "5px 10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)", borderRadius: 6, cursor: "pointer" }}>✓ Approve</button>
                                                        <button style={{ fontSize: 11, padding: "5px 10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: 6, cursor: "pointer" }}>✗ Deny</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form links */}
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <span className="card-title">📨 Employee Submission Forms</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Copy link and send to staff</span>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info" style={{ marginBottom: 20 }}>
                            <span>💡</span>
                            <div><strong>How employees submit:</strong> Send them the link via text, email, or Slack. They open on any device — no account needed.</div>
                        </div>
                        <div className="grid-2">
                            {[
                                { key: "entry", icon: "🕐", title: "Time Entry Fix Request", desc: "For correcting clock-in/out errors", url: FORM_TIME_ENTRY },
                                { key: "off", icon: "🏖️", title: "Time Off Request", desc: "For vacation, sick days & personal time", url: FORM_TIME_OFF },
                            ].map(f => (
                                <div key={f.key} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        <span style={{ fontSize: 28 }}>{f.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, background: "var(--bg-card)", padding: "8px 12px", borderRadius: 8, marginBottom: 14, wordBreak: "break-all", fontFamily: "monospace", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                        {f.url}
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <a href={f.url} target="_blank" rel="noopener" className="btn-primary" style={{ fontSize: 12, textDecoration: "none" }}>Open Form ↗</a>
                                        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => copyLink(f.url, f.key)}>
                                            {copied === f.key ? "✓ Copied!" : "📋 Copy Link"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
