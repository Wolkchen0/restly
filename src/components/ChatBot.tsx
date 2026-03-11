"use client";
import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_PROMPTS = [
    { icon: "📋", text: "Who has reservations tonight?", category: "guests" },
    { icon: "⚠️", text: "What's running low in the kitchen?", category: "inventory" },
    { icon: "⭐", text: "Show me my VIP guests", category: "guests" },
    { icon: "📅", text: "Any pending time-off requests?", category: "schedule" },
    { icon: "🔗", text: "How do I connect Clover?", category: "setup" },
    { icon: "🔗", text: "How do I connect Toast POS?", category: "setup" },
];

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
    const router = useRouter();

    if (toolName === "navigate_to" && result.actionRequired) {
        return (
            <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, padding: "14px 16px", marginTop: 8, maxWidth: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>📍 Navigate</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 1.5 }}>{result.instructions}</div>
                <button
                    onClick={() => router.push(result.path)}
                    style={{ background: "linear-gradient(135deg,#C9A84C,#E8C96E)", color: "#1a1000", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
                >
                    Go to {result.label} →
                </button>
            </div>
        );
    }

    if (toolName === "get_pos_setup_guide") {
        return (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", marginTop: 8, maxWidth: 380 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{result.icon} {result.posName} Setup Guide</div>
                <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.stepsToGetCredentials.map((step: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, paddingLeft: 4 }}>{step}</li>
                    ))}
                </ol>
                <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(201,168,76,0.1)", borderRadius: 8, fontSize: 12, color: "#E8C96E", lineHeight: 1.5 }}>
                    ✓ {result.nextStep}
                </div>
                <button
                    onClick={() => router.push("/dashboard/settings")}
                    style={{ marginTop: 10, background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%" }}
                >
                    Open Settings →
                </button>
            </div>
        );
    }

    if (result.success && result.navigation) {
        return (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 16px", marginTop: 8, maxWidth: 360 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>✅ Action Verified</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 1.5 }}>{result.message}</div>
                <button
                    onClick={() => router.push(result.navigation.path)}
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%" }}
                >
                    View in {result.navigation.label} →
                </button>
            </div>
        );
    }

    if (toolName === "get_low_stock_alerts") {
        const { outOfStock = [], lowStock = [], urgency } = result;
        return (
            <div style={{ background: urgency === "CRITICAL" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${urgency === "CRITICAL" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 12, padding: "14px 16px", marginTop: 8, maxWidth: 360 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: urgency === "CRITICAL" ? "#f87171" : "#fbbf24", marginBottom: 8, textTransform: "uppercase" }}>
                    {urgency === "CRITICAL" ? "🚨 Critical Stock Alert" : "⚠️ Stock Alert"}
                </div>
                {outOfStock.length > 0 && <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700, marginBottom: 4 }}>OUT OF STOCK ({outOfStock.length})</div>
                    {outOfStock.map((i: any) => <div key={i.name} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}>• {i.name} — {i.supplier}</div>)}
                </div>}
                {lowStock.length > 0 && <div>
                    <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>LOW STOCK ({lowStock.length})</div>
                    {lowStock.map((i: any) => <div key={i.name} style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}>• {i.name} — {i.quantity} left</div>)}
                </div>}
            </div>
        );
    }

    return null; // Other tools don't need special cards — AI text handles them
}

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
        api: "/api/chat",
    });

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const hasMessages = messages.length > 0;

    return (
        <>
            {/* ── FLOATING BUTTON ── */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                        width: 58, height: 58, borderRadius: "50%",
                        background: "linear-gradient(135deg,#C9A84C,#E8C96E)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 24px rgba(201,168,76,0.5)",
                        fontSize: 24, transition: "transform 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    title="Ask Restly AI"
                >
                    🤖
                </button>
            )}

            {/* ── CHAT PANEL ── */}
            {open && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                    width: "min(420px, calc(100vw - 32px))",
                    height: "min(620px, calc(100vh - 100px))",
                    background: "#0d0d1a",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: 20,
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                    overflow: "hidden",
                    animation: "slideUp 0.25s ease",
                }}>
                    <style>{`
            @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
            .msg-bubble { animation: fadeIn 0.2s ease; }
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          `}</style>

                    {/* Header */}
                    <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.1))", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Restly AI</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                {isLoading ? "Thinking…" : "Ready to help"}
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {!hasMessages && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "8px 0 12px" }}>
                                    Ask me anything about your restaurant
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {SUGGESTED_PROMPTS.map(p => (
                                        <button
                                            key={p.text}
                                            onClick={() => { setInput(p.text); }}
                                            style={{
                                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: 10, padding: "10px 10px", textAlign: "left", cursor: "pointer",
                                                color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.4,
                                                transition: "border-color 0.2s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                                        >
                                            <span style={{ display: "block", marginBottom: 3 }}>{p.icon}</span>
                                            {p.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className="msg-bubble" style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 6 }}>
                                {m.role === "user" ? (
                                    <div style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.1))", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", maxWidth: "85%", fontSize: 13, color: "#fff", lineHeight: 1.5 }}>
                                        {m.content as string}
                                    </div>
                                ) : (
                                    <div style={{ maxWidth: "95%", display: "flex", flexDirection: "column", gap: 4 }}>
                                        {/* Text content */}
                                        {(m.content as string) && (
                                            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                                                {m.content as string}
                                            </div>
                                        )}
                                        {/* Tool result cards */}
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
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                                <span style={{ display: "inline-flex", gap: 3 }}>
                                    {[0, 1, 2].map(i => (
                                        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A84C", animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                                    ))}
                                </span>
                                <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, flexShrink: 0 }}
                    >
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask anything…"
                            style={{
                                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 12, padding: "11px 14px", fontSize: 13, color: "#fff",
                                outline: "none", fontFamily: "inherit",
                            }}
                            onFocus={e => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            style={{
                                width: 42, height: 42, background: input.trim() ? "linear-gradient(135deg,#C9A84C,#E8C96E)" : "rgba(255,255,255,0.06)",
                                border: "none", borderRadius: 12, cursor: input.trim() ? "pointer" : "not-allowed",
                                color: input.trim() ? "#1a1000" : "rgba(255,255,255,0.3)", fontSize: 18,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                transition: "all 0.2s",
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
