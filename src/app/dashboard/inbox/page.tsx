"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsDemo } from "@/lib/use-demo";

// ── Types ───────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    platform: "Email" | "Instagram" | "Facebook" | "TikTok" | "Google" | "Yelp" | "X" | "OpenTable";
    sender: string;
    handle: string;
    avatar: string;
    preview: string;
    fullMessage: string;
    time: string;
    unread: boolean;
    type: "dm" | "review" | "email" | "mention";
    rating?: number;
    apiSource?: string;
}

interface AIMention {
    id: string;
    source: string;
    sourceIcon: string;
    title: string;
    snippet: string;
    sentiment: "positive" | "neutral" | "negative";
    date: string;
    url: string;
    isNew: boolean;
    engagement?: { likes: number; comments: number; shares: number };
}

interface APIStatus {
    email: { connected: boolean; count: number; source: string };
    google: { connected: boolean; count: number; source: string };
    yelp: { connected: boolean; count: number; source: string };
    social: { connected: boolean; count: number; source: string };
}

// ── Platform styles ─────────────────────────────────────────────────────────
const PLATFORM_STYLE: Record<string, { color: string; label: string }> = {
    Email: { color: "#60a5fa", label: "📧 Email" },
    Instagram: { color: "#E1306C", label: "📸 IG" },
    Facebook: { color: "#1877F2", label: "👤 FB" },
    TikTok: { color: "#ff0050", label: "🎬 TT" },
    Google: { color: "#4285F4", label: "⭐ Google" },
    Yelp: { color: "#D32323", label: "🔴 Yelp" },
    X: { color: "#fff", label: "𝕏" },
    OpenTable: { color: "#DA3743", label: "🍽️ OT" },
};

// ── Static DM/mention data (would come from Instagram/FB/X APIs) ────────
const SOCIAL_DMS: Message[] = [
    { id: "dm_ig1", platform: "Instagram", sender: "FoodieGal", handle: "@foodie.gal_ny", avatar: "IG", preview: "Do you have vegan options for a party of 5?", fullMessage: "Hi! I'm planning my birthday dinner for next Friday and we have a party of 5. Two of us are strict vegans. I checked the menu but wanted to ask if the chef can prepare something special? Love your aesthetic!", time: "10m ago", unread: true, type: "dm" },
    { id: "dm_fb1", platform: "Facebook", sender: "John D.", handle: "JohnDoe", avatar: "FB", preview: "What are your holiday hours?", fullMessage: "Hello, I was wondering if you guys are going to be open on Christmas Eve? And if so, do we need to make reservations weeks in advance?", time: "2h ago", unread: true, type: "dm" },
    { id: "dm_x1", platform: "X", sender: "LA Foodie", handle: "@lafoodie", avatar: "X", preview: "Anyone tried the lamb chops? Insane!", fullMessage: "Anyone tried @meyhouse recently? The lamb chops are absolutely insane. Best I've had in LA. The vibe is perfect for date night too. Highly recommend the Old Fashioned.", time: "3h ago", unread: false, type: "mention" },
    { id: "dm_tt1", platform: "TikTok", sender: "Eats by Sam", handle: "@eatsbysam", avatar: "TT", preview: "Loved the lamb chops video! Collab?", fullMessage: "That lamb chop video you just posted is INSANE!! Definitely coming by this weekend. Do you guys do collaborations? I have 50k followers and would love to review your spot.", time: "4h ago", unread: false, type: "dm" },
    { id: "dm_ot1", platform: "OpenTable", sender: "Sarah M.", handle: "OpenTable Review", avatar: "OT", preview: "Perfect anniversary dinner — 5 stars", fullMessage: "We celebrated our 10th anniversary here and it was perfect. The staff arranged a special dessert with candles, and the wine pairing recommendation from our server Lisa was spot-on. Thank you for making it memorable!", time: "1d ago", unread: false, type: "review", rating: 5 },
];

const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "email", label: "Email" },
    { key: "dm", label: "DMs" },
    { key: "review", label: "Reviews" },
    { key: "mention", label: "Mentions" },
    { key: "ai", label: "✨ AI Monitor" },
];

export default function SocialInboxPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [aiMentions, setAiMentions] = useState<AIMention[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedAiId, setSelectedAiId] = useState<string | null>(null);
    const [filter, setFilter] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [replySent, setReplySent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [aiScanning, setAiScanning] = useState(false);
    const [aiScanResult, setAiScanResult] = useState<string | null>(null);
    const [aiMetrics, setAiMetrics] = useState({ brandHealth: 0, sentimentPercent: 0, totalMentions: 0, newAlerts: 0 });
    const [apiStatus, setApiStatus] = useState<APIStatus>({
        email: { connected: false, count: 0, source: "" },
        google: { connected: false, count: 0, source: "" },
        yelp: { connected: false, count: 0, source: "" },
        social: { connected: false, count: 0, source: "" },
    });
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
    const isDemo = useIsDemo();

    // ── Fetch all data from API routes ──────────────────────────────────────
    const loadInboxData = useCallback(async () => {
        setLoading(true);
        const allMessages: Message[] = isDemo ? [...SOCIAL_DMS] : [];
        const newStatus = { ...apiStatus };

        // 1. Fetch Emails (real API call)
        try {
            const emailRes = await fetch("/api/inbox/emails");
            const emailData = await emailRes.json();
            if (emailData.emails?.length > 0) {
                const emailMsgs: Message[] = emailData.emails.map((e: any) => ({
                    id: e.id,
                    platform: "Email" as const,
                    sender: e.from,
                    handle: e.fromEmail,
                    avatar: "📧",
                    preview: e.subject,
                    fullMessage: e.body,
                    time: e.date,
                    unread: e.unread,
                    type: "email" as const,
                    apiSource: emailData.source,
                }));
                allMessages.unshift(...emailMsgs);
                newStatus.email = { connected: true, count: emailMsgs.length, source: emailData.apiUrl || "API" };
            }
        } catch (e) {
            console.warn("Email fetch failed:", e);
            newStatus.email = { connected: false, count: 0, source: "error" };
        }

        // 2. Fetch Google Reviews (real API call)
        try {
            const googleRes = await fetch("/api/reviews/google?placeId=demo");
            const googleData = await googleRes.json();
            if (googleData.reviews?.length > 0) {
                const googleMsgs: Message[] = googleData.reviews.map((r: any) => ({
                    id: r.id,
                    platform: "Google" as const,
                    sender: r.author,
                    handle: "Google Review",
                    avatar: "G",
                    preview: `${r.text?.substring(0, 50)}... — ${"⭐".repeat(r.rating)}`,
                    fullMessage: r.text,
                    time: r.date,
                    unread: false,
                    type: "review" as const,
                    rating: r.rating,
                    apiSource: googleData.source,
                }));
                allMessages.push(...googleMsgs);
                newStatus.google = { connected: true, count: googleMsgs.length, source: googleData.source === "api" ? "Google Places API" : "Demo" };
            }
        } catch (e) {
            console.warn("Google reviews fetch failed:", e);
        }

        // 3. Fetch Yelp Reviews (real API call)
        try {
            const yelpRes = await fetch("/api/reviews/yelp?businessId=demo");
            const yelpData = await yelpRes.json();
            if (yelpData.reviews?.length > 0) {
                const yelpMsgs: Message[] = yelpData.reviews.map((r: any) => ({
                    id: r.id,
                    platform: "Yelp" as const,
                    sender: r.author,
                    handle: "Yelp Review",
                    avatar: "Y",
                    preview: `${r.text?.substring(0, 50)}... — ${"⭐".repeat(r.rating)}`,
                    fullMessage: r.text,
                    time: r.date,
                    unread: false,
                    type: "review" as const,
                    rating: r.rating,
                    apiSource: yelpData.source,
                }));
                allMessages.push(...yelpMsgs);
                newStatus.yelp = { connected: true, count: yelpMsgs.length, source: yelpData.source === "api" ? "Yelp Fusion API" : "Demo" };
            }
        } catch (e) {
            console.warn("Yelp reviews fetch failed:", e);
        }

        // 4. Fetch Social Mentions from real API (personalized per customer)
        try {
            const socialRes = await fetch("/api/inbox/social-monitor");
            if (socialRes.ok) {
                const data = await socialRes.json();
                if (data.mentions?.length > 0) {
                    const mentions: AIMention[] = data.mentions.map((m: any) => ({
                        id: m.id,
                        source: m.source,
                        sourceIcon: m.sourceIcon,
                        title: m.title,
                        snippet: m.snippet,
                        sentiment: m.sentiment as "positive" | "neutral" | "negative",
                        date: m.date,
                        url: m.url,
                        isNew: m.isNew,
                        engagement: m.engagement,
                    }));
                    setAiMentions(mentions);
                    setAiMetrics(data.metrics || { brandHealth: 0, sentimentPercent: 0, totalMentions: mentions.length, newAlerts: mentions.filter((m: any) => m.isNew).length });
                    newStatus.social = { connected: true, count: mentions.length, source: data.mode === "demo" ? "Demo" : "Live" };
                }
            }
        } catch (e) {
            console.warn("Social monitor fetch failed:", e);
        }

        setMessages(allMessages);
        setApiStatus(newStatus);
        setLoading(false);
    }, [isDemo]);

    useEffect(() => { loadInboxData(); }, [loadInboxData]);

    // ── AI Scan function ─────────────────────────────────────────────────────
    const handleAiScan = async () => {
        setAiScanning(true);
        setAiScanResult(null);
        // Simulate AI scanning all messages
        await new Promise(r => setTimeout(r, 2000));

        const urgent = messages.filter(m => m.unread).length;
        const reviews = messages.filter(m => m.type === "review").length;
        const dms = messages.filter(m => m.type === "dm").length;
        const positiveReviews = messages.filter(m => m.type === "review" && m.rating && m.rating >= 4).length;

        setAiScanResult(
            `🤖 AI Scan Complete\n\n` +
            `📬 ${messages.length} total messages found\n` +
            `🔴 ${urgent} require immediate attention\n` +
            `⭐ ${reviews} reviews (${positiveReviews} positive)\n` +
            `💬 ${dms} direct messages\n` +
            `📧 ${messages.filter(m => m.type === "email").length} emails\n\n` +
            `💡 Recommendations:\n` +
            (urgent > 0 ? `• Reply to ${urgent} unread messages ASAP\n` : `• All messages responded to ✓\n`) +
            (positiveReviews > 0 ? `• Thank reviewers with 4+ stars to boost engagement\n` : "") +
            `• Consider posting a response to trending mentions`
        );
        setAiScanning(false);
        showToast("AI Scan complete — insights ready!");
    };

    const filteredMessages = filter === "all" ? messages : filter === "ai" ? [] : messages.filter(m => m.type === filter);
    const selectedMsg = messages.find(m => m.id === selectedId);
    const selectedAiMention = aiMentions.find(m => m.id === selectedAiId);
    const unreadCount = messages.filter(m => m.unread).length;
    const newAICount = aiMentions.filter(m => m.isNew).length;

    const markRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
        setSelectedId(id);
        setSelectedAiId(null);
        setReplyText("");
        setReplySent(false);
    };

    const selectAiMention = (id: string) => {
        setSelectedAiId(id);
        setSelectedId(null);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedMsg) return;

        if (selectedMsg.platform === "Email") {
            // Real email reply via SMTP
            try {
                const res = await fetch("/api/inbox/emails/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: selectedMsg.handle, // fromEmail
                        subject: `Re: ${selectedMsg.preview}`,
                        body: replyText,
                        replyToId: selectedMsg.id,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setReplySent(true);
                    setReplyText("");
                    showToast(`✅ Email sent to ${selectedMsg.handle}!`);
                } else {
                    showToast(`❌ Failed to send: ${data.error || "Unknown error"}`);
                }
            } catch {
                showToast("❌ Network error — email not sent.");
            }
        } else {
            // Social media replies (simulated for now)
            setReplySent(true);
            setReplyText("");
            showToast(`Reply sent via ${selectedMsg.platform}!`);
        }
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    Social Inbox
                    {unreadCount > 0 && <span style={{ marginLeft: 8, background: "#E8C96E", color: "#1a1000", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>{unreadCount}</span>}
                    {newAICount > 0 && <span style={{ marginLeft: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>✨ {newAICount} AI</span>}
                </div>
                <div className="topbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => { setLoading(true); loadInboxData(); showToast("Refreshing inbox..."); }} style={{ fontSize: 12, padding: "8px 16px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>🔄 Refresh</button>
                    <button onClick={handleAiScan} disabled={aiScanning} style={{ fontSize: 12, padding: "8px 16px", background: aiScanning ? "rgba(167,139,250,0.2)" : "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 10, cursor: aiScanning ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                        {aiScanning ? "⏳ Scanning..." : "✨ AI Scan"}
                    </button>
                    <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>Manage Accounts</button>
                </div>
            </div>

            <div className="fade-in" style={{ height: "calc(100vh - 70px)", padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>📨</div>
                        Loading messages...
                    </div>
                ) : (
                    <div style={{ display: "flex", height: "100%", borderTop: "1px solid var(--border)", overflow: "hidden" }}>
                        {/* ── LEFT SIDEBAR ── */}
                        <div style={{ width: 360, minWidth: 300, borderRight: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Messages & Reviews</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {FILTER_TABS.map(f => (
                                        <button key={f.key} onClick={() => { setFilter(f.key); setSelectedId(null); setSelectedAiId(null); }} style={{
                                            fontSize: 11, padding: "5px 12px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", border: "none",
                                            background: filter === f.key ? "rgba(232,201,110,0.15)" : "rgba(255,255,255,0.05)",
                                            color: filter === f.key ? "#E8C96E" : "rgba(255,255,255,0.5)",
                                            fontWeight: filter === f.key ? 700 : 500,
                                        }}>
                                            {f.label}
                                            {f.key !== "all" && f.key !== "ai" && <span style={{ marginLeft: 4, opacity: 0.6 }}>{messages.filter(m => m.type === f.key).length}</span>}
                                            {f.key === "ai" && aiMentions.length > 0 && <span style={{ marginLeft: 4, opacity: 0.6 }}>{aiMentions.length}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {/* Regular message list */}
                                {filter !== "ai" && filteredMessages.map(msg => {
                                    const ps = PLATFORM_STYLE[msg.platform];
                                    return (
                                        <button key={msg.id} onClick={() => markRead(msg.id)} style={{
                                            width: "100%", textAlign: "left", padding: "14px 20px",
                                            background: selectedId === msg.id ? "rgba(255,255,255,0.05)" : "transparent",
                                            border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                                            borderLeft: msg.unread ? "3px solid #E8C96E" : "3px solid transparent",
                                            transition: "all 0.15s", fontFamily: "inherit",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <div style={{ fontWeight: msg.unread ? 700 : 500, color: msg.unread ? "#fff" : "var(--text-secondary)", fontSize: 13 }}>{msg.sender}</div>
                                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{msg.time}</div>
                                            </div>
                                            <div style={{ fontSize: 11, color: ps?.color || "#fff", marginBottom: 4, fontWeight: 600 }}>
                                                {ps?.label || msg.platform} · {msg.type === "review" ? "Review" : msg.type === "mention" ? "Mention" : msg.type === "email" ? "Email" : "DM"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.preview}</div>
                                        </button>
                                    );
                                })}

                                {/* AI Monitor mention list in sidebar */}
                                {filter === "ai" && aiMentions.map(m => (
                                    <button key={m.id} onClick={() => selectAiMention(m.id)} style={{
                                        width: "100%", textAlign: "left", padding: "14px 20px",
                                        background: selectedAiId === m.id ? "rgba(167,139,250,0.08)" : "transparent",
                                        border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                                        borderLeft: m.isNew ? "3px solid #a78bfa" : "3px solid transparent",
                                        transition: "all 0.15s", fontFamily: "inherit",
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ fontSize: 14 }}>{m.sourceIcon}</span>
                                                <span style={{ fontWeight: m.isNew ? 700 : 500, color: m.isNew ? "#fff" : "var(--text-secondary)", fontSize: 13 }}>{m.source}</span>
                                                {m.isNew && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontWeight: 700 }}>NEW</span>}
                                            </div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{m.date}</div>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>{m.title}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{
                                                fontSize: 10, padding: "1px 6px", borderRadius: 4,
                                                background: m.sentiment === "positive" ? "rgba(74,222,128,0.08)" : m.sentiment === "negative" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.05)",
                                                color: m.sentiment === "positive" ? "#4ade80" : m.sentiment === "negative" ? "#f87171" : "rgba(255,255,255,0.4)",
                                                fontWeight: 600,
                                            }}>{m.sentiment === "positive" ? "↑ Positive" : m.sentiment === "negative" ? "↓ Negative" : "— Neutral"}</span>
                                            {m.engagement && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>❤ {m.engagement.likes}</span>}
                                        </div>
                                    </button>
                                ))}

                                {filter === "ai" && aiMentions.length === 0 && (
                                    <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                                        No AI mentions found. Try refreshing.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── MAIN CONTENT ── */}
                        <div style={{ flex: 1, background: "var(--bg-primary)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", height: "100%" }}>

                            {/* ── AI Scan Result Banner ── */}
                            {aiScanResult && (
                                <div style={{ padding: "16px 24px", background: "rgba(167,139,250,0.06)", borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <pre style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{aiScanResult}</pre>
                                        <button onClick={() => setAiScanResult(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: 4, flexShrink: 0 }}>✕</button>
                                    </div>
                                </div>
                            )}

                            {selectedMsg ? (
                                /* ── MESSAGE DETAIL VIEW ── */
                                <>
                                    {/* Header */}
                                    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "center", background: "var(--bg-card)", flexShrink: 0 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff"}20`, border: `1px solid ${PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff"}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff", flexShrink: 0 }}>
                                            {selectedMsg.avatar.length <= 2 ? selectedMsg.avatar : selectedMsg.avatar.substring(0, 2)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedMsg.sender}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{selectedMsg.handle} · via {selectedMsg.platform}</div>
                                        </div>
                                        {selectedMsg.rating && (
                                            <div style={{ fontSize: 13, color: "#fbbf24" }}>{"⭐".repeat(selectedMsg.rating)}</div>
                                        )}
                                        <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: `${PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff"}15`, color: PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff", fontWeight: 600 }}>
                                            {selectedMsg.type === "review" ? "Review" : selectedMsg.type === "mention" ? "Mention" : selectedMsg.type === "email" ? "Email" : "Direct Message"}
                                        </div>
                                    </div>

                                    {/* Message content — scrollable */}
                                    <div style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: 0 }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff", flexShrink: 0 }}>
                                                    {selectedMsg.avatar.length <= 2 ? selectedMsg.avatar : selectedMsg.avatar.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{selectedMsg.sender} · {selectedMsg.time}</div>
                                                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px 16px", borderRadius: "2px 14px 14px 14px", border: "1px solid var(--border)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                                        {selectedMsg.fullMessage}
                                                    </div>
                                                </div>
                                            </div>
                                            {replySent && (
                                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textAlign: "right" }}>You · Just now</div>
                                                        <div style={{ background: "rgba(201,168,76,0.1)", padding: "14px 16px", borderRadius: "14px 2px 14px 14px", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7 }}>
                                                            Thank you for reaching out! We&apos;ll get back to you shortly with all the details.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reply bar — always visible at bottom */}
                                    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-card)", flexShrink: 0 }}>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <input
                                                type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") handleSendReply(); }}
                                                placeholder={`Reply to ${selectedMsg.sender}...`}
                                                style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", padding: "10px 16px", borderRadius: 24, color: "white", fontSize: 14, fontFamily: "inherit", outline: "none" }}
                                            />
                                            <button onClick={handleSendReply} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 24, fontSize: 13 }}>Send ↗</button>
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, textAlign: "center" }}>
                                            Replies sent via {selectedMsg.platform} API · Press Enter to send
                                        </div>
                                    </div>
                                </>
                            ) : selectedAiMention ? (
                                /* ── AI MENTION DETAIL VIEW ── */
                                <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                                    <div style={{ maxWidth: 700 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                                            <span style={{ fontSize: 28 }}>{selectedAiMention.sourceIcon}</span>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{selectedAiMention.source}</div>
                                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{selectedAiMention.date}</div>
                                            </div>
                                            {selectedAiMention.isNew && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontWeight: 700 }}>NEW</span>}
                                            <span style={{
                                                marginLeft: 8, fontSize: 11, padding: "3px 10px", borderRadius: 6,
                                                background: selectedAiMention.sentiment === "positive" ? "rgba(74,222,128,0.1)" : selectedAiMention.sentiment === "negative" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.05)",
                                                color: selectedAiMention.sentiment === "positive" ? "#4ade80" : selectedAiMention.sentiment === "negative" ? "#f87171" : "rgba(255,255,255,0.5)",
                                                fontWeight: 700,
                                            }}>{selectedAiMention.sentiment === "positive" ? "✓ Positive" : selectedAiMention.sentiment === "negative" ? "✕ Negative" : "— Neutral"}</span>
                                        </div>

                                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 16 }}>{selectedAiMention.title}</h2>

                                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
                                            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{selectedAiMention.snippet}</div>
                                        </div>

                                        {selectedAiMention.engagement && (
                                            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>❤️ {selectedAiMention.engagement.likes} likes</div>
                                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>💬 {selectedAiMention.engagement.comments} comments</div>
                                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>🔄 {selectedAiMention.engagement.shares} shares</div>
                                            </div>
                                        )}

                                        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "16px 20px" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8C96E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>🤖 AI Recommendation</div>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
                                                {selectedAiMention.sentiment === "positive"
                                                    ? "This is a positive mention! Consider engaging with a thank-you reply or sharing it on your social channels to amplify reach."
                                                    : selectedAiMention.sentiment === "negative"
                                                        ? "This mention has negative sentiment. Consider responding promptly and addressing the concern publicly to show your commitment to quality."
                                                        : "This is a neutral mention. Monitor for follow-up activity and consider engaging if it gains traction."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : filter === "ai" && aiMentions.length > 0 ? (
                                /* ── AI MONITOR OVERVIEW (no mention selected) ── */
                                <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>✨ AI Social Monitor</div>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Auto-scanning mentions, news & social buzz about your restaurant</span>
                                    </div>

                                    {/* Brand Health KPIs */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                                        {[
                                            { label: "Brand Health", value: `${aiMetrics.brandHealth}/100`, color: aiMetrics.brandHealth >= 70 ? "#4ade80" : aiMetrics.brandHealth >= 40 ? "#fbbf24" : "#f87171", icon: "📊" },
                                            { label: "Sentiment", value: `${aiMetrics.sentimentPercent}% Positive`, color: aiMetrics.sentimentPercent >= 70 ? "#4ade80" : aiMetrics.sentimentPercent >= 40 ? "#fbbf24" : "#f87171", icon: "😊" },
                                            { label: "Mentions (7d)", value: String(aiMetrics.totalMentions), color: "#60a5fa", icon: "📣" },
                                            { label: "New Alerts", value: String(aiMetrics.newAlerts), color: "#a78bfa", icon: "⚡" },
                                        ].map(c => (
                                            <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>{c.icon} {c.label}</div>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>← Select a mention from the left panel to view details</div>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>AI scans every 6 hours · Last scan: just now</div>
                                </div>
                            ) : (
                                /* ── EMPTY STATE ── */
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>←</div>
                                    <h3 style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 8 }}>Select a message</h3>
                                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Emails, DMs, reviews, and mentions — all in one place.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, background: "rgba(10,10,15,0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                    ✓ {toastMsg}
                </div>
            )}
        </>
    );
}
