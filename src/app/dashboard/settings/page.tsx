"use client";
import { useState, useEffect, useRef } from "react";

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
    emailConnected?: boolean;
    emailAddress?: string | null;
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
    email: string;
    emailVerified: boolean;
    createdAt: string;
}

export default function SettingsPage() {
    const [info, setInfo] = useState<RestaurantInfo>({ restaurantName: "", plan: "trial", email: "", emailVerified: false, createdAt: "" });
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [activeLocId, setActiveLocId] = useState<string>("");
    const [editLoc, setEditLoc] = useState<EditState>({});
    const [selectedPOS, setSelectedPOS] = useState<string>("manual");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [addingLoc, setAddingLoc] = useState(false);
    const [newLocName, setNewLocName] = useState("");
    const [newLocCity, setNewLocCity] = useState("");
    const [tab, setTab] = useState<"account" | "locations" | "brand" | "plan">("account");
    const [connectedApps, setConnectedApps] = useState<string[]>([]);
    const [connectingApp, setConnectingApp] = useState<string | null>(null);
    const [posStatus, setPosStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [posMessage, setPosMessage] = useState("");
    const [verifyStep, setVerifyStep] = useState<"idle" | "sending" | "input" | "verifying" | "done">("idle");
    const [verifyCode, setVerifyCode] = useState("");
    const [verifyError, setVerifyError] = useState("");
    const [pwStep, setPwStep] = useState<"closed" | "open" | "verify" | "saving">("closed");
    const [pwCurrent, setPwCurrent] = useState("");
    const [pwNew, setPwNew] = useState("");
    const [pwConfirm, setPwConfirm] = useState("");
    const [pwError, setPwError] = useState("");
    const [pwVerifyCode, setPwVerifyCode] = useState(["", "", "", "", "", ""]);
    const [pwResendCooldown, setPwResendCooldown] = useState(0);
    const pwCodeRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [connectModalApp, setConnectModalApp] = useState<{ name: string, keyName: string } | null>(null);
    const [brandName, setBrandName] = useState("");
    const [brandColor, setBrandColor] = useState("#C9A84C");
    const [brandSaving, setBrandSaving] = useState(false);
    const [connectToken, setConnectToken] = useState("");
    const [disconnectModalApp, setDisconnectModalApp] = useState<{ name: string, keyName: string } | null>(null);
    const [toastMsg, setToastMsg] = useState<{ text: string, type: "success" | "error" } | null>(null);

    // Email connection state
    const [emailAddress, setEmailAddress] = useState("");
    const [emailImapHost, setEmailImapHost] = useState("");
    const [emailImapPort, setEmailImapPort] = useState("993");
    const [emailSmtpHost, setEmailSmtpHost] = useState("");
    const [emailSmtpPort, setEmailSmtpPort] = useState("587");
    const [emailUser, setEmailUser] = useState("");
    const [emailPass, setEmailPass] = useState("");
    const [emailTesting, setEmailTesting] = useState(false);
    const [emailConnected, setEmailConnected] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 3000);
    };

    // Password change resend cooldown timer
    useEffect(() => {
        if (pwResendCooldown <= 0) return;
        const t = setTimeout(() => setPwResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [pwResendCooldown]);

    // Send verification code for password change
    const handlePwSendCode = async () => {
        setPwError("");
        if (!pwCurrent) { setPwError("Enter your current password"); return; }
        if (pwNew.length < 8) { setPwError("New password must be at least 8 characters"); return; }
        if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return; }
        setPwStep("saving");
        try {
            // First validate current password, then send verification code
            const res = await fetch("/api/restaurant", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send_pw_verification", currentPassword: pwCurrent }),
            });
            const data = await res.json();
            if (!res.ok) { setPwError(data.error || "Failed to verify"); setPwStep("open"); return; }
            setPwStep("verify");
            setPwResendCooldown(60);
            setPwVerifyCode(["", "", "", "", "", ""]);
            setTimeout(() => pwCodeRefs.current[0]?.focus(), 100);
        } catch { setPwError("Network error"); setPwStep("open"); }
    };

    // Submit verification code + change password
    const handlePwVerifySubmit = async (code: string) => {
        setPwError("");
        setPwStep("saving");
        try {
            const res = await fetch("/api/restaurant", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew, verificationCode: code }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("✅ Password changed successfully!");
                setPwStep("closed"); setPwCurrent(""); setPwNew(""); setPwConfirm(""); setPwVerifyCode(["", "", "", "", "", ""]);
            } else {
                setPwError(data.error || "Failed to change password");
                setPwStep("verify");
            }
        } catch { setPwError("Network error"); setPwStep("verify"); }
    };

    const handleConnectApp = (appName: string, keyName: string) => {
        setConnectToken("");
        setConnectModalApp({ name: appName, keyName });
    };

    const confirmConnectApp = async () => {
        if (!connectModalApp) return;
        const appName = connectModalApp.name;
        const keyName = connectModalApp.keyName;
        let token = connectToken.trim();

        if (!token) {
            showToast("Connection cancelled. A valid token is required.", "error");
            setConnectModalApp(null);
            return;
        }

        // Auto-strip "Bearer " prefix — users often paste the full header value
        if (token.toLowerCase().startsWith("bearer ")) {
            token = token.substring(7).trim();
        }

        // Basic format validation per platform
        const validations: Record<string, { minLen: number; hint: string; pattern?: RegExp }> = {
            googleBusinessToken: { minLen: 10, hint: "Enter your Google Place ID (starts with 'ChIJ' — find it on Google Maps URL or Google My Business)" },
            yelpApiKey: { minLen: 40, hint: "Yelp API keys are long alphanumeric strings from https://www.yelp.com/developers" },
            opentableRestaurantId: { minLen: 3, hint: "OpenTable Restaurant ID is a numeric ID (found in your OpenTable dashboard URL)" },
            xToken: { minLen: 20, hint: "X (Twitter) Bearer token from developer.x.com/portal" },
            instagramToken: { minLen: 20, hint: "Meta token starting with 'EAA' — get from Graph API Explorer" },
            facebookToken: { minLen: 20, hint: "Meta token starting with 'EAA' (same token as Instagram)" },
            metaToken: { minLen: 20, hint: "Meta token starting with 'EAA' — get from developers.facebook.com/tools/explorer/" },
            tiktokToken: { minLen: 20, hint: "TikTok token from developers.tiktok.com" },
        };

        const rule = validations[keyName];
        if (rule) {
            if (token.length < rule.minLen) {
                showToast(`❌ Invalid ${appName} token — too short. ${rule.hint}`, "error");
                return;
            }
        }

        setConnectModalApp(null);
        setConnectingApp(appName);

        try {
            // Meta special case: save the same token to both instagramToken and facebookToken
            const payload: Record<string, any> = { locationId: activeLocId };
            if (keyName === "metaToken") {
                payload.instagramToken = token;
                payload.facebookToken = token;
            } else {
                payload[keyName] = token;
            }

            const res = await fetch("/api/locations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (keyName === "metaToken") {
                    // Mark both Instagram and Facebook as connected
                    setConnectedApps(prev => {
                        const updated = [...prev];
                        if (!updated.includes("Instagram")) updated.push("Instagram");
                        if (!updated.includes("Facebook")) updated.push("Facebook");
                        if (!updated.includes("Meta")) updated.push("Meta");
                        return updated;
                    });
                    showToast(`✅ Instagram & Facebook connected via Meta!`);
                } else {
                    setConnectedApps(prev => prev.includes(appName) ? prev : [...prev, appName]);
                    showToast(`✅ ${appName} connected successfully!`);
                }
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
            // Meta special case: clear both instagramToken and facebookToken
            const payload: Record<string, any> = { locationId: activeLocId };
            if (appName === "Meta" || keyName === "instagramToken" || keyName === "facebookToken") {
                payload.instagramToken = null;
                payload.facebookToken = null;
            } else {
                payload[keyName] = null;
            }

            const res = await fetch("/api/locations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (appName === "Meta") {
                    setConnectedApps(prev => prev.filter(a => a !== "Instagram" && a !== "Facebook" && a !== "Meta"));
                    showToast(`Instagram & Facebook disconnected.`);
                } else {
                    setConnectedApps(prev => prev.filter(a => a !== appName));
                    showToast(`${appName} disconnected successfully.`);
                }
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
                // Always set user info, even if no locations
                setInfo({
                    restaurantName: d.restaurantName || "",
                    plan: d.plan || "trial",
                    email: d.email || "",
                    emailVerified: d.emailVerified ?? false,
                    createdAt: d.createdAt || ""
                });
                setBrandName(d.restaurantName || "");

                if (d.locations?.length) {
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

        // Load email connection state
        setEmailConnected(!!(loc as any).emailConnected);
        if ((loc as any).emailAddress) setEmailAddress((loc as any).emailAddress);
        else setEmailAddress("");
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
        try {
            const res = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newLocName, city: newLocCity }),
            });
            const data = await res.json();
            if (res.ok) {
                const newLoc: LocationData = data.location;
                setLocations(prev => [...prev, newLoc]);
                setNewLocName(""); setNewLocCity(""); setAddingLoc(false);
                selectLocation(newLoc);
                showToast("✅ Location added successfully!");
            } else {
                showToast(data.error || "Failed to add location", "error");
            }
        } catch {
            showToast("Network error — could not add location", "error");
        }
    };

    const activeLoc = locations.find(l => l.id === activeLocId);
    const posInfo = POS_OPTIONS.find(p => p.id === selectedPOS);

    const handleBrandSave = async () => {
        setBrandSaving(true);
        try {
            const res = await fetch("/api/restaurant", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: brandName, primaryColor: brandColor }),
            });
            const data = await res.json();
            if (res.ok) {
                setInfo(prev => ({ ...prev, restaurantName: brandName }));
                showToast("✅ Brand settings saved!");
            } else {
                showToast(data.error || "Failed to save brand settings", "error");
            }
        } catch {
            showToast("Network error — could not save", "error");
        }
        setBrandSaving(false);
    };

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

            {connectModalApp && (() => {
                const META_HELP: Record<string, { desc: string; url: string; placeholder: string }> = {
                    "Meta": { desc: "One token connects both Instagram & Facebook. Go to Meta Graph API Explorer, select your app, generate an access token with pages_show_list, instagram_basic, and instagram_manage_insights permissions. Then extend it to a long-lived token (60 days) at the Token Debugger.", url: "https://developers.facebook.com/tools/explorer/", placeholder: "Paste Meta access token (starts with EAA...)" },
                    "OpenTable": { desc: "Enter your OpenTable Restaurant ID. You can find it in your OpenTable Restaurant Center dashboard URL or Restaurant Settings.", url: "https://restaurant.opentable.com", placeholder: "Enter OpenTable Restaurant ID" },
                    "Google Business": { desc: "Create a project in Google Cloud Console, enable the Google My Business API, and create an API key. Restrict the key to only the My Business API.", url: "https://console.cloud.google.com/apis/credentials", placeholder: "Paste Google API Key (starts with AIza...)" },
                    "Yelp": { desc: "Sign in at yelp.com/developers, create an app, and copy the API Key (128+ chars). Free tier: 5,000 calls/day.", url: "https://www.yelp.com/developers/v3/manage_app", placeholder: "Paste Yelp API Key" },
                    "TikTok": { desc: "Create a developer account at TikTok for Developers, create an app with Content Discovery scope, submit for review, then generate an access token.", url: "https://developers.tiktok.com/apps/", placeholder: "Paste TikTok access token" },
                    "X": { desc: "Sign in at the X Developer Portal, create a project with an app, go to Keys & Tokens, and generate a Bearer Token.", url: "https://developer.x.com/en/portal/dashboard", placeholder: "Paste X Bearer Token" },
                };
                const help = META_HELP[connectModalApp.name] || { desc: `Provide a valid API token from the ${connectModalApp.name} developer portal.`, url: "", placeholder: `Enter your ${connectModalApp.name} Token` };

                return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 480, padding: 28 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Connect {connectModalApp.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                            {help.desc}
                        </p>
                        {help.url && (
                            <a href={help.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: 12, color: "#E8C96E", marginBottom: 14, textDecoration: "none" }}>
                                🔗 Open Developer Portal →
                            </a>
                        )}
                        <input
                            autoFocus
                            type="text"
                            value={connectToken}
                            onChange={e => setConnectToken(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") confirmConnectApp(); }}
                            style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "#fff", padding: "12px", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 20 }}
                            placeholder={help.placeholder}
                        />
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => setConnectModalApp(null)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmConnectApp}>Connect</button>
                        </div>
                    </div>
                </div>
                );
            })()}

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
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 28, flexWrap: "wrap" }}>
                {(["account", "locations", "brand", "plan"] as const).map(t => (
                    <button key={t} className={`stab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                        {t === "account" ? "👤 Account" : t === "locations" ? "📍 Locations & Integrations" : t === "brand" ? "🏠 Brand" : "💳 Plan"}
                    </button>
                ))}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB: ACCOUNT                             */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {
                tab === "account" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Verification Banner */}
                        {!info.emailVerified && info.email && verifyStep !== "done" && (
                            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: "16px 20px" }}>
                                {verifyStep === "idle" || verifyStep === "sending" ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ fontSize: 26 }}>📧</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 2 }}>Email not verified</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>We'll send a 6-digit code to <strong style={{ color: "#fff" }}>{info.email}</strong></div>
                                        </div>
                                        <button className="btn-gold" style={{ fontSize: 12, padding: "8px 16px", whiteSpace: "nowrap", opacity: verifyStep === "sending" ? 0.6 : 1 }}
                                            disabled={verifyStep === "sending"}
                                            onClick={async () => {
                                                setVerifyStep("sending"); setVerifyError("");
                                                try {
                                                    const res = await fetch("/api/verify", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: info.email }) });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        setVerifyStep("input");
                                                        if (data.fallbackCode) { setVerifyCode(data.fallbackCode); }
                                                    } else { setVerifyError(data.error || "Failed to send code"); setVerifyStep("idle"); }
                                                } catch { setVerifyError("Network error"); setVerifyStep("idle"); }
                                            }}
                                        >{verifyStep === "sending" ? "Sending..." : "Send Verification Code"}</button>
                                    </div>
                                ) : verifyStep === "input" || verifyStep === "verifying" ? (
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>Enter verification code</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>We sent a 6-digit code to <strong style={{ color: "#fff" }}>{info.email}</strong></div>
                                        {verifyError && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>⚠ {verifyError}</div>}
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <input
                                                type="text" maxLength={6} value={verifyCode}
                                                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                                                placeholder="000000"
                                                style={{ width: 140, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", fontSize: 18, fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: 6, fontFamily: "monospace", outline: "none" }}
                                            />
                                            <button className="btn-gold" style={{ fontSize: 12, padding: "10px 20px", opacity: verifyStep === "verifying" ? 0.6 : 1 }}
                                                disabled={verifyCode.length !== 6 || verifyStep === "verifying"}
                                                onClick={async () => {
                                                    setVerifyStep("verifying"); setVerifyError("");
                                                    try {
                                                        const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: info.email, code: verifyCode }) });
                                                        const data = await res.json();
                                                        if (res.ok) { setVerifyStep("done"); setInfo(prev => ({ ...prev, emailVerified: true })); showToast("✅ Email verified!"); }
                                                        else { setVerifyError(data.error || "Invalid code"); setVerifyStep("input"); }
                                                    } catch { setVerifyError("Network error"); setVerifyStep("input"); }
                                                }}
                                            >{verifyStep === "verifying" ? "Verifying..." : "Verify →"}</button>
                                            <button style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }} onClick={() => { setVerifyStep("idle"); setVerifyCode(""); setVerifyError(""); }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                        {info.emailVerified && (
                            <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ fontSize: 20 }}>✅</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}>Email verified — your account is secure.</div>
                            </div>
                        )}

                        {/* Profile Card */}
                        <div className="s-card">
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 20 }}>👤 Account Information</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <div className="f-label">Restaurant Name</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", padding: "11px 0" }}>{info.restaurantName || "—"}</div>
                                </div>
                                <div>
                                    <div className="f-label">Email</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 0" }}>
                                        <span style={{ fontSize: 14, color: "#fff" }}>{info.email || "—"}</span>
                                        {info.emailVerified ? (
                                            <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(74,222,128,0.2)" }}>✓ Verified</span>
                                        ) : (
                                            <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(251,191,36,0.1)", color: "#fbbf24", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(251,191,36,0.2)" }}>Unverified</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="f-label">Plan</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: planColor, padding: "11px 0", textTransform: "capitalize" }}>{info.plan}</div>
                                </div>
                                <div>
                                    <div className="f-label">Member Since</div>
                                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", padding: "11px 0" }}>
                                        {info.createdAt ? new Date(info.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="s-card">
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 20 }}>🔒 Security</h2>
                            {pwStep === "closed" ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Password</div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>••••••••••</div>
                                    </div>
                                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPwStep("open")}>Change Password</button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                                    {pwError && <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.06)", padding: "8px 12px", borderRadius: 8 }}>⚠ {pwError}</div>}
                                    <div>
                                        <div className="f-label">Current Password</div>
                                        <input className="s-input" type="password" placeholder="Enter current password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} />
                                    </div>
                                    <div>
                                        <div className="f-label">New Password</div>
                                        <input className="s-input" type="password" placeholder="Min 8 characters" value={pwNew} onChange={e => setPwNew(e.target.value)} />
                                    </div>
                                    <div>
                                        <div className="f-label">Confirm New Password</div>
                                        <input className="s-input" type="password" placeholder="Repeat new password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} />
                                    </div>
                                    {pwStep === "verify" ? (
                                        /* Email verification step */
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                                                <div style={{ fontSize: 20, marginBottom: 6 }}>📧</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#E8C96E", marginBottom: 4 }}>Verification Code Sent</div>
                                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Enter the 6-digit code sent to your email</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                {pwVerifyCode.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        ref={el => { pwCodeRefs.current[i] = el; }}
                                                        type="text" inputMode="numeric" maxLength={1} value={digit}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (!/^\d?$/.test(val)) return;
                                                            const nc = [...pwVerifyCode]; nc[i] = val; setPwVerifyCode(nc); setPwError("");
                                                            if (val && i < 5) pwCodeRefs.current[i + 1]?.focus();
                                                            if (val && i === 5 && nc.every(c => c)) {
                                                                // Auto-submit
                                                                const code = nc.join("");
                                                                handlePwVerifySubmit(code);
                                                            }
                                                        }}
                                                        onKeyDown={e => { if (e.key === "Backspace" && !pwVerifyCode[i] && i > 0) pwCodeRefs.current[i - 1]?.focus(); }}
                                                        onPaste={i === 0 ? (e => {
                                                            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                                            if (pasted.length === 6) { e.preventDefault(); const nc = pasted.split(""); setPwVerifyCode(nc); pwCodeRefs.current[5]?.focus(); handlePwVerifySubmit(pasted); }
                                                        }) : undefined}
                                                        style={{ width: 40, height: 48, textAlign: "center", fontSize: 20, fontWeight: 800, background: digit ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.04)", border: `2px solid ${digit ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, color: "#E8C96E", outline: "none", fontFamily: "inherit" }}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                                                <button className="btn-gold" style={{ fontSize: 13, padding: "10px 20px" }}
                                                    disabled={pwVerifyCode.some(c => !c)}
                                                    onClick={() => handlePwVerifySubmit(pwVerifyCode.join(""))}
                                                >Verify & Change Password</button>
                                                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setPwStep("closed"); setPwCurrent(""); setPwNew(""); setPwConfirm(""); setPwError(""); setPwVerifyCode(["", "", "", "", "", ""]); }}>Cancel</button>
                                            </div>
                                            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                                                {pwResendCooldown > 0 ? (
                                                    <span>Resend in {pwResendCooldown}s</span>
                                                ) : (
                                                    <button onClick={handlePwSendCode} style={{ background: "none", border: "none", color: "#E8C96E", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Resend Code</button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                            <button className="btn-gold" style={{ fontSize: 13, padding: "10px 20px", opacity: pwStep === "saving" ? 0.6 : 1 }}
                                                disabled={pwStep === "saving"}
                                                onClick={handlePwSendCode}
                                            >{pwStep === "saving" ? "Saving..." : "Update Password"}</button>
                                            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setPwStep("closed"); setPwCurrent(""); setPwNew(""); setPwConfirm(""); setPwError(""); }}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Data Card */}
                        <div className="s-card">
                            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📊 Your Data</h2>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>Each user has their own encrypted data. Your restaurant data is isolated and private.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                <button onClick={() => setTab("locations")} style={{ textAlign: "center", padding: "16px 8px", background: "rgba(96,165,250,0.04)", borderRadius: 12, border: "1px solid rgba(96,165,250,0.1)", cursor: "pointer", fontFamily: "inherit" }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>{locations.length}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{locations.length === 0 ? "Add Location →" : "Locations"}</div>
                                </button>
                                <button onClick={() => setTab("locations")} style={{ textAlign: "center", padding: "16px 8px", background: "rgba(74,222,128,0.04)", borderRadius: 12, border: "1px solid rgba(74,222,128,0.1)", cursor: "pointer", fontFamily: "inherit" }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80" }}>{connectedApps.length}</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{connectedApps.length === 0 ? "Connect Apps →" : "Connected Apps"}</div>
                                </button>
                                <div style={{ textAlign: "center", padding: "16px 8px", background: "rgba(201,168,76,0.04)", borderRadius: 12, border: "1px solid rgba(201,168,76,0.1)" }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#E8C96E" }}>🔒</div>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Encrypted</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

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
                                                                    const res = await fetch("/api/pos/test", {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({
                                                                            provider: selectedPOS,
                                                                            apiKey: (editLoc as any).posApiKey || "",
                                                                            secretKey: (editLoc as any).posSecretKey || "",
                                                                            locationId: (editLoc as any).posLocationId || "",
                                                                        })
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
                                                Connect your profiles to allow AI to analyze sentiment, fetch reviews, and manage social messages.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Reviews ── */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Reviews</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                                            {[
                                                { name: "Google Business", key: "googleBusinessToken", icon: "📍", helpUrl: "https://console.cloud.google.com/apis/credentials", desc: "Google reviews & star ratings" },
                                                { name: "Yelp", key: "yelpApiKey", icon: "⭐", helpUrl: "https://www.yelp.com/developers/v3/manage_app", desc: "Yelp reviews & ratings" },
                                            ].map(app => {
                                                const isConnected = connectedApps.includes(app.name);
                                                const isConnecting = connectingApp === app.name;
                                                return (
                                                    <div key={app.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <button
                                                            onClick={() => isConnected ? handleDisconnectApp(app.name, app.key) : handleConnectApp(app.name, app.key)}
                                                            disabled={!!connectingApp && !isConnecting}
                                                            style={{
                                                                flex: 1, padding: "12px 14px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s",
                                                                background: isConnected ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                                                                border: `1px solid ${isConnected ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                                                                color: isConnected ? "#4ade80" : "rgba(255,255,255,0.7)",
                                                                fontWeight: 600, fontSize: 13, opacity: isConnecting ? 0.5 : 1,
                                                            }}
                                                        >
                                                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <span>{app.icon}</span>
                                                                <span>{app.name}</span>
                                                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>— {app.desc}</span>
                                                            </span>
                                                            {isConnected ? (
                                                                <span style={{ fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>CONNECTED</span>
                                                            ) : isConnecting ? (
                                                                <span style={{ fontSize: 11 }}>Connecting...</span>
                                                            ) : (
                                                                <span style={{ fontSize: 11, color: "#E8C96E" }}>+ Connect</span>
                                                            )}
                                                        </button>
                                                        {app.helpUrl && (
                                                            <a href={app.helpUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textDecoration: "none", whiteSpace: "nowrap" }} title="Get API Key">🔗</a>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ── OpenTable Guest Import ── */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Guest Data</div>
                                        <div style={{
                                            padding: "16px", borderRadius: 12,
                                            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)",
                                            textAlign: "center", position: "relative",
                                        }}>
                                            <div style={{ fontSize: 28, marginBottom: 6 }}>🍽️</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>OpenTable Guest Import</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.5 }}>
                                                Export guests from <a href="https://guestcenter.opentable.com" target="_blank" rel="noopener noreferrer" style={{ color: "#E8C96E", textDecoration: "none" }}>OpenTable Guest Center</a> as CSV, then upload here.
                                            </div>
                                            <input
                                                type="file" accept=".csv,.txt" id="csv-upload-settings"
                                                style={{ display: "none" }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append("file", file);
                                                    showToast("⏳ Importing guests...");
                                                    try {
                                                        const res = await fetch("/api/guests/import", { method: "POST", body: formData });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            showToast(`✅ Imported! ${data.summary.created} new, ${data.summary.updated} updated, ${data.summary.skipped} skipped`);
                                                        } else {
                                                            showToast(`❌ ${data.error || "Import failed"}`);
                                                        }
                                                    } catch { showToast("❌ Upload failed"); }
                                                    e.target.value = "";
                                                }}
                                            />
                                            <label htmlFor="csv-upload-settings" style={{
                                                display: "inline-block", padding: "10px 24px", borderRadius: 8,
                                                background: "rgba(232,201,110,0.1)", border: "1px solid rgba(232,201,110,0.3)",
                                                color: "#E8C96E", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}>
                                                📥 Upload CSV File
                                            </label>
                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
                                                Supports OpenTable export format. Duplicate guests are automatically merged.
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Social Media ── */}
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Social Media — Inbox & Monitoring</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                                            {[
                                                { name: "Meta", keys: ["instagramToken", "facebookToken"], icon: "📸", helpUrl: "https://developers.facebook.com/tools/explorer/", desc: "Instagram & Facebook — one token for both", combined: true },
                                                { name: "TikTok", keys: ["tiktokToken"], icon: "🎵", helpUrl: "https://developers.tiktok.com/apps/", desc: "TikTok mentions & viral monitoring" },
                                                { name: "X", keys: ["xToken"], icon: "𝕏", helpUrl: "https://developer.x.com/en/portal/dashboard", desc: "X (Twitter) mentions & hashtags" },
                                            ].map(app => {
                                                const isConnected = app.combined
                                                    ? connectedApps.includes("Instagram") || connectedApps.includes("Facebook")
                                                    : connectedApps.includes(app.name);
                                                const isConnecting = connectingApp === app.name || (app.combined && (connectingApp === "Instagram" || connectingApp === "Facebook"));
                                                const displayKey = app.keys[0];

                                                return (
                                                    <div key={app.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <button
                                                            onClick={() => {
                                                                if (isConnected) {
                                                                    if (app.combined) {
                                                                        // Disconnect both Instagram and Facebook
                                                                        handleDisconnectApp("Meta", "instagramToken");
                                                                    } else {
                                                                        handleDisconnectApp(app.name, displayKey);
                                                                    }
                                                                } else {
                                                                    if (app.combined) {
                                                                        // Connect Meta → will save to both instagramToken and facebookToken
                                                                        handleConnectApp("Meta", "metaToken");
                                                                    } else {
                                                                        handleConnectApp(app.name, displayKey);
                                                                    }
                                                                }
                                                            }}
                                                            disabled={!!connectingApp && !isConnecting}
                                                            style={{
                                                                flex: 1, padding: "12px 14px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s",
                                                                background: isConnected ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                                                                border: `1px solid ${isConnected ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                                                                color: isConnected ? "#4ade80" : "rgba(255,255,255,0.7)",
                                                                fontWeight: 600, fontSize: 13, opacity: isConnecting ? 0.5 : 1,
                                                            }}
                                                        >
                                                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <span>{app.icon}</span>
                                                                <span>{app.name}</span>
                                                                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>— {app.desc}</span>
                                                            </span>
                                                            {isConnected ? (
                                                                <span style={{ fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>CONNECTED</span>
                                                            ) : isConnecting ? (
                                                                <span style={{ fontSize: 11 }}>Connecting...</span>
                                                            ) : (
                                                                <span style={{ fontSize: 11, color: "#E8C96E" }}>+ Connect</span>
                                                            )}
                                                        </button>
                                                        {app.helpUrl && (
                                                            <a href={app.helpUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textDecoration: "none", whiteSpace: "nowrap" }} title="Get API Key">🔗</a>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
                                        <span>🤖 Need help? Ask Restly AI: "How do I connect my Instagram?" — includes direct links & step-by-step guide.</span>
                                    </div>
                                </div>

                                {/* ── Email Connection ── */}
                                <div className="s-card">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                        <div>
                                            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📧 Email Connection</h2>
                                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                                                Connect your restaurant email to read and send emails from Social Inbox.
                                            </p>
                                        </div>
                                        {emailConnected && (
                                            <span style={{ fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "4px 10px", borderRadius: 4, fontWeight: 700 }}>CONNECTED</span>
                                        )}
                                    </div>

                                    {!emailConnected ? (
                                        <>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                                                <div>
                                                    <div className="f-label">Email Address</div>
                                                    <input className="s-input" value={emailAddress} onChange={e => { setEmailAddress(e.target.value); setEmailUser(e.target.value); }} placeholder="info@myrestaurant.com" />
                                                </div>
                                                <div>
                                                    <div className="f-label">Password</div>
                                                    <input className="s-input" type="password" value={emailPass} onChange={e => setEmailPass(e.target.value)} placeholder="Email password" />
                                                </div>
                                            </div>

                                            <button
                                                className="btn-primary"
                                                disabled={emailTesting || !emailAddress || !emailPass || !emailAddress.includes("@")}
                                                onClick={async () => {
                                                    setEmailTesting(true);
                                                    setEmailTestResult(null);
                                                    const domain = emailAddress.split("@")[1]?.toLowerCase() || "";
                                                    let imap = "imap." + domain, smtp = "smtp." + domain, ip = 993, sp = 587;
                                                    if (domain.includes("gmail")) { imap = "imap.gmail.com"; smtp = "smtp.gmail.com"; }
                                                    else if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) { imap = "outlook.office365.com"; smtp = "smtp.office365.com"; }
                                                    else if (domain.includes("yahoo")) { imap = "imap.mail.yahoo.com"; smtp = "smtp.mail.yahoo.com"; }
                                                    try {
                                                        const res = await fetch("/api/inbox/emails/test", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ emailAddress, imapHost: imap, imapPort: ip, smtpHost: smtp, smtpPort: sp, user: emailAddress, pass: emailPass }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            const saveRes = await fetch("/api/locations", {
                                                                method: "PATCH",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ locationId: activeLocId, emailAddress, emailImapHost: imap, emailImapPort: ip, emailSmtpHost: smtp, emailSmtpPort: sp, emailUser: emailAddress, emailPass: emailPass }),
                                                            });
                                                            if (saveRes.ok) {
                                                                setEmailConnected(true);
                                                                setEmailTestResult({ ok: true, msg: `Connected! ${data.messageCount || 0} emails in inbox.` });
                                                                showToast("✅ Email connected!");
                                                            }
                                                        } else {
                                                            setEmailTestResult({ ok: false, msg: data.error || "Connection failed. Check email & password." });
                                                        }
                                                    } catch { setEmailTestResult({ ok: false, msg: "Network error" }); }
                                                    finally { setEmailTesting(false); }
                                                }}
                                                style={{ fontSize: 13 }}
                                            >
                                                {emailTesting ? "⏳ Connecting..." : "Connect Email"}
                                            </button>
                                            {emailTestResult && (
                                                <div style={{ marginTop: 10, fontSize: 12, padding: "8px 12px", borderRadius: 8, background: emailTestResult.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: emailTestResult.ok ? "#4ade80" : "#ef4444", border: `1px solid ${emailTestResult.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                                                    {emailTestResult.msg}
                                                </div>
                                            )}
                                            <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                                                📬 Emails received at this address will appear in your Social Inbox. You can read and reply directly from Restly.
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ fontSize: 13, color: "#4ade80" }}>📧 {emailAddress || "Connected"} — emails synced to Social Inbox</div>
                                            <button className="btn-ghost" style={{ fontSize: 12, color: "#ef4444" }} onClick={async () => {
                                                await fetch("/api/locations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: activeLocId, emailAddress: null, emailImapHost: null, emailImapPort: null, emailSmtpHost: null, emailSmtpPort: null, emailUser: null, emailPass: null }) });
                                                setEmailConnected(false); setEmailAddress(""); setEmailPass(""); setEmailTestResult(null); showToast("Email disconnected.");
                                            }}>Disconnect</button>
                                        </div>
                                    )}
                                </div>
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
                                <input className="s-input" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your restaurant name" />
                            </div>
                            <div>
                                <div className="f-label">Brand Color</div>
                                <input className="s-input" type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ height: 44, padding: "4px 8px", cursor: "pointer" }} />
                            </div>
                        </div>
                        <button className="btn-gold" style={{ marginTop: 20 }} onClick={handleBrandSave} disabled={brandSaving}>
                            {brandSaving ? "Saving..." : "Save Brand Settings"}
                        </button>
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
                                ? "Your 30-day trial includes all Pro features. Upgrade before it expires to keep access."
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
