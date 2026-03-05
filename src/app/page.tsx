import Link from "next/link";

const features = [
    {
        icon: "🤖",
        title: "AI Manager Chatbot",
        desc: "Ask anything in plain English. Get instant answers about tonight's guests, stock levels, or staffing conflicts.",
    },
    {
        icon: "👤",
        title: "Guest Intelligence",
        desc: "Every guest's preferences, dietary notes, VIP status, and spending history — pulled from OpenTable automatically.",
    },
    {
        icon: "📦",
        title: "Live Inventory Sync",
        desc: "Real-time stock levels from Toast POS. Get alerts before you run out of key ingredients during service.",
    },
    {
        icon: "📅",
        title: "Smart Scheduling",
        desc: "Staff time-off requests via Google Forms, conflict detection, and AI-assisted scheduling recommendations.",
    },
    {
        icon: "🔒",
        title: "CCPA Compliant",
        desc: "Built for California. Guest data handling follows CCPA/CPRA regulations with built-in consent flows.",
    },
    {
        icon: "⚡",
        title: "Works in Minutes",
        desc: "No IT team needed. Sign up, connect your OpenTable and Toast accounts, and you're live same day.",
    },
];

const pricing = [
    {
        name: "Starter",
        price: "$149",
        period: "per month",
        desc: "Perfect for single-location restaurants",
        popular: false,
        features: [
            "AI Manager Chatbot",
            "Guest Intelligence (up to 500 guests)",
            "Inventory Management",
            "Schedule & Time-Off",
            "OpenTable + Toast integrations",
            "CCPA compliance tools",
            "Email support",
        ],
        cta: "Start Free Trial",
        href: "/signup?plan=starter",
    },
    {
        name: "Professional",
        price: "$299",
        period: "per month",
        desc: "For growing multi-location restaurants",
        popular: true,
        features: [
            "Everything in Starter",
            "Unlimited guest profiles",
            "Multi-location support (up to 3)",
            "Google Sheets auto-sync",
            "Advanced analytics & reports",
            "Custom AI training on your menu",
            "Priority support + onboarding call",
        ],
        cta: "Start Free Trial",
        href: "/signup?plan=pro",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "contact us",
        desc: "For restaurant groups & chains",
        popular: false,
        features: [
            "Everything in Professional",
            "Unlimited locations",
            "White-label branding",
            "Custom integrations",
            "Dedicated account manager",
            "SLA guarantee",
            "On-site training",
        ],
        cta: "Contact Sales",
        href: "mailto:hello@restly.ai",
    },
];

const stats = [
    { value: "2 min", label: "Average setup time" },
    { value: "40%", label: "Less time on admin tasks" },
    { value: "∞", label: "AI queries per day" },
    { value: "14 days", label: "Free trial, no card needed" },
];

export default function LandingPage() {
    return (
        <div className="landing">
            {/* ── NAV ── */}
            <nav className="nav">
                <div className="nav-logo">✦ Restly</div>
                <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#pricing" className="nav-link">Pricing</a>
                    <a href="#how" className="nav-link">How it works</a>
                    <Link href="/login" className="btn-ghost" style={{ fontSize: 14, padding: "8px 18px" }}>
                        Log in
                    </Link>
                    <Link href="/signup" className="btn-primary" style={{ fontSize: 14, padding: "10px 22px" }}>
                        Start Free Trial
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{ position: "relative", overflow: "hidden", paddingTop: 160, paddingBottom: 100 }}>
                {/* Background blobs */}
                <div className="hero-blob" style={{ width: 600, height: 600, background: "rgba(201,168,76,0.06)", top: -100, left: "50%", transform: "translateX(-60%)" }} />
                <div className="hero-blob" style={{ width: 400, height: 400, background: "rgba(168,85,247,0.05)", top: 50, right: "5%" }} />

                <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", padding: "0 24px", position: "relative", zIndex: 1 }}>
                    {/* Badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
                        borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600,
                        color: "var(--gold-light)", marginBottom: 28,
                    }}>
                        <span>✦</span> AI-Powered Restaurant Management
                    </div>

                    <h1 style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "clamp(40px, 6vw, 72px)",
                        fontWeight: 900, lineHeight: 1.05,
                        letterSpacing: "-0.03em", marginBottom: 24,
                    }}>
                        Run Your Restaurant<br />
                        <span className="gradient-text">10× Smarter</span>
                    </h1>

                    <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
                        Restly is the AI manager that never sleeps. Ask it about tonight&apos;s guests,
                        check stock levels, handle time-off requests — all through a simple chat interface.
                    </p>

                    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
                        <Link href="/signup" className="btn-primary" style={{ fontSize: 16, padding: "16px 32px" }}>
                            Start Free — No Card Required →
                        </Link>
                        <Link href="/login" className="btn-secondary" style={{ fontSize: 16, padding: "15px 32px" }}>
                            See Live Demo
                        </Link>
                    </div>

                    {/* Stats strip */}
                    <div style={{
                        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0,
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: 16, padding: "4px 0", maxWidth: 680, margin: "0 auto",
                    }}>
                        {stats.map((s, i) => (
                            <div key={i} style={{
                                flex: 1, minWidth: 130, textAlign: "center", padding: "18px 16px",
                                borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
                            }}>
                                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: "var(--gold-light)" }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DASHBOARD PREVIEW ── */}
            <section style={{ padding: "0 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
                <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 24, overflow: "hidden",
                    boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)",
                }}>
                    {/* Mock browser bar */}
                    <div style={{ background: "var(--bg-secondary)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--red)" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--yellow)" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--green)" }} />
                        <div style={{ flex: 1, background: "var(--bg-card)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--text-muted)", marginLeft: 12 }}>
                            app.restly.ai/dashboard
                        </div>
                    </div>
                    {/* Mock dashboard */}
                    <div style={{ display: "flex", minHeight: 380 }}>
                        {/* Sidebar */}
                        <div style={{ width: 200, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)", padding: "20px 12px" }}>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg,#E8C96E,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 20, paddingLeft: 8 }}>✦ Restly</div>
                            {["📊  Overview", "👤  Guests", "📦  Inventory", "📅  Schedule", "⚙️  Settings"].map((item, i) => (
                                <div key={i} style={{
                                    padding: "9px 12px", borderRadius: 8, fontSize: 13, marginBottom: 2,
                                    background: i === 0 ? "rgba(201,168,76,0.12)" : "transparent",
                                    color: i === 0 ? "var(--gold-light)" : "var(--text-muted)",
                                }}>{item}</div>
                            ))}
                        </div>
                        {/* Main */}
                        <div style={{ flex: 1, padding: 24 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Good evening, Manager 👋</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: "Covers Tonight", value: "84", color: "var(--gold-light)" },
                                    { label: "VIP Guests", value: "6", color: "var(--purple)" },
                                    { label: "Stock Alerts", value: "3", color: "var(--red)" },
                                    { label: "Pending PTO", value: "2", color: "var(--yellow)" },
                                ].map(c => (
                                    <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
                                    </div>
                                ))}
                            </div>
                            {/* AI chat preview */}
                            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, fontWeight: 600 }}>🤖 AI Manager</div>
                                <div style={{ fontSize: 13, background: "rgba(201,168,76,0.15)", padding: "8px 12px", borderRadius: 10, marginBottom: 8, width: "fit-content", color: "#1a1000", fontWeight: 500 }}>
                                    Who are my VIP guests tonight?
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-card)", padding: "8px 12px", borderRadius: 10 }}>
                                    You have <strong style={{ color: "var(--gold-light)" }}>3 VIP guests</strong> tonight: Michael Chen (Table 12, 6pm), James Hartley (Table 5, 7pm), and Robert Williams (Table 8, 7:30pm). Michael brings a party of 6 and has a no-shellfish allergy — ensure kitchen is notified. 🌟
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="section" id="features">
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div className="section-label">Features</div>
                    <h2 className="section-title">
                        Everything your restaurant needs,<br />
                        <span className="gradient-text">powered by AI</span>
                    </h2>
                    <p className="section-sub" style={{ margin: "0 auto" }}>
                        Restly connects to your existing tools — OpenTable, Toast POS, and Google Forms — and adds an AI brain on top.
                    </p>
                </div>
                <div className="feature-grid">
                    {features.map(f => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <div className="feature-title">{f.title}</div>
                            <div className="feature-desc">{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="section" id="how" style={{ background: "var(--bg-card)", maxWidth: "100%", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 56 }}>
                        <div className="section-label">How it works</div>
                        <h2 className="section-title">Live in under 5 minutes</h2>
                    </div>
                    <div className="grid-3">
                        {[
                            { step: "1", title: "Sign Up", desc: "Create your restaurant account. No credit card required for the 14-day free trial.", icon: "✍️" },
                            { step: "2", title: "Connect Your Tools", desc: "Link your OpenTable, Toast POS account, and Google Forms for time-off requests.", icon: "🔌" },
                            { step: "3", title: "Ask Your AI Manager", desc: "Open the chat, ask anything. Stock levels, guest preferences, schedule conflicts — instant answers.", icon: "💬" },
                        ].map(s => (
                            <div key={s.step} style={{ textAlign: "center", padding: 32 }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 20,
                                    background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
                                    border: "1px solid rgba(201,168,76,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 28, margin: "0 auto 20px",
                                }}>{s.icon}</div>
                                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Step {s.step}</div>
                                <div className="feature-title" style={{ fontSize: 18, marginBottom: 10 }}>{s.title}</div>
                                <div className="feature-desc">{s.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section className="section" id="pricing">
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div className="section-label">Pricing</div>
                    <h2 className="section-title">
                        Simple, transparent pricing.<br />
                        <span className="gradient-text">Cancel anytime.</span>
                    </h2>
                    <p className="section-sub" style={{ margin: "0 auto" }}>
                        Start your 14-day free trial today. No credit card required.
                    </p>
                </div>
                <div className="pricing-grid">
                    {pricing.map(p => (
                        <div key={p.name} className={`pricing-card${p.popular ? " popular" : ""}`}>
                            {p.popular && <div className="popular-badge">Most Popular</div>}
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{p.name}</div>
                            <div className="price-amount" style={{ color: p.popular ? "var(--gold-light)" : "var(--text-primary)" }}>{p.price}</div>
                            <div className="price-period">{p.period}</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>{p.desc}</div>
                            <div className="price-features">
                                {p.features.map(f => (
                                    <div key={f} className="price-feature">
                                        <span className="price-feature-check">✓</span>
                                        <span style={{ fontSize: 14 }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href={p.href}
                                className={p.popular ? "btn-primary" : "btn-secondary"}
                                style={{ marginTop: 28, display: "flex", justifyContent: "center", width: "100%" }}
                            >
                                {p.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA FOOTER ── */}
            <section style={{ padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div className="hero-blob" style={{ width: 500, height: 500, background: "rgba(201,168,76,0.06)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h2 className="section-title" style={{ fontSize: "clamp(28px,4vw,52px)", marginBottom: 16 }}>
                        Ready to run a smarter restaurant?
                    </h2>
                    <p style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 36 }}>
                        Join hundreds of restaurants already using Restly. Start your free trial today.
                    </p>
                    <Link href="/signup" className="btn-primary" style={{ fontSize: 17, padding: "18px 40px" }}>
                        Get Started Free — 14 Days Trial →
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div className="nav-logo">✦ Restly</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    © 2026 Restly. CCPA/CPRA Compliant. Built for California restaurants.
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                    {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
                        <a key={l} href="#" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>{l}</a>
                    ))}
                </div>
            </footer>
        </div>
    );
}
