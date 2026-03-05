"use client";
import { useState, useRef, useEffect } from "react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

const CHIPS = [
    "Who's dining tonight?",
    "Any VIP guests?",
    "Low stock alerts",
    "Pending time-off requests",
    "Schedule conflicts?",
];

export default function ChatBot({ restaurantName }: { restaurantName: string }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

    async function send(text?: string) {
        const t = text ?? input;
        if (!t.trim() || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: t };
        const next = [...messages, userMsg];
        setMessages(next); setInput(""); setLoading(true);

        const aId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aId, role: "assistant", content: "" }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
            });
            if (!res.ok || !res.body) throw new Error("Failed");
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let buf = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                const lines = buf.split("\n"); buf = lines.pop() ?? "";
                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const chunk = JSON.parse(line.slice(2));
                            setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: m.content + chunk } : m));
                        } catch { /* skip */ }
                    }
                }
            }
        } catch {
            setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m));
        } finally { setLoading(false); }
    }

    const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <>
            {open && (
                <div className="chatbot-panel">
                    <div className="chat-header">
                        <div className="chat-avatar">🤖</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Restly AI Manager</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{restaurantName} · GPT-4o</div>
                        </div>
                        <div className="chat-status" />
                        <button onClick={() => setOpen(false)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18 }}>✕</button>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-message assistant fade-in">
                                {`👋 Hi! I'm the AI manager for ${restaurantName}.\n\nI can help with:\n• 👤 Guest profiles & VIP status\n• 🍽️ Tonight's reservations\n• 📦 Inventory & stock\n• 📅 Time-off & scheduling\n\nWhat do you need?`}
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`chat-message ${m.role} fade-in`}>{m.content}</div>
                        ))}
                        {loading && messages[messages.length - 1]?.role !== "assistant" && (
                            <div className="chat-message thinking shimmer">✦ Thinking…</div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {messages.length === 0 && (
                        <div className="chat-chips">
                            {CHIPS.map(c => <button key={c} className="chat-chip" onClick={() => send(c)}>{c}</button>)}
                        </div>
                    )}

                    <div className="chat-input-area">
                        <textarea className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask anything…" rows={1} style={{ height: 42 }} />
                        <button className="chat-send" onClick={() => send()} disabled={loading || !input.trim()}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <button className="chatbot-toggle" onClick={() => setOpen(!open)} title="AI Manager">
                {open
                    ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1000" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1000" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                }
            </button>
        </>
    );
}
