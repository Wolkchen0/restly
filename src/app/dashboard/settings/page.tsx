"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RestaurantProfile {
    id: string; name: string; email: string; plan: string;
    location: string; primaryColor: string; openaiKey: string;
    trialEndsAt: string; createdAt: string;
}

const INPUT_STYLE = {
    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "var(--text-primary)", outline: "none",
    width: "100%", fontFamily: "inherit",
};

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<RestaurantProfile | null>(null);
    const [form, setForm] = useState({ name: "", location: "", primaryColor: "#C9A84C", openaiKey: "" });
    const [opentable, setOpentable] = useState({ clientId: "", clientSecret: "", restaurantId: "" });
    const [toast, setToast] = useState({ apiKey: "", restaurantGuid: "" });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/restaurant").then(r => r.json()).then((d: RestaurantProfile) => {
            setProfile(d);
            setForm({ name: d.name, location: d.location ?? "", primaryColor: d.primaryColor, openaiKey: d.openaiKey ?? "" });
        });
    }, []);

    async function saveProfile() {
        setSaving(true);
        await fetch("/api/restaurant", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setSaving(false); setSaved("profile");
        setTimeout(() => setSaved(null), 2500);
        router.refresh();
    }

    async function saveKeys(section: "openai" | "opentable" | "toast") {
        setSaving(true);
        const data: Record<string, string> = {};
        if (section === "openai") data.openaiKey = form.openaiKey;
        if (section === "opentable") {
            data.opentableClientId = opentable.clientId;
            data.opentableClientSecret = opentable.clientSecret;
            data.opentableRestaurantId = opentable.restaurantId;
        }
        if (section === "toast") {
            data.toastApiKey = toast.apiKey;
            data.toastRestaurantGuid = toast.restaurantGuid;
        }
        await fetch("/api/restaurant", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        setSaving(false); setSaved(section);
        setTimeout(() => setSaved(null), 2500);
    }

    const trialDays = profile?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / 86400000))
        : 0;

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">⚙️ Settings</div>
                <div className="topbar-right">
                    {profile && (
                        <span className={`badge ${profile.plan === "trial" ? "badge-yellow" : "badge-green"}`}>
                            {profile.plan === "trial" ? `⏳ Trial — ${trialDays} days left` : `✦ ${profile.plan}`}
                        </span>
                    )}
                </div>
            </div>

            <div className="page-content fade-in">
                {/* ── RESTAURANT PROFILE ── */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><span className="card-title">🏪 Restaurant Profile</span></div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="grid-2">
                            <div>
                                <label className="form-label">Restaurant Name</label>
                                <input style={INPUT_STYLE} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Meyhouse" />
                            </div>
                            <div>
                                <label className="form-label">Location</label>
                                <input style={INPUT_STYLE} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Los Angeles, CA" />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Account Email <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(read-only)</span></label>
                            <input style={{ ...INPUT_STYLE, opacity: 0.6, cursor: "not-allowed" }} value={profile?.email ?? ""} readOnly />
                        </div>
                        <div>
                            <label className="form-label">Sidebar Accent Color</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                                    style={{ width: 48, height: 40, border: "1px solid var(--border)", borderRadius: 8, background: "none", cursor: "pointer" }} />
                                <code style={{ fontSize: 13, color: "var(--text-muted)" }}>{form.primaryColor}</code>
                            </div>
                        </div>
                        <div>
                            <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ width: "fit-content" }}>
                                {saved === "profile" ? "✓ Saved!" : saving ? "Saving…" : "Save Profile"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── OPENAI ── */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <span className="card-title">🤖 OpenAI API Key</span>
                        <span className={`badge ${form.openaiKey ? "badge-green" : "badge-yellow"}`}>
                            {form.openaiKey ? "✓ Configured" : "⏳ Using Default"}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>💡</span>
                            <div>Go to <strong>platform.openai.com → API Keys</strong> to create your own key. Using your own key = unlimited AI queries with your own billing.</div>
                        </div>
                        <label className="form-label">Your OpenAI API Key</label>
                        <input
                            style={{ ...INPUT_STYLE, marginBottom: 14, fontFamily: "monospace", letterSpacing: 1 }}
                            type="password" value={form.openaiKey} placeholder="sk-proj-..."
                            onChange={e => setForm(f => ({ ...f, openaiKey: e.target.value }))}
                        />
                        <button onClick={() => saveKeys("openai")} className="btn-primary" style={{ width: "fit-content" }}>
                            {saved === "openai" ? "✓ Saved!" : "Save API Key"}
                        </button>
                    </div>
                </div>

                {/* ── OPENTABLE ── */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <span className="card-title">🍽️ OpenTable Integration</span>
                        <span className="badge badge-yellow">⏳ Demo Mode</span>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>📋</span>
                            <div>
                                <strong>How to get credentials:</strong>
                                <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                                    <li>Log in to <strong>restaurant.opentable.com</strong></li>
                                    <li>Go to <strong>Settings → Integrations → API Access</strong></li>
                                    <li>Click <strong>"Generate New Credentials"</strong></li>
                                    <li>Copy Client ID, Client Secret, and Restaurant ID here</li>
                                </ol>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Client ID", key: "clientId", ph: "ot-client-xxxx" },
                                { label: "Client Secret", key: "clientSecret", ph: "ot-secret-xxxx" },
                                { label: "Restaurant ID", key: "restaurantId", ph: "12345" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="form-label">{f.label}</label>
                                    <input
                                        style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
                                        type="password" placeholder={f.ph}
                                        value={(opentable as any)[f.key]}
                                        onChange={e => setOpentable(o => ({ ...o, [f.key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <button onClick={() => saveKeys("opentable")} className="btn-primary" style={{ width: "fit-content", marginTop: 4 }}>
                                {saved === "opentable" ? "✓ Saved!" : "Connect OpenTable"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── TOAST ── */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <span className="card-title">🍞 Toast POS Integration</span>
                        <span className="badge badge-yellow">⏳ Demo Mode</span>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>📋</span>
                            <div>
                                <strong>How to get credentials:</strong>
                                <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                                    <li>Log in to your <strong>Toast Back Office</strong> (pos.toasttab.com)</li>
                                    <li>Go to <strong>Settings → Integrations → API Access</strong></li>
                                    <li>Click <strong>"Create New API Key"</strong> — select <em>Inventory Read</em> scope</li>
                                    <li>Copy API Key and Restaurant GUID here</li>
                                </ol>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[
                                { label: "Toast API Key", key: "apiKey", ph: "toast-api-xxxx" },
                                { label: "Restaurant GUID", key: "restaurantGuid", ph: "xxxxxxxx-xxxx-xxxx" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="form-label">{f.label}</label>
                                    <input
                                        style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
                                        type="password" placeholder={f.ph}
                                        value={(toast as any)[f.key]}
                                        onChange={e => setToast(t => ({ ...t, [f.key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <button onClick={() => saveKeys("toast")} className="btn-primary" style={{ width: "fit-content", marginTop: 4 }}>
                                {saved === "toast" ? "✓ Saved!" : "Connect Toast POS"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CCPA + GO-LIVE ── */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">🔒 CCPA/CPRA & Go-Live Checklist</span>
                        <span className="badge badge-green">✓ Compliant</span>
                    </div>
                    <div className="card-body">
                        {[
                            { done: true, text: "Account created & AI chatbot active" },
                            { done: !!form.openaiKey, text: "Custom OpenAI API key configured" },
                            { done: !!opentable.clientId, text: "OpenTable credentials connected" },
                            { done: !!toast.apiKey, text: "Toast POS credentials connected" },
                            { done: true, text: "Google Forms for time-off configured" },
                            { done: false, text: "Deploy to Vercel with custom domain" },
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                                    background: item.done ? "rgba(34,197,94,0.12)" : "var(--bg-secondary)",
                                    border: `1px solid ${item.done ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                                    color: item.done ? "var(--green)" : "var(--text-muted)",
                                }}>
                                    {item.done ? "✓" : String(i + 1)}
                                </div>
                                <span style={{ fontSize: 14, color: item.done ? "var(--text-secondary)" : "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
