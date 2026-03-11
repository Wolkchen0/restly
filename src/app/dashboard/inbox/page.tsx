"use client";
import { useState, useEffect } from "react";

interface Message {
    id: string;
    platform: "Instagram" | "Facebook" | "TikTok";
    sender: string;
    handle: string;
    avatar: string;
    preview: string;
    fullMessage: string;
    time: string;
    unread: boolean;
}

const DEMO_MESSAGES: Message[] = [
    { id: "msg1", platform: "Instagram", sender: "FoodieGal", handle: "@foodie.gal_ny", avatar: "👩🏻‍", preview: "Hi! Do you have vegan options for a party of 5?", fullMessage: "Hi! I'm planning my birthday dinner for next Friday and we have a party of 5. Two of us are strict vegans. I checked the menu but wanted to ask if the chef can prepare something special? Love your aesthetic! ✨", time: "10m ago", unread: true },
    { id: "msg2", platform: "Facebook", sender: "John D.", handle: "JohnDoe", avatar: "🧔🏼‍♂️", preview: "What are your holiday hours?", fullMessage: "Hello, I was wondering if you guys are going to be open on Christmas Eve? And if so, do we need to make reservations weeks in advance?", time: "2h ago", unread: true },
    { id: "msg3", platform: "TikTok", sender: "Eats by Sam", handle: "@eatsbysam", avatar: "👨🏻", preview: "Loved the lamb chops video! 🥩", fullMessage: "That lamb chop video you just posted is INSANE!! Definitely coming by this weekend. Do you guys do collaborations? I have 50k followers and would love to review your spot.", time: "4h ago", unread: false },
    { id: "msg4", platform: "Instagram", sender: "Catering Solutions", handle: "@catering_nyc", avatar: "🏢", preview: "Corporate booking inquiry", fullMessage: "Hello, we are looking to book a venue for our company's end-of-year dinner. Roughly 40 people. Do you offer set menus for large groups?", time: "1d ago", unread: false },
];

export default function SocialInboxPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean | null>(null); // null means loading
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                // Show sample data for any logged-in demo/test brand
                if (!!restName) {
                    setIsDemo(true);
                    setIsConnected(true);
                    setMessages(DEMO_MESSAGES);
                } else {
                    fetch("/api/inbox")
                        .then(r => r.json())
                        .then(inboxData => {
                            if (inboxData.connected) {
                                setIsConnected(true);
                                setMessages(inboxData.messages || []);
                            } else {
                                setIsConnected(false);
                            }
                        })
                        .catch(() => setIsConnected(false));
                }
            })
            .catch(() => setIsConnected(false));
    }, []);

    const selectedMsg = messages.find(m => m.id === selectedId);

    const markRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
        setSelectedId(id);
    };

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">💬 Social Inbox</div>
                <div className="topbar-right">
                    <button className="btn-secondary" onClick={() => window.location.href = '/dashboard/settings'}>⚙️ Manage Accounts</button>
                </div>
            </div>

            <div className="page-content fade-in" style={{ height: "calc(100vh - 70px)", padding: 0, overflow: "hidden" }}>
                {isConnected === null ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Checking connection...</div>
                ) : isConnected ? (
                    <div style={{ display: "flex", height: "100%", borderTop: "1px solid var(--border)" }}>
                        {/* Sidebar */}
                        <div style={{ width: 350, borderRight: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>Unified Messages</div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Aggregating IG, FB & TikTok</div>
                            </div>
                            <div style={{ flex: 1, overflowY: "auto" }}>
                                {messages.map(msg => (
                                    <button
                                        key={msg.id}
                                        onClick={() => markRead(msg.id)}
                                        style={{
                                            width: "100%", textAlign: "left", padding: "16px 20px",
                                            background: selectedId === msg.id ? "rgba(255,255,255,0.05)" : "transparent",
                                            border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                                            borderLeft: msg.unread ? "3px solid #E8C96E" : "3px solid transparent",
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <div style={{ fontWeight: msg.unread ? 800 : 600, color: msg.unread ? "#fff" : "var(--text-secondary)", fontSize: 14 }}>
                                                {msg.sender}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{msg.time}</div>
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                            {msg.platform === "Instagram" && <span style={{ color: "#E1306C" }}>📸 IG</span>}
                                            {msg.platform === "Facebook" && <span style={{ color: "#1877F2" }}>📘 FB</span>}
                                            {msg.platform === "TikTok" && <span style={{ color: "#ff0050" }}>🎵 TT</span>}
                                            · {msg.handle}
                                        </div>
                                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {msg.preview}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
                            {selectedMsg ? (
                                <>
                                    <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 16, alignItems: "center", background: "var(--bg-card)" }}>
                                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                                            {selectedMsg.avatar}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedMsg.sender}</div>
                                            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{selectedMsg.handle} · via {selectedMsg.platform}</div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    {selectedMsg.avatar}
                                                </div>
                                                <div style={{ background: "rgba(255,255,255,0.05)", padding: "16px", borderRadius: "2px 16px 16px 16px", border: "1px solid var(--border)", color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 1.5 }}>
                                                    {selectedMsg.fullMessage}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "20px", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <input
                                                type="text"
                                                placeholder={`Reply to @${selectedMsg.sender}...`}
                                                style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: 24, color: "white", fontSize: 14 }}
                                            />
                                            <button className="btn-primary" style={{ padding: "12px 24px", borderRadius: 24 }}>Send</button>
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
                                            ✦ Restly AI can draft replies automatically based on your FAQs.
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                                    <h3 style={{ fontSize: 18, color: "var(--text-secondary)" }}>Select a message to start</h3>
                                    <p style={{ fontSize: 14 }}>Engage directly with your guests from all platforms.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: 48, display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                        <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Social Media Not Connected</h2>
                            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
                                Bring your Instagram, Facebook, and TikTok DMs into one unified inbox. Never miss a catering request, influencer outreach, or guest question again.
                            </p>
                            <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                                Connect Social Media Profiles
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
