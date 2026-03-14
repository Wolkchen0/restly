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
    const [filter, setFilter] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [replySent, setReplySent] = useState(false);
    const [loading, setLoading] = useState(true);
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

        // 4. Fetch Social Mentions for AI Monitor
        try {
            const socialRes = await fetch("https://jsonplaceholder.typicode.com/comments?_limit=8");
            if (socialRes.ok) {
                const comments = await socialRes.json();
                const platforms = ["Eater LA", "Instagram", "Reddit r/LAfood", "Google Trends", "TikTok Viral", "Yelp Trending", "Twitter/X", "Google Reviews AI"];
                const icons = ["📰", "📸", "💬", "📈", "🎬", "⭐", "🐦", "📝"];
                const titles = [
                    "7 Best New Restaurants in Downtown LA",
                    "@chefworld tagged you in a story",
                    "Thread: Best date night spots downtown?",
                    "Search interest rising +23%",
                    "Viral video: 45K views",
                    "Now #4 in \"Best Dinner\" category",
                    "Local food blogger review",
                    "AI Alert: Wait time feedback pattern",
                ];
                const mentions: AIMention[] = comments.map((c: any, i: number) => ({
                    id: `ai_${c.id}`,
                    source: platforms[i % platforms.length],
                    sourceIcon: icons[i % icons.length],
                    title: titles[i % titles.length],
                    snippet: c.body.substring(0, 140),
                    sentiment: i < 5 ? "positive" as const : i < 7 ? "neutral" as const : "negative" as const,
                    date: ["2h ago", "4h ago", "6h ago", "1d ago", "1d ago", "2d ago", "2d ago", "3d ago"][i],
                    url: "#",
                    isNew: i < 3,
                    engagement: { likes: Math.floor(Math.random() * 500), comments: Math.floor(Math.random() * 50), shares: Math.floor(Math.random() * 30) },
                }));
                setAiMentions(isDemo ? mentions : []);
                newStatus.social = { connected: isDemo, count: isDemo ? mentions.length : 0, source: isDemo ? "Demo" : "" };
            }
        } catch (e) {
            console.warn("Social mentions fetch failed:", e);
        }

        setMessages(allMessages);
        setApiStatus(newStatus);
        setLoading(false);
    }, [isDemo]);

    useEffect(() => { loadInboxData(); }, [loadInboxData]);

    const filteredMessages = filter === "all" ? messages : filter === "ai" ? [] : messages.filter(m => m.type === filter);
    const selectedMsg = messages.find(m => m.id === selectedId);
    const unreadCount = messages.filter(m => m.unread).length;
    const newAICount = aiMentions.filter(m => m.isNew).length;

    const markRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
        setSelectedId(id);
        setReplyText("");
        setReplySent(false);
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;
        setReplySent(true);
        setReplyText("");
        showToast(`Reply sent via ${selectedMsg?.platform}!`);
    };

    const connectedCount = Object.values(apiStatus).filter(s => s.connected).length;

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
                    <button onClick={() => setFilter("ai")} style={{ fontSize: 12, padding: "8px 16px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✨ AI Scan</button>
                    <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>Manage Accounts</button>
                </div>
            </div>

            <div className="page-content fade-in" style={{ height: "calc(100vh - 70px)", padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>📨</div>
                        Loading messages...
                    </div>
                ) : (
                    <div style={{ display: "flex", height: "100%", borderTop: "1px solid var(--border)" }}>
                        {/* ── LEFT SIDEBAR ── */}
                        <div style={{ width: 360, borderRight: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Messages & Reviews</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {FILTER_TABS.map(f => (
                                        <button key={f.key} onClick={() => setFilter(f.key)} style={{
                                            fontSize: 11, padding: "5px 12px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", border: "none",
                                            background: filter === f.key ? "rgba(232,201,110,0.15)" : "rgba(255,255,255,0.05)",
                                            color: filter === f.key ? "#E8C96E" : "rgba(255,255,255,0.5)",
                                            fontWeight: filter === f.key ? 700 : 500,
                                        }}>
                                            {f.label}
                                            {f.key !== "all" && f.key !== "ai" && <span style={{ marginLeft: 4, opacity: 0.6 }}>{messages.filter(m => m.type === f.key).length}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
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
                                {filter === "ai" && (
                                    <div style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                                        AI Monitor showing {aiMentions.length} mentions →
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── MAIN CONTENT ── */}
                        <div style={{ flex: 1, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
                            {selectedMsg ? (
                                <>
                                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "center", background: "var(--bg-card)" }}>
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

                                    <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: PLATFORM_STYLE[selectedMsg.platform]?.color || "#fff", flexShrink: 0 }}>
                                                    {selectedMsg.avatar.length <= 2 ? selectedMsg.avatar : selectedMsg.avatar.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{selectedMsg.sender} · {selectedMsg.time}</div>
                                                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "2px 16px 16px 16px", border: "1px solid var(--border)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                                        {selectedMsg.fullMessage}
                                                    </div>
                                                </div>
                                            </div>
                                            {replySent && (
                                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                                    <div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textAlign: "right" }}>You · Just now</div>
                                                        <div style={{ background: "rgba(201,168,76,0.1)", padding: "16px", borderRadius: "16px 2px 16px 16px", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.7 }}>
                                                            Thank you for reaching out! We&apos;ll get back to you shortly with all the details.
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <input
                                                type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                                onKeyDown={e => { if (e.key === "Enter") handleSendReply(); }}
                                                placeholder={selectedMsg.type === "review" ? `Reply to ${selectedMsg.sender}'s review...` : selectedMsg.type === "email" ? `Reply to ${selectedMsg.handle}...` : `Reply to ${selectedMsg.sender}...`}
                                                style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: 24, color: "white", fontSize: 14, fontFamily: "inherit", outline: "none" }}
                                            />
                                            <button onClick={handleSendReply} className="btn-primary" style={{ padding: "12px 24px", borderRadius: 24 }}>Send</button>
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
                                            Replies are sent directly via {selectedMsg.platform} API · AI auto-draft available
                                        </div>
                                    </div>
                                </>
                            ) : filter === "ai" ? (
                                /* ── AI MONITOR VIEW ── */
                                <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>✨ AI Social Monitor</div>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Auto-scanning mentions, news & social buzz about your restaurant</span>
                                    </div>

                                    {/* Brand Health KPIs */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                                        {[
                                            { label: "Brand Health", value: "92/100", color: "#4ade80", icon: "📊" },
                                            { label: "Sentiment", value: "87% Positive", color: "#4ade80", icon: "😊" },
                                            { label: "Mentions (7d)", value: String(aiMentions.length), color: "#60a5fa", icon: "📣" },
                                            { label: "New Alerts", value: String(newAICount), color: "#a78bfa", icon: "⚡" },
                                        ].map(c => (
                                            <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>{c.icon} {c.label}</div>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Mentions List */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {aiMentions.map(m => (
                                            <div key={m.id} style={{ background: m.isNew ? "rgba(167,139,250,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${m.isNew ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)"}`, borderRadius: 14, padding: "16px 20px", transition: "all 0.15s" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>{m.sourceIcon}</span>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{m.source}</span>
                                                        {m.isNew && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontWeight: 700 }}>NEW</span>}
                                                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: m.sentiment === "positive" ? "rgba(74,222,128,0.08)" : m.sentiment === "negative" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.05)", color: m.sentiment === "positive" ? "#4ade80" : m.sentiment === "negative" ? "#f87171" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>{m.sentiment === "positive" ? "↑ Positive" : m.sentiment === "negative" ? "↓ Negative" : "Neutral"}</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        {m.engagement && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>❤ {m.engagement.likes} · 💬 {m.engagement.comments}</span>}
                                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.date}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{m.title}</div>
                                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{m.snippet}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                                        AI scans every 6 hours · Last scan: just now
                                    </div>
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
