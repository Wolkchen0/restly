"use client";
import { useState, useEffect } from "react";

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
}

const PLATFORM_STYLE: Record<string, { color: string; label: string }> = {
    Email: { color: "#60a5fa", label: "Email" },
    Instagram: { color: "#E1306C", label: "IG" },
    Facebook: { color: "#1877F2", label: "FB" },
    TikTok: { color: "#ff0050", label: "TT" },
    Google: { color: "#4285F4", label: "Google" },
    Yelp: { color: "#D32323", label: "Yelp" },
    X: { color: "#fff", label: "X" },
    OpenTable: { color: "#DA3743", label: "OT" },
};

const DEMO_MESSAGES: Message[] = [
    { id: "msg_e1", platform: "Email", sender: "Jennifer Oaks", handle: "joaks@company.com", avatar: "📧", preview: "Corporate dinner inquiry for 35 guests", fullMessage: "Hi there,\n\nI'm the events coordinator at Oaks & Partners. We're looking to host a corporate dinner for 35 guests on March 28th. We'd need a private dining area, a set menu with vegetarian options, and an open bar for 2 hours.\n\nCould you send us a proposal with pricing? We've dined with you before and the team loved it.\n\nBest regards,\nJennifer Oaks", time: "5m ago", unread: true, type: "email" },
    { id: "msg1", platform: "Instagram", sender: "FoodieGal", handle: "@foodie.gal_ny", avatar: "IG", preview: "Do you have vegan options for a party of 5?", fullMessage: "Hi! I'm planning my birthday dinner for next Friday and we have a party of 5. Two of us are strict vegans. I checked the menu but wanted to ask if the chef can prepare something special? Love your aesthetic!", time: "10m ago", unread: true, type: "dm" },
    { id: "msg_g1", platform: "Google", sender: "Mike R.", handle: "Google Review", avatar: "G", preview: "Exceptional dining — 5 stars", fullMessage: "Had an incredible experience last Saturday. The truffle burger was outstanding, service was attentive but not overbearing. Will definitely be back. The cocktail program is top-notch as well.", time: "1h ago", unread: true, type: "review" },
    { id: "msg2", platform: "Facebook", sender: "John D.", handle: "JohnDoe", avatar: "FB", preview: "What are your holiday hours?", fullMessage: "Hello, I was wondering if you guys are going to be open on Christmas Eve? And if so, do we need to make reservations weeks in advance?", time: "2h ago", unread: true, type: "dm" },
    { id: "msg_x1", platform: "X", sender: "LA Foodie", handle: "@lafoodie", avatar: "X", preview: "Anyone tried @meyhouse? The lamb chops are insane", fullMessage: "Anyone tried @meyhouse recently? The lamb chops are absolutely insane. Best I've had in LA. The vibe is perfect for date night too. Highly recommend the Old Fashioned.", time: "3h ago", unread: false, type: "mention" },
    { id: "msg3", platform: "TikTok", sender: "Eats by Sam", handle: "@eatsbysam", avatar: "TT", preview: "Loved the lamb chops video! Collab?", fullMessage: "That lamb chop video you just posted is INSANE!! Definitely coming by this weekend. Do you guys do collaborations? I have 50k followers and would love to review your spot.", time: "4h ago", unread: false, type: "dm" },
    { id: "msg_y1", platform: "Yelp", sender: "Anna L.", handle: "Yelp Review", avatar: "Y", preview: "Great food but wait time was long — 4 stars", fullMessage: "Food was amazing as always. The lobster risotto is a must-try. Only issue was we waited 25 minutes past our reservation time on a Friday night. Once seated, everything was perfect. Would appreciate better wait time management.", time: "6h ago", unread: false, type: "review" },
    { id: "msg_e2", platform: "Email", sender: "David Kim", handle: "dkim@gmail.com", avatar: "📧", preview: "Allergy question before our visit", fullMessage: "Hello,\n\nMy wife has a severe tree nut allergy. We have a reservation for this Saturday at 7pm under Kim. Could you please confirm which dishes are safe for her? We want to avoid any cross-contamination.\n\nThank you,\nDavid", time: "8h ago", unread: false, type: "email" },
    { id: "msg_ot1", platform: "OpenTable", sender: "Sarah M.", handle: "OpenTable Review", avatar: "OT", preview: "Perfect anniversary dinner — 5 stars", fullMessage: "We celebrated our 10th anniversary here and it was perfect. The staff arranged a special dessert with candles, and the wine pairing recommendation from our server Lisa was spot-on. Thank you for making it memorable!", time: "1d ago", unread: false, type: "review" },
];

const FILTER_TABS = [
    { key: "all", label: "All" },
    { key: "email", label: "Email" },
    { key: "dm", label: "DMs" },
    { key: "review", label: "Reviews" },
    { key: "mention", label: "Mentions" },
    { key: "ai", label: "✨ AI Monitor" },
];

// AI-Discovered mentions, news, social buzz
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
}
const AI_MENTIONS: AIMention[] = [
    { id: "ai1", source: "Eater LA", sourceIcon: "📰", title: "7 Best New Restaurants in Downtown LA", snippet: "...Sample Rest. made the list for their exceptional truffle burger and craft cocktail program. The ambiance strikes a perfect balance between upscale and approachable...", sentiment: "positive", date: "2h ago", url: "#", isNew: true },
    { id: "ai2", source: "Instagram", sourceIcon: "📸", title: "@chefworld tagged you in a story", snippet: "Amazing dinner at @samplerest tonight! The wagyu was cooked to perfection. Must visit if you're in SF. #finedining #bayareafood", sentiment: "positive", date: "4h ago", url: "#", isNew: true },
    { id: "ai3", source: "Reddit r/LosAngelesfood", sourceIcon: "💬", title: "Thread: Best date night spots downtown?", snippet: "Multiple users recommended Sample Rest. Highlights: ambiance, cocktail menu, truffle fries. One complaint about weekend wait times.", sentiment: "positive", date: "6h ago", url: "#", isNew: true },
    { id: "ai4", source: "Google Trends", sourceIcon: "📈", title: "Search interest rising +23%", snippet: "\"Sample Restaurant downtown\" search queries increased 23% this week compared to last week. Peak search times: Friday 5-7pm, Saturday 12-2pm.", sentiment: "positive", date: "1d ago", url: "#", isNew: false },
    { id: "ai5", source: "TikTok", sourceIcon: "🎬", title: "Viral video: 45K views", snippet: "User @eatsbysam posted a 30-sec video of the lamb chops presentation. 45K views, 3.2K likes, 180 comments. Top comment: \"Adding this to my list!\"", sentiment: "positive", date: "1d ago", url: "#", isNew: false },
    { id: "ai6", source: "Yelp Trending", sourceIcon: "⭐", title: "Now #4 in \"Best Dinner\" category", snippet: "Moved up from #7 to #4 in Yelp's \"Best Dinner\" category for downtown area. Average rating: 4.6/5 from 342 reviews.", sentiment: "positive", date: "2d ago", url: "#", isNew: false },
    { id: "ai7", source: "Twitter/X", sourceIcon: "🐦", title: "Local food blogger @sfbites review", snippet: "\"The lobster bisque at Sample Rest. is hands down the best I've had in SF. Rich, creamy, perfectly seasoned. Worth every penny.\"", sentiment: "positive", date: "2d ago", url: "#", isNew: false },
    { id: "ai8", source: "Google Reviews", sourceIcon: "📝", title: "AI Alert: Negative review pattern", snippet: "3 reviews in the past week mention \"long wait time\" on Friday/Saturday evenings. Consider adjusting reservation spacing or adding a waitlist system.", sentiment: "negative", date: "3d ago", url: "#", isNew: false },
];

export default function SocialInboxPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [filter, setFilter] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [replySent, setReplySent] = useState(false);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                if (!!restName) {
                    setIsDemo(true);
                    setIsConnected(true);
                    setMessages(DEMO_MESSAGES);
                } else {
                    setIsConnected(false);
                }
            })
            .catch(() => setIsConnected(false));
    }, []);

    const filteredMessages = filter === "all" ? messages : messages.filter(m => m.type === filter);
    const selectedMsg = messages.find(m => m.id === selectedId);
    const unreadCount = messages.filter(m => m.unread).length;

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
    };

    const getAvatarStyle = (msg: Message) => {
        const ps = PLATFORM_STYLE[msg.platform];
        return {
            width: 36, height: 36, borderRadius: "50%",
            background: `${ps.color}20`, border: `1px solid ${ps.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: ps.color, flexShrink: 0,
        };
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    Social Inbox
                    {unreadCount > 0 && <span style={{ marginLeft: 8, background: "#E8C96E", color: "#1a1000", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>{unreadCount}</span>}
                    {AI_MENTIONS.filter(m => m.isNew).length > 0 && <span style={{ marginLeft: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>✨ {AI_MENTIONS.filter(m => m.isNew).length} AI</span>}
                </div>
                <div className="topbar-right" style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setFilter("ai")} style={{ fontSize: 12, padding: "8px 16px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>✨ AI Scan</button>
                    <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>Manage Accounts</button>
                </div>
            </div>

            <div className="page-content fade-in" style={{ height: "calc(100vh - 70px)", padding: 0, overflow: "hidden" }}>
                {isConnected === null ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Checking connection...</div>
                ) : isConnected ? (
                    <div style={{ display: "flex", height: "100%", borderTop: "1px solid var(--border)" }}>
                        {/* Sidebar */}
                        <div style={{ width: 360, borderRight: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Messages & Reviews</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {FILTER_TABS.map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFilter(f.key)}
                                            style={{
                                                fontSize: 11, padding: "5px 12px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit", border: "none",
                                                background: filter === f.key ? "rgba(232,201,110,0.15)" : "rgba(255,255,255,0.05)",
                                                color: filter === f.key ? "#E8C96E" : "rgba(255,255,255,0.5)",
                                                fontWeight: filter === f.key ? 700 : 500,
                                            }}
                                        >
                                            {f.label}
                                            {f.key !== "all" && <span style={{ marginLeft: 4, opacity: 0.6 }}>{messages.filter(m => m.type === f.key).length}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {filteredMessages.map(msg => {
                                    const ps = PLATFORM_STYLE[msg.platform];
                                    return (
                                        <button
                                            key={msg.id}
                                            onClick={() => markRead(msg.id)}
                                            style={{
                                                width: "100%", textAlign: "left", padding: "14px 20px",
                                                background: selectedId === msg.id ? "rgba(255,255,255,0.05)" : "transparent",
                                                border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                                                borderLeft: msg.unread ? "3px solid #E8C96E" : "3px solid transparent",
                                                transition: "all 0.15s", fontFamily: "inherit",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <div style={{ fontWeight: msg.unread ? 700 : 500, color: msg.unread ? "#fff" : "var(--text-secondary)", fontSize: 13 }}>
                                                    {msg.sender}
                                                </div>
                                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{msg.time}</div>
                                            </div>
                                            <div style={{ fontSize: 11, color: ps.color, marginBottom: 4, fontWeight: 600 }}>
                                                {ps.label} · {msg.type === "review" ? "Review" : msg.type === "mention" ? "Mention" : msg.type === "email" ? "Email" : "DM"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {msg.preview}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
                            {selectedMsg ? (
                                <>
                                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "center", background: "var(--bg-card)" }}>
                                        <div style={getAvatarStyle(selectedMsg) as any}>
                                            {selectedMsg.avatar.length <= 2 ? selectedMsg.avatar : selectedMsg.avatar.substring(0, 2)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedMsg.sender}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{selectedMsg.handle} · via {selectedMsg.platform}</div>
                                        </div>
                                        <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: `${PLATFORM_STYLE[selectedMsg.platform].color}15`, color: PLATFORM_STYLE[selectedMsg.platform].color, fontWeight: 600 }}>
                                            {selectedMsg.type === "review" ? "Review" : selectedMsg.type === "mention" ? "Mention" : selectedMsg.type === "email" ? "Email" : "Direct Message"}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <div style={getAvatarStyle(selectedMsg) as any}>
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
                                                type="text"
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
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
                                /* AI MONITOR VIEW */
                                <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>✨ AI Social Monitor</div>
                                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Auto-scanning mentions, news & social buzz about your restaurant</span>
                                    </div>

                                    {/* Brand Health */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                                        {[
                                            { label: "Brand Health", value: "92/100", color: "#4ade80", icon: "📊" },
                                            { label: "Sentiment", value: "87% Positive", color: "#4ade80", icon: "😊" },
                                            { label: "Mentions (7d)", value: "34", color: "#60a5fa", icon: "📣" },
                                            { label: "New Alerts", value: String(AI_MENTIONS.filter(m => m.isNew).length), color: "#a78bfa", icon: "⚡" },
                                        ].map(c => (
                                            <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
                                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>{c.icon} {c.label}</div>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Mentions List */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {AI_MENTIONS.map(m => (
                                            <div key={m.id} style={{ background: m.isNew ? "rgba(167,139,250,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${m.isNew ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)"}`, borderRadius: 14, padding: "16px 20px", transition: "all 0.15s" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>{m.sourceIcon}</span>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{m.source}</span>
                                                        {m.isNew && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontWeight: 700 }}>NEW</span>}
                                                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: m.sentiment === "positive" ? "rgba(74,222,128,0.08)" : m.sentiment === "negative" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.05)", color: m.sentiment === "positive" ? "#4ade80" : m.sentiment === "negative" ? "#f87171" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>{m.sentiment === "positive" ? "↑ Positive" : m.sentiment === "negative" ? "↓ Negative" : "Neutral"}</span>
                                                    </div>
                                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{m.date}</span>
                                                </div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{m.title}</div>
                                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{m.snippet}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>AI scans every 6 hours · Last scan: 2h ago</div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
                                    <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>←</div>
                                    <h3 style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 4 }}>Select a message</h3>
                                    <p style={{ fontSize: 13 }}>Emails, DMs, reviews, and mentions — all in one place.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: 48, display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                        <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Connect Your Channels</h2>
                            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
                                Bring your emails, Instagram DMs, Facebook messages, Google & Yelp reviews, X mentions, and TikTok DMs into one unified inbox. Never miss a message again.
                            </p>
                            <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                                Connect Channels
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
