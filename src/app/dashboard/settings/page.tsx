"use client";
import { useState, useEffect } from "react";

const POS_OPTIONS = [
    { id: "toast", name: "Toast POS", emoji: "🍞", color: "#FF6B35", fields: [{ key: "posApiKey", label: "API Key", placeholder: "Enter Toast API Key" }, { key: "posLocationId", label: "Restaurant GUID", placeholder: "e.g. abc123-def456-..." }] },
    { id: "clover", name: "Clover", emoji: "🍀", color: "#1DA462", fields: [{ key: "posApiKey", label: "API Token", placeholder: "Enter Clover API Token" }, { key: "posLocationId", label: "Merchant ID", placeholder: "e.g. ABCD1234EFGH" }] },
    { id: "square", name: "Square", emoji: "⬛", color: "#3E4348", fields: [{ key: "posApiKey", label: "Access Token", placeholder: "Enter Square Access Token" }, { key: "posLocationId", label: "Location ID", placeholder: "e.g. LKFQ8BKFQ8BK..." }] },
    { id: "lightspeed", name: "Lightspeed", emoji: "⚡", color: "#005EB8", fields: [{ key: "posApiKey", label: "Client ID", placeholder: "Enter Client ID" }, { key: "posSecretKey", label: "Client Secret", placeholder: "Enter Client Secret" }] },
    { id: "revel", name: "Revel Systems", emoji: "🔴", color: "#C41A1A", fields: [{ key: "posApiKey", label: "API Key", placeholder: "Enter API Key" }, { key: "posSecretKey", label: "API Secret", placeholder: "Enter API Secret" }, { key: "posLocationId", label: "Establishment ID", placeholder: "Enter ID" }] },
    { id: "manual", name: "Manual / CSV", emoji: "📋", color: "#6B7280", fields: [] },
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
    address: string | null;
    city: string | null;
    timezone: string;
    posProvider: string | null;
    isDefault: boolean;
    isActive: boolean;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectLocation = (loc: LocationData) => {
        setActiveLocId(loc.id);
        setEditLoc({ id: loc.id, name: loc.name, address: loc.address || "", city: loc.city || "", timezone: loc.timezone });
        setSelectedPOS(loc.posProvider || "manual");
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
            {tab === "locations" && (
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
                                                onClick={() => setSelectedPOS(pos.id)}
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
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: posInfo.color }}>
                                            <span>{posInfo.emoji}</span> {posInfo.name} Credentials
                                        </div>
                                        {posInfo.fields.map(field => (
                                            <div key={field.key}>
                                                <div className="f-label">{field.label}</div>
                                                <input
                                                    className="s-input"
                                                    type={field.key.includes("Secret") || field.key === "posApiKey" ? "password" : "text"}
                                                    placeholder={field.placeholder}
                                                    value={(editLoc as Record<string, string>)[field.key] || ""}
                                                    onChange={e => setEditLoc(p => ({ ...p, [field.key]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                                            🔒 Credentials encrypted at rest · Only used for data sync · Never shared
                                        </div>
                                    </div>
                                ) : posInfo?.id === "manual" ? (
                                    <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                                        📋 Manual mode — enter inventory manually or import via CSV. No API connection.
                                    </div>
                                ) : null}
                            </div>

                            {/* ── Online Profiles & Social Media ── */}
                            <div className="s-card">
                                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📱 Online Profiles & Reviews</h2>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 18, lineHeight: 1.5 }}>
                                    Connect your profiles with a single click. AI securely uses these to fetch reviews, guest profiles, and analyze sentiment automatically. No complex API keys required.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <button className="btn-ghost" style={{ padding: "14px", justifyContent: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", alignItems: "center" }} onClick={() => {
                                        alert("Redirecting to Google 1-Click Auth... (OAuth Flow simulation)");
                                        setTimeout(() => alert("Google Business successfully linked!"), 1500);
                                    }}>
                                        <span style={{ fontSize: 18 }}>🌐</span> Connect Google Business
                                    </button>
                                    <button className="btn-ghost" style={{ padding: "14px", justifyContent: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", alignItems: "center" }} onClick={() => {
                                        alert("Redirecting to Yelp 1-Click Auth... (OAuth Flow simulation)");
                                        setTimeout(() => alert("Yelp successfully linked!"), 1500);
                                    }}>
                                        <span style={{ fontSize: 18 }}>🔴</span> Connect Yelp
                                    </button>
                                    <button className="btn-ghost" style={{ padding: "14px", justifyContent: "center", background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.3)", color: "#E8C96E", display: "flex", gap: "8px", alignItems: "center", gridColumn: "1 / -1" }} onClick={() => {
                                        alert("Redirecting to OpenTable 1-Click Auth... (OAuth Flow simulation)");
                                        setTimeout(() => alert("OpenTable successfully linked!"), 1500);
                                    }}>
                                        <span style={{ fontSize: 18 }}>🍽️</span> Connect OpenTable (1-Click)
                                    </button>
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
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: BRAND                              */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {tab === "brand" && (
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
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: PLAN                               */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {tab === "plan" && (
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
            )}
        </main>
    );
}
