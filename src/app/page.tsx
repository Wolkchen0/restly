"use client";
import Link from "next/link";

const POS_LOGOS = [
    { name: "Toast", emoji: "🍞", color: "#FF6B35" },
    { name: "Clover", emoji: "🍀", color: "#1DA462" },
    { name: "Square", emoji: "⬛", color: "#3E4348" },
    { name: "Lightspeed", emoji: "⚡", color: "#005EB8" },
    { name: "Revel", emoji: "🔴", color: "#C41A1A" },
    { name: "OpenTable", emoji: "🍽️", color: "#DA3743" },
];

const FEATURES = [
    {
        icon: "🤖",
        title: "AI Manager — Always On",
        desc: "Ask anything in plain English. 'Who are my VIP guests tonight?' 'What's running low in the kitchen?' Get instant answers.",
        badge: "✦ Restly AI",
        badgeColor: "rgba(139,92,246,0.2)",
        badgeText: "#a78bfa",
    },
    {
        icon: "🔗",
        title: "Works With Every POS",
        desc: "Toast, Clover, Square, Lightspeed, Revel — connect any POS system in minutes. Real-time inventory sync, COGS tracking, and more.",
        badge: "6+ Integrations",
        badgeColor: "rgba(34,197,94,0.2)",
        badgeText: "#4ade80",
    },
    {
        icon: "👤",
        title: "Guest Intelligence",
        desc: "Full guest profiles from OpenTable. VIP alerts, dietary notes, special occasions, spending history — all in one place.",
        badge: "OpenTable Sync",
        badgeColor: "rgba(201,168,76,0.2)",
        badgeText: "#E8C96E",
    },
    {
        icon: "📦",
        title: "Live Inventory & COGS",
        desc: "Real-time stock alerts before service. Automated cost-of-goods tracking linked to your POS sales data.",
        badge: "Auto-Updated",
        badgeColor: "rgba(59,130,246,0.2)",
        badgeText: "#60a5fa",
    },
    {
        icon: "📅",
        title: "Smart Staff Scheduling",
        desc: "Time-off requests, shift conflicts, and labor cost forecasting — all managed in one dashboard.",
        badge: "Google Forms",
        badgeColor: "rgba(249,115,22,0.2)",
        badgeText: "#fb923c",
    },
    {
        icon: "📊",
        title: "Revenue Insights",
        desc: "Sales forecasting, cover projections, and margin analysis. Know before service what tonight will cost.",
        badge: "Coming Soon",
        badgeColor: "rgba(156,163,175,0.15)",
        badgeText: "#9ca3af",
    },
];

const HOW_IT_WORKS = [
    { step: "1", title: "Sign up free", desc: "Create your account in 2 minutes. No credit card. No setup fees." },
    { step: "2", title: "Connect your systems", desc: "Plug in your POS (Toast, Clover, Square…) and OpenTable. Takes 10 minutes max." },
    { step: "3", title: "Ask the AI anything", desc: "Launch the chat and start managing your restaurant in plain language." },
];

const PRICING = [
    {
        name: "Starter",
        price: "$99",
        period: "/mo",
        desc: "Perfect for single-location restaurants getting started with AI.",
        color: "var(--border)",
        features: [
            "✦ Unlimited AI Manager queries",
            "1 POS integration (any brand)",
            "OpenTable guest sync",
            "Live inventory alerts",
            "Staff scheduling & time-off",
            "Email support",
        ],
        cta: "Start Free Trial",
        highlight: false,
        note: "14-day free trial",
    },
    {
        name: "Pro",
        price: "$199",
        period: "/mo",
        desc: "For busy restaurants that want full automation and insights.",
        color: "var(--gold)",
        features: [
            "✦ Everything in Starter",
            "Unlimited POS integrations",
            "Live COGS & food cost tracking",
            "Revenue & cover forecasting",
            "Recipe costing module",
            "Priority support (chat + phone)",
            "Custom branding & colors",
        ],
        cta: "Start Free Trial",
        highlight: true,
        note: "Most popular",
    },
    {
        name: "Enterprise",
        price: "$399",
        period: "/mo",
        desc: "For restaurant groups and multi-location chains.",
        color: "rgba(139,92,246,0.6)",
        features: [
            "✦ Everything in Pro",
            "Multi-location dashboard",
            "HQ command center",
            "Team roles & permissions",
            "Dedicated onboarding manager",
            "99.9% uptime SLA",
        ],
        cta: "Contact Us",
        highlight: false,
        note: "Custom quote available",
    },
];

export default function LandingPage() {
    return (
        <main style={{ background: "#08080f", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden" }}>
            {/* ── FONTS ── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #C9A84C; --gold-light: #E8C96E;
          --border: rgba(255,255,255,0.08);
          --text-muted: rgba(255,255,255,0.35);
          --text-secondary: rgba(255,255,255,0.6);
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        .glow-gold { box-shadow: 0 0 60px rgba(201,168,76,0.15); }
        .hero-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,#C9A84C,#E8C96E);
          color:#1a1000; font-size:16px; font-weight:800;
          text-decoration:none; border-radius:14px;
          padding:15px 32px; transition:transform 0.2s, box-shadow 0.2s;
          box-shadow:0 4px 24px rgba(201,168,76,0.3);
        }
        .hero-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(201,168,76,0.45); }
        .hero-btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.85);
          font-size:16px; font-weight:600; text-decoration:none;
          border-radius:14px; padding:15px 32px;
          border:1px solid rgba(255,255,255,0.12); transition:all 0.2s;
        }
        .hero-btn-secondary:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); }
        @media(max-width:768px){
          .hero-headline { font-size:clamp(32px,8vw,52px) !important; }
          .desktop-only { display:none !important; }
          .mobile-stack { flex-direction:column !important; }
          .pricing-grid { grid-template-columns:1fr !important; }
          .features-grid { grid-template-columns:1fr !important; }
          .testimonials-grid { grid-template-columns:1fr !important; }
          .how-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

            {/* ── NAV ── */}
            <nav style={{ position: "sticky", top: 0, zIndex: 100, padding: "0 24px", background: "rgba(8,8,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 32 }}>
                    <Link href="/" style={{ fontWeight: 900, fontSize: 20, color: "#E8C96E", textDecoration: "none", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 6 }}>
                        ✦ Restly
                    </Link>
                    <div className="desktop-only" style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                        {["Features", "Integrations", "Pricing", "How it works"].map(item => (
                            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "8px 14px", borderRadius: 8, transition: "color 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                            >{item}</a>
                        ))}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                        <Link href="/login" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "8px 16px" }}>Log in</Link>
                        <Link href="/signup" className="hero-btn-primary" style={{ fontSize: 14, padding: "10px 22px", borderRadius: 10 }}>Start Free</Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{ padding: "80px 24px 60px", textAlign: "center", position: "relative" }}>
                {/* Background glow */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse,rgba(201,168,76,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />

                <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 50, padding: "7px 18px", marginBottom: 28, fontSize: 13, fontWeight: 700, color: "#E8C96E", letterSpacing: "0.5px" }}>
                        ✦ AI-Powered Restaurant Management
                    </div>

                    <h1 className="hero-headline fade-up" style={{ fontSize: "clamp(40px,6vw,68px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", color: "#fff", marginBottom: 24 }}>
                        Your restaurant,
                        <br />
                        <span style={{ background: "linear-gradient(135deg,#E8C96E,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            10× smarter.
                        </span>
                    </h1>

                    <p style={{ fontSize: "clamp(16px,2.5vw,20px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px", fontWeight: 400 }}>
                        The AI manager that never sleeps. Works with Toast, Clover, Square, Lightspeed — and speaks plain English.
                    </p>

                    <div className="mobile-stack" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
                        <Link href="/signup" className="hero-btn-primary">Start Free — No Card Required →</Link>
                        <Link href="/login?demo=true" className="hero-btn-secondary">See Live Demo →</Link>
                    </div>

                    {/* Stats bar */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {[
                            { val: "2 min", label: "Setup time" },
                            { val: "6+", label: "POS integrations" },
                            { val: "40%", label: "Less admin work" },
                            { val: "14 days", label: "Free trial" },
                        ].map((s, i) => (
                            <div key={i} style={{ padding: "20px 16px", textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "#E8C96E", letterSpacing: "-1px" }}>{s.val}</div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── POS INTEGRATIONS TICKER ── */}
            <section id="integrations" style={{ padding: "20px 24px 56px" }}>
                <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                    <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 24 }}>
                        Works with every major POS system
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        {POS_LOGOS.map(pos => (
                            <div key={pos.name} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                                transition: "all 0.2s",
                            }}>
                                <span style={{ fontSize: 20 }}>{pos.emoji}</span> {pos.name}
                            </div>
                        ))}
                        <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                            + more
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 56 }}>
                        <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", marginBottom: 12 }}>
                            Everything your team needs
                        </h2>
                        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 480, margin: "0 auto" }}>
                            From guest check-in to inventory reorder — managed by AI, controlled by you.
                        </p>
                    </div>
                    <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 20, padding: "28px 24px", transition: "border-color 0.2s, transform 0.2s",
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                            >
                                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, background: f.badgeColor, color: f.badgeText, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.5px" }}>{f.badge}</span>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "14px 0 10px", letterSpacing: "-0.5px" }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", marginBottom: 12 }}>Up and running in minutes</h2>
                        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>No long setup. No training. Just connect, ask, and manage.</p>
                    </div>
                    <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
                        {HOW_IT_WORKS.map((s, i) => (
                            <div key={i} style={{ textAlign: "center", padding: "28px 20px" }}>
                                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.05))", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 20, fontWeight: 900, color: "#E8C96E" }}>
                                    {s.step}
                                </div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{s.title}</h3>
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", marginBottom: 12 }}>
                            Simple, transparent pricing
                        </h2>
                        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 480, margin: "0 auto" }}>
                            14-day free trial on all plans. No credit card. Cancel any time.
                        </p>
                    </div>
                    <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
                        {PRICING.map((plan, i) => (
                            <div key={i} style={{
                                background: plan.highlight ? "linear-gradient(160deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${plan.highlight ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
                                borderRadius: 24, padding: "32px 28px", position: "relative",
                                boxShadow: plan.highlight ? "0 0 60px rgba(201,168,76,0.08)" : "none",
                            }}>
                                {plan.highlight && (
                                    <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", color: "#1a1000", fontSize: 12, fontWeight: 800, padding: "5px 18px", borderRadius: 50, whiteSpace: "nowrap" }}>
                                        MOST POPULAR
                                    </div>
                                )}
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{plan.name}</h3>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>{plan.desc}</p>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 28 }}>
                                    <span style={{ fontSize: 42, fontWeight: 900, color: plan.highlight ? "#E8C96E" : "#fff", letterSpacing: "-2px" }}>{plan.price}</span>
                                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                                    {plan.features.map(f => (
                                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                                            <span style={{ color: "#4ade80", fontSize: 13, flexShrink: 0 }}>✓</span> {f}
                                        </div>
                                    ))}
                                </div>
                                <Link href="/signup" style={{
                                    display: "block", textAlign: "center", textDecoration: "none",
                                    background: plan.highlight ? "linear-gradient(135deg,#C9A84C,#E8C96E)" : "rgba(255,255,255,0.06)",
                                    color: plan.highlight ? "#1a1000" : "#fff",
                                    fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 12,
                                    border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
                                    transition: "opacity 0.2s",
                                }}>{plan.cta}</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section style={{ padding: "70px 24px 80px", textAlign: "center" }}>
                <div style={{ maxWidth: 640, margin: "0 auto" }}>
                    <h2 style={{ fontSize: "clamp(28px,5vw,50px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", marginBottom: 16, lineHeight: 1.1 }}>
                        Ready to run your restaurant
                        <br />
                        <span style={{ background: "linear-gradient(135deg,#E8C96E,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            smarter?
                        </span>
                    </h2>
                    <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
                        Join restaurants already saving hours every week with Restly AI.
                    </p>
                    <div className="mobile-stack" style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                        <Link href="/signup" className="hero-btn-primary" style={{ fontSize: 17 }}>Get Started Free →</Link>
                        <Link href="/login?demo=true" className="hero-btn-secondary" style={{ fontSize: 17 }}>View Live Demo →</Link>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>
                        14-day free trial · No credit card · Cancel anytime
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
                <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#E8C96E", marginBottom: 16 }}>✦ Restly</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                        © 2026 Restly · AI Restaurant Management Platform · CCPA/CPRA Compliant
                        <br />
                        <Link href="/login" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", marginRight: 16 }}>Log in</Link>
                        <Link href="/signup" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Sign up</Link>
                    </p>
                </div>
            </footer>
        </main>
    );
}
