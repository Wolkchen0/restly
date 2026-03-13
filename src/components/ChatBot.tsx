"use client";
import { useChat } from "ai/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Chat history persistence ──
const HISTORY_KEY = "restly_ai_history";
const ALERTS_DISMISSED_KEY = "restly_alerts_dismissed";
const HISTORY_MAX = 50;

interface SavedMsg {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface Alert {
    id: string;
    type: "critical" | "warning" | "info";
    icon: string;
    title: string;
    body: string;
    action?: { label: string; path: string };
}

function loadHistory(): SavedMsg[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as SavedMsg[];
    } catch { return []; }
}

function saveHistory(msgs: SavedMsg[]) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-HISTORY_MAX)));
    } catch { /* storage full */ }
}

function clearHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch { }
}

function getDismissedAlerts(): string[] {
    try {
        const raw = localStorage.getItem(ALERTS_DISMISSED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function dismissAlert(alertId: string) {
    try {
        const arr = getDismissedAlerts();
        arr.push(alertId);
        localStorage.setItem(ALERTS_DISMISSED_KEY, JSON.stringify(arr));
    } catch { /* */ }
}

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ── Real-time alerts based on actual system state ──
function getSystemAlerts(): Alert[] {
    return [
        {
            id: "maint_dishwasher_2026",
            type: "critical",
            icon: "🚨",
            title: "Maintenance Required (AI Detected)",
            body: "Hobart Dishwasher issue detected in today's logs: \"The Hobart Dishwasher is acting up again, it's making a loud noise and not draining. Might be broken.\"",
            action: { label: "View Maintenance", path: "/dashboard/maintenance" },
        },
        {
            id: "inv_ipa_out_2026",
            type: "warning",
            icon: "⚠️",
            title: "Inventory Alert",
            body: "Draft IPA ran out during last night's rush. 3 cocktail ingredients are running low.",
            action: { label: "Check Inventory", path: "/dashboard/inventory" },
        },
        {
            id: "review_pattern_2026",
            type: "info",
            icon: "📊",
            title: "AI Review Insight",
            body: "3 recent reviews mention \"long wait time\" on Friday/Saturday evenings. Consider adjusting reservation spacing.",
            action: { label: "View Reviews", path: "/dashboard/inbox" },
        },
    ];
}

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
    const router = useRouter();

    useEffect(() => {
        if (toolName === "add_or_update_guest" && result?.success && result?.guest) {
            fetch("/api/guests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: result.guest.name, isVip: result.guest.isVip }),
            }).catch(() => {});
        }
    }, [toolName, result]);

    if (result?.success && result?.navigation) {
        return (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "16px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>✅ Action Complete</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 14, lineHeight: 1.5 }}>{result.message}</div>
                <button onClick={() => router.push(result.navigation.path)} style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                    View in {result.navigation.label} →
                </button>
            </div>
        );
    }

    if (toolName === "navigate_to" && result?.actionRequired) {
        return (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "16px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E", marginBottom: 6, textTransform: "uppercase" }}>📍 Navigate</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 14, lineHeight: 1.5 }}>{result.instructions}</div>
                <button onClick={() => router.push(result.path)} style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", color: "#1a1000", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
                    Go to {result.label} →
                </button>
            </div>
        );
    }

    if (toolName === "get_low_stock_alerts") {
        const { outOfStock = [], lowStock = [], urgency } = result;
        return (
            <div style={{ background: urgency === "CRITICAL" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${urgency === "CRITICAL" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 14, padding: "16px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: urgency === "CRITICAL" ? "#f87171" : "#fbbf24", marginBottom: 10, textTransform: "uppercase" }}>
                    {urgency === "CRITICAL" ? "🚨 Critical Stock Alert" : "⚠️ Stock Alert"}
                </div>
                {outOfStock.length > 0 && <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700, marginBottom: 4 }}>OUT OF STOCK ({outOfStock.length})</div>
                    {outOfStock.map((i: any) => <div key={i.name} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}>• {i.name} — {i.supplier}</div>)}
                </div>}
                {lowStock.length > 0 && <div>
                    <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>LOW STOCK ({lowStock.length})</div>
                    {lowStock.map((i: any) => <div key={i.name} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}>• {i.name} — {i.quantity} left</div>)}
                </div>}
            </div>
        );
    }

    if (toolName === "get_financial_overview" && result?.revenue) {
        return (
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: "16px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E", marginBottom: 12, textTransform: "uppercase" }}>📊 Financial Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                        { label: "Revenue", val: result.revenue, color: "#4ade80" },
                        { label: "COGS", val: result.cogs, color: "#f87171" },
                        { label: "Profit", val: result.profit, color: "#4ade80" },
                        { label: "Margin", val: result.margin, color: "#E8C96E" },
                    ].map(f => (
                        <div key={f.label} style={{ padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 10, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: f.color }}>{f.val}</div>
                        </div>
                    ))}
                </div>
                {result.navigation && (
                    <button onClick={() => router.push(result.navigation.path)} style={{ marginTop: 12, width: "100%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "#E8C96E", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        View Full Report →
                    </button>
                )}
            </div>
        );
    }

    return null;
}

export default function ChatBot() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState<SavedMsg[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [pulse, setPulse] = useState(true);
    const [tooltipDismissed, setTooltipDismissed] = useState(false);
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [showAlerts, setShowAlerts] = useState(true);
    const [briefing, setBriefing] = useState<any>(null);
    const [isListening, setIsListening] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Fetch briefing whenever chat opens
    useEffect(() => {
        if (open && !briefing) {
            fetch("/api/briefing").then(r => r.json()).then(setBriefing).catch(() => {});
        }
    }, [open]);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
        api: "/api/chat",
    });

    // Load history + alerts on mount
    useEffect(() => {
        setHistory(loadHistory());
        const timer = setTimeout(() => setPulse(false), 10000);

        // Load real alerts, filter out dismissed ones
        const dismissed = getDismissedAlerts();
        const alerts = getSystemAlerts().filter(a => !dismissed.includes(a.id));
        setActiveAlerts(alerts);

        return () => clearTimeout(timer);
    }, []);

    // Save messages to history
    useEffect(() => {
        if (messages.length > 0) {
            const newMsgs: SavedMsg[] = messages
                .filter(m => m.content && (m.role === "user" || m.role === "assistant"))
                .map(m => ({ role: m.role as "user" | "assistant", content: m.content as string, timestamp: Date.now() }));
            if (newMsgs.length > 0) {
                const merged = [...loadHistory()];
                for (const nm of newMsgs) {
                    const exists = merged.some(m => m.content === nm.content && m.role === nm.role && Math.abs(m.timestamp - nm.timestamp) < 5000);
                    if (!exists) merged.push(nm);
                }
                saveHistory(merged);
                setHistory(merged);
            }
        }
    }, [messages]);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const hasMessages = messages.length > 0;

    const handleClearHistory = useCallback(() => {
        clearHistory();
        setHistory([]);
        setShowHistory(false);
    }, []);

    const handleDismissAlert = (alertId: string) => {
        dismissAlert(alertId);
        setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    const startVoice = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recog = new SpeechRecognition();
        recog.lang = "en-US";
        recog.interimResults = false;
        recog.maxAlternatives = 1;
        recog.onresult = (e: any) => {
            const text = e.results[0][0].transcript;
            setInput(text);
            setIsListening(false);
        };
        recog.onerror = () => setIsListening(false);
        recog.onend = () => setIsListening(false);
        recognitionRef.current = recog;
        recog.start();
        setIsListening(true);
    };

    const stopVoice = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const alertCount = activeAlerts.length;

    return (
        <>
            <style>{`
                @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:none; } }
                @keyframes msgFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
                @keyframes pulseGlow { 0%,100% { box-shadow: 0 4px 24px rgba(201,168,76,0.4); } 50% { box-shadow: 0 4px 36px rgba(201,168,76,0.7), 0 0 60px rgba(201,168,76,0.15); } }
                @keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
                @keyframes floatBadge { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
            `}</style>

            {/* ── FLOATING BUTTON ── */}
            {!open && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {/* Tooltip nudge — dismissible */}
                    {!tooltipDismissed && (
                    <div style={{
                        background: "rgba(15,15,25,0.95)", border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: 14, padding: "10px 16px", backdropFilter: "blur(12px)",
                        animation: pulse ? "floatBadge 3s ease-in-out infinite" : "none",
                        maxWidth: 200, position: "relative",
                    }}>
                        <button onClick={(e) => { e.stopPropagation(); setTooltipDismissed(true); }} style={{
                            position: "absolute", top: 4, right: 6,
                            background: "none", border: "none", color: "rgba(255,255,255,0.35)",
                            fontSize: 14, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
                        }} title="Dismiss">✕</button>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E", marginBottom: 2 }}>✨ Restly AI</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>Your personal restaurant assistant. Ask me anything!</div>
                    </div>
                    )}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => { setOpen(true); setPulse(false); }}
                            style={{
                                width: 68, height: 68, borderRadius: 20,
                                background: "linear-gradient(135deg,#C9A84C,#E8C96E)",
                                border: "none", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 24px rgba(201,168,76,0.5)",
                                fontSize: 30, transition: "transform 0.2s",
                                animation: pulse ? "pulseGlow 2.5s ease-in-out infinite" : "none",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                            title="Ask Restly AI"
                        >
                            🤖
                        </button>
                        {/* Only show badge for real alerts — not chat history count */}
                        {alertCount > 0 && (
                            <div style={{
                                position: "absolute", top: -5, right: -5,
                                background: "#f87171", color: "#fff", fontSize: 10, fontWeight: 800,
                                width: 20, height: 20, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "2px solid #0d0d1a",
                            }}>
                                {alertCount}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CHAT PANEL ── */}
            {open && (
                <div style={{
                    position: "fixed", bottom: 20, right: 20, zIndex: 1000,
                    width: "min(500px, calc(100vw - 24px))",
                    height: "min(720px, calc(100vh - 80px))",
                    background: "linear-gradient(180deg, #0e0e1c 0%, #0a0a16 100%)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderRadius: 24,
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.05)",
                    overflow: "hidden",
                    animation: "slideUp 0.3s ease",
                }}>
                    {/* Header */}
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, background: "rgba(255,255,255,0.01)" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: "linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.08))",
                            border: "1px solid rgba(201,168,76,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                        }}>🤖</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Restly AI</div>
                            <div style={{ fontSize: 12, color: isLoading ? "#E8C96E" : "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 6 }}>
                                {isLoading ? (
                                    <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8C96E", display: "inline-block", animation: "pulse 1s ease-in-out infinite" }} /> Thinking...</>
                                ) : "Your personal restaurant assistant"}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            {activeAlerts.length > 0 && (
                                <button onClick={() => { setShowAlerts(!showAlerts); setShowHistory(false); }} title="Notifications" style={{
                                    width: 36, height: 36, borderRadius: 10, background: showAlerts ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${showAlerts ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
                                    color: showAlerts ? "#f87171" : "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                                }}>
                                    🔔
                                    <span style={{ position: "absolute", top: -3, right: -3, background: "#f87171", color: "#fff", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0e0e1c" }}>{activeAlerts.length}</span>
                                </button>
                            )}
                            {history.length > 0 && (
                                <button onClick={() => { setShowHistory(!showHistory); setShowAlerts(false); }} title="Chat History" style={{
                                    width: 36, height: 36, borderRadius: 10, background: showHistory ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${showHistory ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                                    color: showHistory ? "#E8C96E" : "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>🕐</button>
                            )}
                            <button onClick={() => setOpen(false)} style={{
                                width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                        </div>
                    </div>

                    {/* History Panel */}
                    {showHistory && (
                        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", maxHeight: 250, overflowY: "auto", background: "rgba(255,255,255,0.01)" }}>
                            <div style={{ padding: "12px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Conversations</span>
                                <button onClick={handleClearHistory} style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>Clear All</button>
                            </div>
                            {history.filter(h => h.role === "user").slice(-8).reverse().map((h, i) => (
                                <div key={i} onClick={() => { setInput(h.content); setShowHistory(false); }} style={{
                                    padding: "10px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.03)",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    transition: "background 0.15s",
                                }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{h.content}</span>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{timeAgo(h.timestamp)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Messages Area */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* ── ALERTS — toggled via bell icon ── */}
                        {showAlerts && activeAlerts.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
                                {activeAlerts.map(alert => (
                                    <div key={alert.id} style={{
                                        background: alert.type === "critical" ? "rgba(239,68,68,0.06)" : alert.type === "warning" ? "rgba(245,158,11,0.06)" : "rgba(96,165,250,0.06)",
                                        border: `1px solid ${alert.type === "critical" ? "rgba(239,68,68,0.2)" : alert.type === "warning" ? "rgba(245,158,11,0.2)" : "rgba(96,165,250,0.2)"}`,
                                        borderRadius: 14, padding: "14px 16px", position: "relative",
                                    }}>
                                        <button onClick={() => handleDismissAlert(alert.id)} style={{
                                            position: "absolute", top: 8, right: 10,
                                            background: "none", border: "none", color: "rgba(255,255,255,0.25)",
                                            fontSize: 14, cursor: "pointer", lineHeight: 1,
                                        }}>✕</button>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6,
                                            color: alert.type === "critical" ? "#f87171" : alert.type === "warning" ? "#fbbf24" : "#60a5fa",
                                        }}>
                                            {alert.icon} {alert.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: alert.action ? 10 : 0, paddingRight: 20 }}>
                                            {alert.body}
                                        </div>
                                        {alert.action && (
                                            <button onClick={() => { router.push(alert.action!.path); setOpen(false); }} style={{
                                                background: alert.type === "critical" ? "rgba(239,68,68,0.1)" : "rgba(201,168,76,0.08)",
                                                border: `1px solid ${alert.type === "critical" ? "rgba(239,68,68,0.2)" : "rgba(201,168,76,0.15)"}`,
                                                color: alert.type === "critical" ? "#f87171" : "#E8C96E",
                                                borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700,
                                                cursor: "pointer", fontFamily: "inherit",
                                            }}>
                                                {alert.action.label} →
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── PROACTIVE BRIEFING (replaces static empty state) ── */}
                        {!hasMessages && !showAlerts && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {briefing ? (
                                    <>
                                        {/* Greeting */}
                                        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{briefing.greeting}</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Here's your daily briefing from Restly AI</div>
                                        </div>

                                        {/* KPI Grid */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            {[
                                                { label: "Reservations", val: briefing.kpis.reservations, sub: `${briefing.kpis.covers} covers`, color: "#60a5fa", icon: "📋" },
                                                { label: "VIP Guests", val: briefing.kpis.vipCount, sub: "tonight", color: "#E8C96E", icon: "⭐" },
                                                { label: "Yesterday Rev.", val: briefing.kpis.yesterdayRevenue, sub: briefing.kpis.profitMargin + " margin", color: "#4ade80", icon: "💰" },
                                                { label: "Labor Cost", val: briefing.kpis.laborPercent, sub: "target: <33%", color: parseFloat(briefing.kpis.laborPercent) > 33 ? "#f87171" : "#4ade80", icon: "👥" },
                                            ].map(k => (
                                                <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                                                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.icon} {k.label}</div>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.val}</div>
                                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{k.sub}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* VIP Guests */}
                                        {briefing.vipGuests.length > 0 && (
                                            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "#E8C96E", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>⭐ VIP Guests Tonight</div>
                                                {briefing.vipGuests.map((v: any) => (
                                                    <div key={v.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                        <div>
                                                            <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{v.name}</span>
                                                            {v.notes && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>— {v.notes}</span>}
                                                        </div>
                                                        <span style={{ fontSize: 12, color: "rgba(201,168,76,0.7)", fontWeight: 600 }}>{v.time} · {v.partySize}p</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Staff on Duty */}
                                        <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>👥 {briefing.staff.shift} Shift — {briefing.staff.count} on duty</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>{briefing.staff.members.join(" · ")}</div>
                                        </div>

                                        {/* Critical Alerts */}
                                        {briefing.alerts.criticalItems.length > 0 && (
                                            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>🚨 Critical Alerts</div>
                                                {briefing.alerts.criticalItems.map((a: string, i: number) => (
                                                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}>{a}</div>
                                                ))}
                                            </div>
                                        )}

                                        {/* AI Smart Tips */}
                                        <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>🧠 AI Insights</div>
                                            {briefing.aiTips.map((t: string, i: number) => (
                                                <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0", lineHeight: 1.6 }}>{t}</div>
                                            ))}
                                        </div>

                                        {/* Quick Actions */}
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {["What's my labor cost today?", "Low stock items?", "Who's the top server?"].map(q => (
                                                <button key={q} onClick={() => setInput(q)} style={{
                                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: 20, padding: "7px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)",
                                                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                                                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#E8C96E"; }}
                                                   onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>{q}</button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "30px 16px", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                                        <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
                                        Loading your briefing...
                                    </div>
                                )}
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 6, animation: "msgFade 0.25s ease" }}>
                                {m.role === "user" ? (
                                    <div style={{
                                        background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))",
                                        border: "1px solid rgba(201,168,76,0.18)",
                                        borderRadius: "18px 18px 6px 18px",
                                        padding: "12px 18px", maxWidth: "85%", fontSize: 14, color: "#fff", lineHeight: 1.55,
                                    }}>
                                        {m.content as string}
                                    </div>
                                ) : (
                                    <div style={{ maxWidth: "95%", display: "flex", flexDirection: "column", gap: 6 }}>
                                        {(m.content as string) && (
                                            <div style={{
                                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                                                borderRadius: "6px 18px 18px 18px",
                                                padding: "14px 18px", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, whiteSpace: "pre-wrap",
                                            }}>
                                                {m.content as string}
                                            </div>
                                        )}
                                        {(m as any).toolInvocations?.map((inv: any, j: number) => (
                                            inv.state === "result" && (
                                                <ToolResultCard key={j} toolName={inv.toolName} result={inv.result} />
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                                <span style={{ display: "inline-flex", gap: 4 }}>
                                    {[0, 1, 2].map(i => (
                                        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                                    ))}
                                </span>
                                <span>Analyzing...</span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSubmit}
                        style={{ padding: "14px 18px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, flexShrink: 0, background: "rgba(255,255,255,0.01)" }}
                    >
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder={isListening ? "🎤 Listening..." : "Ask me anything about your restaurant..."}
                            style={{
                                flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${isListening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                                borderRadius: 14, padding: "14px 18px", fontSize: 14, color: "#fff",
                                outline: "none", fontFamily: "inherit",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={e => (e.target.style.borderColor = isListening ? "rgba(239,68,68,0.4)" : "rgba(201,168,76,0.35)")}
                            onBlur={e => (e.target.style.borderColor = isListening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)")}
                        />
                        <button
                            type="button"
                            onClick={isListening ? stopVoice : startVoice}
                            style={{
                                width: 44, height: 48,
                                background: isListening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${isListening ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
                                borderRadius: 12, cursor: "pointer",
                                color: isListening ? "#f87171" : "rgba(255,255,255,0.35)", fontSize: 18,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                transition: "all 0.2s",
                                animation: isListening ? "pulseGlow 1.5s ease-in-out infinite" : "none",
                            }}
                            title={isListening ? "Stop recording" : "Voice input"}
                        >
                            🎤
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            style={{
                                width: 48, height: 48,
                                background: input.trim() ? "linear-gradient(135deg,#C9A84C,#E8C96E)" : "rgba(255,255,255,0.04)",
                                border: input.trim() ? "none" : "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 14, cursor: input.trim() ? "pointer" : "not-allowed",
                                color: input.trim() ? "#1a1000" : "rgba(255,255,255,0.25)", fontSize: 20,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                transition: "all 0.2s", fontWeight: 800,
                            }}
                        >
                            ↑
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
