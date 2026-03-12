"use client";
import { useState, useEffect } from "react";

const POS_OPTIONS = [
    { id: "toast", name: "Toast POS", emoji: "🍞", color: "#FF6B35", helpUrl: "https://doc.toasttab.com/doc/devguide/devApiAccessCredentials.html", helpText: "Toast Web → Integrations → Toast API access → Manage credentials → Create credentials → Copy clientId & clientSecret. Requires Toast RMS Essentials plan.", fields: [{ key: "posApiKey", label: "Client ID", placeholder: "Enter Toast Client ID" }, { key: "posSecretKey", label: "Client Secret", placeholder: "Enter Toast Client Secret" }, { key: "posLocationId", label: "Restaurant GUID", placeholder: "e.g. abc123-def456-..." }] },
    { id: "clover", name: "Clover", emoji: "🍀", color: "#1DA462", helpUrl: "https://docs.clover.com/docs/generate-a-test-api-token", helpText: "Clover Merchant Dashboard → Settings → API Tokens → Create new token → Select permissions → Copy token & Merchant ID from URL.", fields: [{ key: "posApiKey", label: "API Token", placeholder: "Enter Clover API Token" }, { key: "posLocationId", label: "Merchant ID", placeholder: "e.g. ABCD1234EFGH" }] },
    { id: "square", name: "Square", emoji: "⬛", color: "#3E4348", helpUrl: "https://developer.squareup.com/apps", helpText: "Sign in at developer.squareup.com → Create App → Credentials tab → Switch to Production → Copy Access Token. Location ID is in Square Dashboard → Locations.", fields: [{ key: "posApiKey", label: "Access Token", placeholder: "Enter Square Access Token" }, { key: "posLocationId", label: "Location ID", placeholder: "e.g. LKFQ8BKFQ8BK..." }] },
    { id: "lightspeed", name: "Lightspeed", emoji: "⚡", color: "#005EB8", helpUrl: "https://developers.lightspeedhq.com/restaurant/authentication/authentication-overview/", helpText: "Lightspeed Developer Portal → Register → Create API Client → Copy Client ID & Secret. Requires approved partner or merchant access.", fields: [{ key: "posApiKey", label: "Client ID", placeholder: "Enter Client ID" }, { key: "posSecretKey", label: "Client Secret", placeholder: "Enter Client Secret" }] },
    { id: "revel", name: "Revel Systems", emoji: "🔴", color: "#C41A1A", helpUrl: "https://developer.revelsystems.com/", helpText: "Contact Revel support to request API credentials → Receive Client ID & Client Secret via email → Use Establishment ID from Revel Management Console.", fields: [{ key: "posApiKey", label: "API Key", placeholder: "Enter API Key" }, { key: "posSecretKey", label: "API Secret", placeholder: "Enter API Secret" }, { key: "posLocationId", label: "Establishment ID", placeholder: "Enter ID" }] },
    { id: "manual", name: "Manual / CSV", emoji: "📋", color: "#6B7280", helpUrl: "", helpText: "", fields: [] },
];

const TIMEZONES = [
    { value: "America/Los_Angeles", label: "Pacific (LA)" },
    { value: "America/Denver", label: "Mountain (Denver)" },
    { value: "America/Chicago", label: "Central (Chicago)" },
    { value: "America/New_York", label: "Eastern (New York)" },
];

interface LocationData {
    id: string;
    name: string;
    address?: string;
    city?: string;
    timezone: string;
    isDefault: boolean;
    isActive: boolean;
    posProvider?: string;
    googleBusinessToken?: boolean;
    yelpApiKey?: boolean;
    opentableRestaurantId?: boolean;
    instagramToken?: boolean;
    facebookToken?: boolean;
    tiktokToken?: boolean;
    xToken?: boolean;
}

interface EditState {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    timezone?: string;
    isDefault?: boolean;
    posApiKey?: string;
    posSecretKey?: string;
    posLocationId?: string;
    opentableClientId?: string;
    opentableClientSecret?: string;
    opentableRestaurantId?: string;
    xToken?: string;
}

interface RestaurantInfo {
    restaurantName: string;
    plan: string;
}

export default function SettingsPage() {
    const [info, setInfo] = useState<RestaurantInfo>({ restaurantName: "", plan: "trial" });
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [activeLocId, setActiveLocId] = useState<string>("");
    const [editLoc, setEditLoc] = useState<EditState>({});
    const [selectedPOS, setSelectedPOS] = useState<string>("manual");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [addingLoc, setAddingLoc] = useState(false);
    const [newLocName, setNewLocName] = useState("");
    const [newLocCity, setNewLocCity] = useState("");
    const [tab, setTab] = useState<"locations" | "brand" | "plan">("locations");
    const [connectedApps, setConnectedApps] = useState<string[]>([]);
    const [connectingApp, setConnectingApp] = useState<string | null>(null);
    const [posStatus, setPosStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [posMessage, setPosMessage] = useState("");

    const [connectModalApp, setConnectModalApp] = useState<{ name: string, keyName: string } | null>(null);
    const [connectToken, setConnectToken] = useState("");
    const [disconnectModalApp, setDisconnectModalApp] = useState<{ name: string, keyName: string } | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string, type: "success" | "error" } | null>(null);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleConnectApp = (appName: string, keyName: string) => {
        setConnectToken("");
        setConnectModalApp({ name: appName, keyName });
    };

    const confirmConnectApp = async () => {
        if (!connectModalApp) return;
        const appName = connectModalApp.name;
        const keyName = connectModalApp.keyName;

        if (!connectToken.trim()) {
            showToast("Connection cancelled. A valid token is required.", "error");
            setConnectModalApp(null);
            return;
        }

        setConnectModalApp(null);
        setConnectingApp(appName);

        try {
            const res = await fetch("/api/locations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId: activeLocId,
                    [keyName]: connectToken
                })
            });

            if (res.ok) {
                setConnectedApps(prev => prev.includes(appName) ? prev : [...prev, appName]);
                showToast(`${appName} connected successfully!`);
            } else {
                showToast(`Failed to connect ${appName}.`, "error");
            }
        } catch (e) {
            showToast(`Failed to save ${appName} token. Verify database connection.`, "error");
        } finally {
            setConnectingApp(null);
        }
    };

    const handleDisconnectApp = (appName: string, keyName: string) => {
        setDisconnectModalApp({ name: appName, keyName });
    };

    const confirmDisconnectApp = async () => {
        if (!disconnectModalApp) return;
        const appName = disconnectModalApp.name;
        const keyName = disconnectModalApp.keyName;

        setDisconnectModalApp(null);

        try {
            const res = await fetch("/api/locations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId: activeLocId,
                    [keyName]: null
                })
            });
            if (res.ok) {
                setConnectedApps(prev => prev.filter(app => app !== appName));
                showToast(`${appName} disconnected successfully.`);
            } else {
                showToast(`Failed to disconnect ${appName}.`, "error");
            }
        } catch (e) {
            showToast(`Failed to disconnect ${appName}.`, "error");
        }
    };



    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                if (d.locations?.length) {
                    setInfo({ restaurantName: d.restaurantName || "", plan: d.plan || "trial" });
                    setLocations(d.locations);
                    const saved = localStorage.getItem("restly_active_location");
                    const def = d.locations.find((l: LocationData) => l.id === saved)
                        || d.locations.find((l: LocationData) => l.isDefault)
                        || d.locations[0];
                    selectLocation(def);
                }
            })
            .catch(() => { });

    }, []);

    const selectLocation = (loc: LocationData) => {
        setActiveLocId(loc.id);
        setEditLoc({ id: loc.id, name: loc.name, address: loc.address || "", city: loc.city || "", timezone: loc.timezone });
        setSelectedPOS(loc.posProvider || "manual");

        // Sync Connected Apps visually based on actual database boolean flags
        const connected = [];
        if (loc.googleBusinessToken) connected.push("Google Business");
        if (loc.yelpApiKey) connected.push("Yelp");
        if (loc.opentableRestaurantId) connected.push("OpenTable"); // Check any OpenTable field
        if (loc.instagramToken) connected.push("Instagram");
        if (loc.facebookToken) connected.push("Facebook");
        if (loc.tiktokToken) connected.push("TikTok");
        if (loc.xToken) connected.push("X");
        setConnectedApps(connected);
    };

    const handleSaveLocation = async () => {
        setSaving(true);
        const payload = {
            locationId: activeLocId,
            posProvider: selectedPOS === "manual" ? null : selectedPOS,
            name: editLoc.name,
            address: editLoc.address,
            city: editLoc.city,
            timezone: editLoc.timezone,
            posApiKey: editLoc.posApiKey,
            posSecretKey: editLoc.posSecretKey,
            posLocationId: editLoc.posLocationId,
            opentableClientId: editLoc.opentableClientId,
            opentableClientSecret: editLoc.opentableClientSecret,
            opentableRestaurantId: editLoc.opentableRestaurantId,
        };
        await fetch("/api/locations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleAddLocation = async () => {
        if (!newLocName.trim()) return;
        const res = await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newLocName, city: newLocCity }),
        });
        if (res.ok) {
            const data = await res.json();
            const newLoc: LocationData = data.location;
            setLocations(prev => [...prev, newLoc]);
            setNewLocName(""); setNewLocCity(""); setAddingLoc(false);
            selectLocation(newLoc);
        }
    };

    const activeLoc = locations.find(l => l.id === activeLocId);
    const posInfo = POS_OPTIONS.find(p => p.id === selectedPOS);

    const planColors: Record<string, string> = {
        trial: "#6B7280", starter: "#3B82F6", pro: "#C9A84C", enterprise: "#8B5CF6",
    };
    const planColor = planColors[info.plan] || "#6B7280";

    return (
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
            <style>{`
        .stab { background:none; border:none; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; color:rgba(255,255,255,0.4); font-family:inherit; transition:all 0.15s; }
        .stab.active { color:#E8C96E; border-bottom-color:#C9A84C; }
        .stab:hover:not(.active) { color:rgba(255,255,255,0.8); }
        .s-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:28px; margin-bottom:20px; }
        .f-label { font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
        .s-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff; outline:none; font-family:inherit; transition:border-color 0.15s; box-sizing:border-box; }
        .s-input:focus { border-color:rgba(201,168,76,0.5); }
        .s-input option { background:#1a1a2e; color:#fff; padding:8px; }
        .btn-gold { background:linear-gradient(135deg,#C9A84C,#E8C96E); color:#1a1000; font-weight:800; font-size:14px; border:none; border-radius:10px; padding:12px 24px; cursor:pointer; font-family:inherit; }
        .btn-ghost { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6); font-size:13px; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 16px; cursor:pointer; font-family:inherit; transition:all 0.15s; }
        .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .pos-opt { border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s; background:rgba(255,255,255,0.02); }
        .pos-opt:hover { border-color:rgba(255,255,255,0.2); }
        .loc-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; transition:background 0.15s; border-left:2px solid transparent; }
        .loc-row:hover { background:rgba(255,255,255,0.04); }
        .loc-row.active { background:rgba(201,168,76,0.06); border-left-color:#C9A84C; }
        @media(max-width:700px){ .loc-edit-grid{ grid-template-columns:1fr !important; } .pos-grid{ grid-template-columns:1fr 1fr !important; } }
      `}</style>

            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10, 10, 15, 0.95)", border: `1px solid ${toastMsg.type === "error" ? "#ef4444" : "#4ade80"}`, color: toastMsg.type === "error" ? "#ef4444" : "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    {toastMsg.type === "error" ? "⚠" : "✓"} {toastMsg.text}
                </div>
            )}

            {connectModalApp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 450, padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#fff" }}>Connect {connectModalApp.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
                            [Production Ready Mode]<br />To connect {connectModalApp.name}, you must provide a valid API Access Token or API Key obtained from the {connectModalApp.name} Developer Portal.
                        </p>
                        <input
                            autoFocus
                            type="text"
                            value={connectToken}
                            onChange={e => setConnectToken(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") confirmConnectApp(); }}
                            style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 20 }}
                            placeholder={`Enter your ${connectModalApp.name} Token`}
                        />
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setConnectModalApp(null)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmConnectApp}>Connect</button>
                        </div>
                    </div>
                </div>
            )}

            {disconnectModalApp && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 400, padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#ef4444" }}>Disconnect {disconnectModalApp.name}?</h3>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 20, lineHeight: 1.5 }}>
                            Are you sure you want to disconnect {disconnectModalApp.name} and delete the API Token? You will need to re-authenticate to sync data.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setDisconnectModalApp(null)}>Cancel</button>
                            <button className="btn-primary" style={{ background: "var(--red)", border: "1px solid var(--red)" }} onClick={confirmDisconnectApp}>Disconnect</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PAGE HEADER ── */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-1px", marginBottom: 4 }}>Settings</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                    Manage locations, POS integrations, and account — <strong style={{ color: "#E8C96E" }}>don't know how? Ask the AI 🤖</strong>
                </p>
            </div>

            {/* ── TABS ── */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 28 }}>
                {(["locations", "brand", "plan"] as const).map(t => (
                    <button key={t} className={`stab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                        {t === "locations" ? "📍 Locations & Integrations" : t === "brand" ? "🏠 Brand" : "💳 Plan"}
                    </button>
                ))}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: LOCATIONS                          */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {
                tab === "locations" && (
                    <div className="loc-edit-grid" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>

                        {/* Left: location list */}
                        <div className="s-card" style={{ padding: 14, height: "fit-content" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                                Your Locations
                            </div>

                            {locations.map(loc => {
                                const n = loc.name.replace(`${info.restaurantName} — `, "").replace(`${info.restaurantName} - `, "");
                                return (
                                    <div
                                        key={loc.id}
                                        className={`loc-row${loc.id === activeLocId ? " active" : ""}`}
                                        onClick={() => selectLocation(loc)}
                                    >
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: loc.id === activeLocId ? "#E8C96E" : "#fff", lineHeight: 1.2 }}>{n}</div>
                                            {loc.city && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{loc.city}</div>}
                                            {loc.posProvider && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{loc.posProvider}</div>}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add location form */}
                            {addingLoc ? (
                                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                                    <input className="s-input" style={{ fontSize: 12, padding: "8px 10px" }} placeholder="Location name *" value={newLocName} onChange={e => setNewLocName(e.target.value)} autoFocus />
                                    <input className="s-input" style={{ fontSize: 12, padding: "8px 10px" }} placeholder="City" value={newLocCity} onChange={e => setNewLocCity(e.target.value)} />
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button className="btn-gold" style={{ flex: 1, fontSize: 12, padding: "8px" }} onClick={handleAddLocation}>Add</button>
                                        <button className="btn-ghost" style={{ fontSize: 12, padding: "8px" }} onClick={() => setAddingLoc(false)}>✕</button>
                                    </div>
                                </div>
                            ) : (
                                <button className="btn-ghost" style={{ width: "100%", marginTop: 10, fontSize: 12 }} onClick={() => setAddingLoc(true)}>
                                    + Add Location
                                </button>
                            )}
                        </div>

                        {/* Right: edit panel */}
                        {activeLoc ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* ── Location Details ── */}
                                <div className="s-card">
                                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 18 }}>📍 Location Details</h2>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <div>
                                            <div className="f-label">Location Name</div>
                                            <input className="s-input" value={editLoc.name || ""} onChange={e => setEditLoc(p => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div>
                                            <div className="f-label">City</div>
                                            <input className="s-input" placeholder="e.g. Los Angeles, CA" value={editLoc.city || ""} onChange={e => setEditLoc(p => ({ ...p, city: e.target.value }))} />
                                        </div>
                                        <div style={{ gridColumn: "1/-1" }}>
                                            <div className="f-label">Address</div>
                                            <input className="s-input" placeholder="Full street address" value={editLoc.address || ""} onChange={e => setEditLoc(p => ({ ...p, address: e.target.value }))} />
                                        </div>
                                        <div>
                                            <div className="f-label">Timezone</div>
                                            <select className="s-input" value={editLoc.timezone || "America/Los_Angeles"} onChange={e => setEditLoc(p => ({ ...p, timezone: e.target.value }))}>
                                                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ── POS Integration ── */}
                                <div className="s-card">
                                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>🔗 POS Integration</h2>
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 18, lineHeight: 1.5 }}>
                                        Connect your Point of Sale for real-time inventory sync and COGS tracking.
                                        <span style={{ color: "#E8C96E", fontWeight: 600 }}> Need help? Click the 🤖 AI button and ask "How do I connect Clover?"</span>
                                    </p>

                                    {/* POS picker */}
                                    <div className="pos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                                        {POS_OPTIONS.map(pos => {
                                            const sel = selectedPOS === pos.id;
                                            return (
                                                <div
                                                    key={pos.id}
                                                    className="pos-opt"
                                                    onClick={() => { setSelectedPOS(pos.id); setPosStatus("idle"); }}
                                                    style={{ borderColor: sel ? pos.color : "rgba(255,255,255,0.08)", background: sel ? `${pos.color}14` : "rgba(255,255,255,0.02)" }}
                                                >
                                                    <span style={{ fontSize: 22, flexShrink: 0 }}>{pos.emoji}</span>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? pos.color : "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>{pos.name}</div>
                                                        {sel && <div style={{ fontSize: 10, color: pos.color, fontWeight: 800, marginTop: 2 }}>Selected ✓</div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Credential fields for selected POS */}
                                    {posInfo && posInfo.fields.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: posInfo.color }}>
                                                    <span>{posInfo.emoji}</span> {posInfo.name} Credentials
                                                </div>
                                                {posInfo.helpUrl && (
                                                    <a
                                                        href={posInfo.helpUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "rgba(96,165,250,0.08)", borderRadius: 8, border: "1px solid rgba(96,165,250,0.2)", transition: "all 0.15s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(96,165,250,0.15)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(96,165,250,0.08)"; }}
                                                    >
                                                        Need help? Get API Key →
                                                    </a>
                                                )}
                                            </div>

                                            {/* Help instructions */}
                                            {posInfo.helpText && (
                                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(96,165,250,0.04)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(96,165,250,0.08)", lineHeight: 1.6 }}>
                                                    <strong style={{ color: "#60a5fa" }}>How to get your keys:</strong> {posInfo.helpText}
                                                </div>
                                            )}

                                            {posInfo.fields.map(field => (
                                                <div key={field.key}>
                                                    <div className="f-label">{field.label}</div>
                                                    <input
                                                        className="s-input"
                                                        type={field.key.includes("Secret") || field.key === "posApiKey" ? "password" : "text"}
                                                        placeholder={field.placeholder}
                                                        value={(editLoc as Record<string, string>)[field.key] || ""}
                                                        onChange={e => { setEditLoc(p => ({ ...p, [field.key]: e.target.value })); setPosStatus("idle"); }}
                                                    />
                                                </div>
                                            ))}

                                            {/* Connection status + Connect button */}
                                            {posStatus === "connected" ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{posInfo.name} Connected</div>
                                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{posMessage || "Real-time data sync is active"}</div>
                                                    </div>
                                                    <button className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => { setPosStatus("idle"); setPosMessage(""); }}>Reconnect</button>
                                                </div>
                                            ) : posStatus === "error" ? (
                                                <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: posMessage ? 8 : 0 }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
                                                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#f87171" }}>Connection Failed</div>
                                                        <button
                                                            className="btn-ghost" style={{ fontSize: 11, padding: "6px 12px", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                                                            onClick={async () => {
                                                                setPosStatus("connecting");
                                                                setPosMessage("");
                                                                try {
                                                                    const fields: Record<string, string> = {};
                                                                    posInfo.fields.forEach(f => { fields[f.key] = (editLoc as any)[f.key] || ""; });
                                                                    const res = await fetch("/api/pos-validate", {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ posProvider: selectedPOS, fields })
                                                                    });
                                                                    const data = await res.json();
                                                                    setPosStatus(data.ok ? "connected" : "error");
                                                                    setPosMessage(data.message || "");
                                                                    showToast(data.message, data.ok ? "success" : "error");
                                                                } catch {
                                                                    setPosStatus("error");
                                                                    setPosMessage("Network error. Check your connection.");
                                                                    showToast("Network error.", "error");
                                                                }
                                                            }}
                                                        >
                                                            Retry
                                                        </button>
                                                    </div>
                                                    {posMessage && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, paddingLeft: 20 }}>{posMessage}</div>}
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn-gold"
                                                    disabled={posStatus === "connecting"}
                                                    style={{ width: "100%", padding: "14px", fontSize: 14, opacity: posStatus === "connecting" ? 0.7 : 1 }}
                                                    onClick={async () => {
                                                        const allFilled = posInfo.fields.every(f => (editLoc as any)[f.key]?.trim());
                                                        if (!allFilled) {
                                                            showToast("Please fill in all credential fields before connecting.", "error");
                                                            return;
                                                        }
                                                        setPosStatus("connecting");
                                                        setPosMessage("");
                                                        try {
                                                            const fields: Record<string, string> = {};
                                                            posInfo.fields.forEach(f => { fields[f.key] = (editLoc as any)[f.key] || ""; });
                                                            const res = await fetch("/api/pos-validate", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ posProvider: selectedPOS, fields })
                                                            });
                                                            const data = await res.json();
                                                            setPosStatus(data.ok ? "connected" : "error");
                                                            setPosMessage(data.message || "");
                                                            showToast(data.message, data.ok ? "success" : "error");
                                                        } catch {
                                                            setPosStatus("error");
                                                            setPosMessage("Network error. Check your connection.");
                                                            showToast("Network error.", "error");
                                                        }
                                                    }}
                                                >
                                                    {posStatus === "connecting" ? "Verifying Connection..." : `Connect ${posInfo.name}`}
                                                </button>
                                            )}

                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                                                🔒 Credentials encrypted at rest · Only used for data sync · Never shared
                                            </div>
                                        </div>
                                    ) : posInfo?.id === "manual" ? (
                                        <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                                            📋 Manual mode — enter inventory manually or import via CSV. No API connection needed.
                                        </div>
                                    ) : null}
                                </div>

                                {/* ── Online Profiles & Social Media ── */}
                                <div className="s-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                                        <div>
                                            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Online Profiles & Reviews</h2>
                                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                                                Connect your profiles to allow AI to analyze sentiment and fetch guest profiles automatically.
                                            </p>
                                        </div>
                                    </div>

                                    {/* OpenTable - Priority at the top */}
                                    <div style={{ marginBottom: 14 }}>
                                        {connectedApps.includes("OpenTable") ? (
                                            <button onClick={() => handleDisconnectApp("OpenTable", "opentableRestaurantId")} style={{ width: "100%", padding: "14px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#4ade80", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                                                <span>OpenTable Connected</span>
                                                <span style={{ fontSize: 11, background: "rgba(34, 197, 94, 0.2)", padding: "2px 8px", borderRadius: 4 }}>ACTIVE</span>
                                            </button>
                                        ) : (
                                            <button className="btn-ghost" style={{ width: "100%", padding: "14px", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", alignItems: "center", opacity: connectingApp === "OpenTable" ? 0.5 : 1 }} onClick={() => handleConnectApp("OpenTable", "opentableRestaurantId")} disabled={!!connectingApp}>
                                                {connectingApp === "OpenTable" ? "Verifying..." : "Connect OpenTable Restaurant ID"}
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        {[
                                            { name: "Google Business", key: "googleBusinessToken" },
                                            { name: "Yelp", key: "yelpApiKey" },
                                            { name: "X", key: "xToken" },
                                            { name: "Instagram", key: "instagramToken" },
                                            { name: "Facebook", key: "facebookToken" },
                                            { name: "TikTok", key: "tiktokToken" },
                                        ].map(app => {
                                            const isConnected = connectedApps.includes(app.name);
                                            const isConnecting = connectingApp === app.name;

                                            return isConnected ? (
                                                <button
                                                    key={app.name}
                                                    onClick={() => handleDisconnectApp(app.name, app.key)}
                                                    style={{ padding: "12px", background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.15)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                                >
                                                    {app.name}
                                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                                                </button>
                                            ) : (
                                                <button
                                                    key={app.name}
                                                    className="btn-ghost"
                                                    style={{ padding: "12px", justifyContent: "center", opacity: isConnecting ? 0.5 : 1, fontSize: 13 }}
                                                    onClick={() => handleConnectApp(app.name, app.key)}
                                                    disabled={!!connectingApp}
                                                >
                                                    {isConnecting ? "..." : `Add ${app.name}`}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginTop: 18, fontSize: 11, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
                                        <span>🤖 Need an API Key? Ask Restly AI for instructions.</span>
                                    </div>
                                </div>

                                {/* ── Save ── */}
                                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20 }}>
                                    <button className="btn-gold" onClick={handleSaveLocation} disabled={saving}>
                                        {saving ? "Saving…" : "✓ Save Location Settings"}
                                    </button>
                                    {saved && (
                                        <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, animation: "fadeIn 0.3s ease" }}>
                                            ✓ Saved successfully!
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 14, padding: 60 }}>
                                Select a location to edit
                            </div>
                        )}
                    </div>
                )
            }

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: BRAND                              */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {
                tab === "brand" && (
                    <div className="s-card">
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 20 }}>🏠 Brand Settings</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <div className="f-label">Brand Name</div>
                                <input className="s-input" defaultValue={info.restaurantName} />
                            </div>
                            <div>
                                <div className="f-label">Brand Color</div>
                                <input className="s-input" type="color" defaultValue="#C9A84C" style={{ height: 44, padding: "4px 8px", cursor: "pointer" }} />
                            </div>
                        </div>
                        <button className="btn-gold" style={{ marginTop: 20 }}>Save Brand Settings</button>
                    </div>
                )
            }

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: PLAN                               */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {
                tab === "plan" && (
                    <div className="s-card" style={{ textAlign: "center", padding: "56px 32px" }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>💳</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                            Current Plan:{" "}
                            <span style={{ color: planColor, textTransform: "capitalize" }}>{info.plan}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
                            {info.plan === "trial"
                                ? "Your 14-day trial includes all Pro features. Upgrade before it expires to keep access."
                                : `You're on the ${info.plan} plan. Manage your subscription below.`}
                        </p>
                        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                            <button className="btn-gold" style={{ fontSize: 15, padding: "14px 28px" }}>Upgrade Plan</button>
                            <button className="btn-ghost" style={{ fontSize: 15, padding: "14px 28px" }}>View Invoices</button>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>
                            Cancel anytime · No hidden fees · AI included in all plans
                        </p>
                    </div>
                )
            }
        </main >
    );
}
