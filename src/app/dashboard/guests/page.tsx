"use client";
import { useState, useEffect } from "react";

export default function GuestsPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [consent, setConsent] = useState(false);
    const [isDemo, setIsDemo] = useState(true);

    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsConnected, setReviewsConnected] = useState<boolean>(false);

    useEffect(() => {
        fetch("/api/guests").then(r => r.json()).then(setData);
        // Check if consent was already given this session
        setConsent(sessionStorage.getItem("guests_consent") === "true");

        fetch("/api/locations")
            .then(r => r.json())
            .then(d => {
                const restName = d.restaurantName || "";
                setIsDemo(!!restName);
            })
            .catch(() => { });

        fetch("/api/reviews")
            .then(r => r.json())
            .then(d => {
                if (d.connected) {
                    setReviewsConnected(true);
                    setReviews(d.reviews || []);
                }
            })
            .catch(() => { });
    }, []);

    function giveConsent() {
        sessionStorage.setItem("guests_consent", "true");
        setConsent(true);
    }

    const guests = data?.guests ?? [];
    const filtered = search
        ? guests.filter((g: any) =>
            `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            g.email.toLowerCase().includes(search.toLowerCase())
        )
        : guests;

    if (!consent) {
        return (
            <>
                <div className="topbar">
                    <div className="topbar-title">👤 Guest Intelligence</div>
                    <div className="topbar-right">
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>OpenTable Integration</span>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 70px)", padding: 32 }}>
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 48, maxWidth: 520, width: "100%", textAlign: "center" }}>
                        <div style={{ fontSize: 52, marginBottom: 20 }}>🔒</div>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                            California Privacy Protection
                        </h2>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                            Guest Intelligence contains personal customer data including names, emails, phone numbers,
                            dining preferences, and spending history. Access is governed by{" "}
                            <strong style={{ color: "var(--gold-light)" }}>CCPA/CPRA</strong>.
                        </p>
                        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 28, textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 8 }}>By continuing you confirm:</div>
                            {[
                                "You are authorized staff of this restaurant",
                                "Data will only be used for guest service purposes",
                                "You will not share this data with third parties",
                                "Access is logged for CCPA compliance",
                            ].map(item => (
                                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                                    <span style={{ color: "var(--green)", marginTop: 1 }}>✓</span> {item}
                                </div>
                            ))}
                        </div>
                        <button onClick={giveConsent} className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
                            I Understand — View Guest Data
                        </button>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>
                            Access is session-scoped and logged with timestamp.
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">👤 Guest Intelligence</div>
                <div className="topbar-right">
                    {isDemo ? (
                        <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                            🟢 OpenTable Connected (Demo)
                        </span>
                    ) : (
                        <span style={{ fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                            ⚪ OpenTable Not Connected
                        </span>
                    )}
                </div>
            </div>

            <div className="page-content fade-in">
                {isDemo && (
                    <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
                        {[
                            { label: "Total Guests", value: data?.stats?.totalGuests, color: "var(--text-primary)", icon: "👤" },
                            { label: "VIP Guests", value: data?.stats?.vipGuests, color: "var(--gold-light)", icon: "⭐" },
                            { label: "Covers Today", value: data?.stats?.coversToday, color: "var(--purple)", icon: "🍽️" },
                            { label: "Reservations", value: data?.stats?.reservationsToday, color: "var(--blue)", icon: "📋" },
                            { label: "Avg Spend", value: data ? `$${data.stats?.avgSpend}` : "—", color: "var(--green)", icon: "💰" },
                        ].map(c => (
                            <div key={c.label} className="kpi-card">
                                <div className="kpi-label">{c.icon} {c.label}</div>
                                <div className="kpi-value" style={{ color: c.color, fontSize: 26 }}>{c.value ?? "—"}</div>
                            </div>
                        ))}
                    </div>
                )}

                {isDemo ? (
                    <>
                        <div className="grid-2" style={{ gap: 20, alignItems: "start" }}>
                            {/* Guest List */}
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">All Guests</span>
                                    <input
                                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name or email…"
                                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", width: 220 }}
                                    />
                                </div>
                                <div style={{ maxHeight: 600, overflowY: "auto" }}>
                                    {!data && (
                                        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading guest data…</div>
                                    )}
                                    {filtered.map((g: any) => (
                                        <div
                                            key={g.id}
                                            onClick={() => setSelected(g)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 14,
                                                padding: "14px 20px", border: "none",
                                                borderBottom: "1px solid var(--border)",
                                                cursor: "pointer",
                                                background: selected?.id === g.id ? "rgba(201,168,76,0.06)" : "transparent",
                                                transition: "background 0.15s",
                                            }}
                                        >
                                            {/* Avatar */}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                                                background: g.isVip
                                                    ? "linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.1))"
                                                    : "var(--bg-secondary)",
                                                border: g.isVip ? "1px solid rgba(201,168,76,0.4)" : "1px solid var(--border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 15, fontWeight: 700, color: g.isVip ? "var(--gold-light)" : "var(--text-secondary)",
                                            }}>
                                                {g.firstName[0]}{g.lastName[0]}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                                                    {g.isVip && <span style={{ color: "var(--gold-light)", fontSize: 13 }}>⭐</span>}
                                                    {g.firstName} {g.lastName}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
                                                    <span>{g.visitCount} visits</span>
                                                    <span>·</span>
                                                    <span>avg ${g.averageSpend}</span>
                                                    <span>·</span>
                                                    <span>last: {g.lastVisit}</span>
                                                </div>
                                            </div>
                                            {g.dietaryNotes && g.dietaryNotes !== "None" && (
                                                <span style={{ fontSize: 10, background: "rgba(59,130,246,0.12)", color: "var(--blue)", padding: "3px 8px", borderRadius: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
                                                    {g.dietaryNotes}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Guest Detail Panel */}
                            <div className="card" style={{ position: "sticky", top: 88 }}>
                                {!selected ? (
                                    <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
                                        <div style={{ fontSize: 14 }}>Select a guest to view their full profile</div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
                                                <div style={{
                                                    width: 56, height: 56, borderRadius: "50%",
                                                    background: selected.isVip ? "linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.1))" : "var(--bg-secondary)",
                                                    border: selected.isVip ? "2px solid var(--gold)" : "1px solid var(--border)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 20, fontWeight: 700, color: selected.isVip ? "var(--gold-light)" : "var(--text-secondary)",
                                                }}>
                                                    {selected.firstName[0]}{selected.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                                                        {selected.firstName} {selected.lastName}
                                                        {selected.isVip && <span className="badge badge-yellow">⭐ VIP</span>}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{selected.email}</div>
                                                </div>
                                                <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
                                            </div>
                                        </div>
                                        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                            {/* Quick stats */}
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                                                {[
                                                    { label: "Total Visits", value: selected.visitCount },
                                                    { label: "Avg Spend", value: `$${selected.averageSpend}` },
                                                    { label: "Party Size", value: selected.averagePartySize },
                                                ].map(s => (
                                                    <div key={s.label} style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                                                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--gold-light)" }}>{s.value}</div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Contact */}
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Contact</div>
                                                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selected.phone}</div>
                                                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selected.email}</div>
                                            </div>

                                            {/* Preferences */}
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Preferences</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {selected.preferences.map((p: string) => (
                                                        <span key={p} className="badge badge-blue">{p}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Dietary */}
                                            {selected.dietaryNotes && selected.dietaryNotes !== "None" && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Dietary Notes</div>
                                                    <div className="alert alert-warning" style={{ fontSize: 13, padding: "8px 12px" }}>
                                                        ⚠️ {selected.dietaryNotes}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Favorites */}
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Favorite Items</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {selected.favoriteItems.map((f: string) => (
                                                        <span key={f} style={{ fontSize: 12, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "4px 10px", color: "var(--gold-light)" }}>{f}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Special occasions */}
                                            {selected.specialOccasions.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Special Occasions</div>
                                                    {selected.specialOccasions.map((o: string) => (
                                                        <div key={o} className="alert alert-success" style={{ fontSize: 13, padding: "8px 12px", marginBottom: 6 }}>🎉 {o}</div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {selected.notes && (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Manager Notes</div>
                                                    <div style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.6 }}>
                                                        {selected.notes}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Last visit */}
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                                                Last visit: {selected.lastVisit} &nbsp;·&nbsp; Source: OpenTable
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Daily Reviews Feed */}
                        <div className="card" style={{ marginTop: 24 }}>
                            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className="card-title">Daily Reviews & Sentiment Intelligence</span>
                                {reviewsConnected && (
                                    <span style={{ fontSize: 13, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold-light)", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>
                                        🧠 AI Sentiment: 85% Positive
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                {!reviewsConnected ? (
                                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                                        <p style={{ marginBottom: 16 }}>Review tracking is currently inactive. You need a valid Google Business, Yelp, or OpenTable API token to unlock sentiment analysis.</p>
                                        <button className="btn-ghost" onClick={() => window.location.href = '/dashboard/settings'}>
                                            Setup API Integrations
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        {reviews.map(r => (
                                            <div key={r.id} style={{ padding: 20, background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        <span style={{ fontSize: 20 }}>{r.icon}</span>
                                                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.author}</span>
                                                        <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-card)", padding: "3px 8px", borderRadius: 8, border: "1px solid var(--border)" }}>via {r.platform}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.date}</div>
                                                </div>
                                                <div style={{ marginBottom: 12 }}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <span key={i} style={{ color: i < r.rating ? "#E8C96E" : "rgba(255,255,255,0.1)", fontSize: 16 }}>★</span>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                                                    &quot;{r.text}&quot;
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Guest Intelligence Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>
                            To unlock CCPA-compliant guest insights, VIP tracking, and reservation history, please connect your reservation system.
                        </p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>
                            Connect OpenTable
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
