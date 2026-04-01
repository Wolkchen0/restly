"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsDemo } from "@/lib/use-demo";

const GUEST_PATCHES_KEY = "restly_guest_patches";

function loadPatches(): Record<string, any> {
    try {
        const raw = sessionStorage.getItem(GUEST_PATCHES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function savePatch(guestName: string, updates: any) {
    try {
        const patches = loadPatches();
        const key = guestName.toLowerCase().trim();
        patches[key] = { ...(patches[key] || {}), ...updates };
        sessionStorage.setItem(GUEST_PATCHES_KEY, JSON.stringify(patches));
    } catch { /* storage full */ }
}

function applyPatches(guests: any[]): any[] {
    const patches = loadPatches();
    return guests.map(g => {
        const key = `${g.firstName} ${g.lastName}`.toLowerCase().trim();
        const patch = patches[key];
        if (patch) {
            return { ...g, ...patch };
        }
        return g;
    });
}

export default function GuestsPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [consent, setConsent] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState("");
    const [editingContact, setEditingContact] = useState(false);
    const [editedPhone, setEditedPhone] = useState("");
    const [editedEmail, setEditedEmail] = useState("");
    const isDemo = useIsDemo();

    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsConnected, setReviewsConnected] = useState<boolean>(false);
    const [sentimentScore, setSentimentScore] = useState(0);

    useEffect(() => {
        // Load guests from API, then apply any session patches
        fetch("/api/guests").then(r => r.json()).then(apiData => {
            const patchedGuests = applyPatches(apiData?.guests ?? []);
            setData({ ...apiData, guests: patchedGuests });
        }).catch(() => {});

        setConsent(sessionStorage.getItem("guests_consent") === "true");

        fetch("/api/reviews")
            .then(r => r.json())
            .then(d => {
                if (d.connected) {
                    setReviewsConnected(true);
                    setReviews(d.reviews || []);
                    setSentimentScore(d.sentimentScore || 0);
                }
            })
            .catch(() => { });

        // Listen for chatbot guest updates — apply directly to local state
        const handleGuestUpdated = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail?.name) return;

            // Build the patch from chatbot data
            const patch: any = {};
            if (detail.dietaryNotes !== undefined) patch.dietaryNotes = detail.dietaryNotes;
            if (detail.isVip !== undefined) patch.isVip = detail.isVip;
            if (detail.notes !== undefined) patch.notes = detail.notes;
            if (detail.preferences) patch.preferences = detail.preferences;
            if (detail.specialOccasions) patch.specialOccasions = detail.specialOccasions;
            if (detail.favoriteItems) patch.favoriteItems = detail.favoriteItems;
            if (detail.phone !== undefined) patch.phone = detail.phone;
            if (detail.email !== undefined) patch.email = detail.email;

            // Save to sessionStorage for persistence across navigation
            savePatch(detail.name, patch);

            // Apply immediately to local React state
            setData((prev: any) => {
                if (!prev) return prev;
                const updatedGuests = prev.guests.map((g: any) => {
                    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase().trim();
                    if (fullName === detail.name.toLowerCase().trim()) {
                        const updated = { ...g, ...patch };
                        // Also update selected guest if it's the same
                        setSelected((sel: any) => sel && sel.id === g.id ? updated : sel);
                        return updated;
                    }
                    return g;
                });
                return { ...prev, guests: updatedGuests };
            });
        };
        window.addEventListener("guest-updated", handleGuestUpdated);

        return () => {
            window.removeEventListener("guest-updated", handleGuestUpdated);
        };
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
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Guest Intelligence</span>
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
                <div className="topbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        type="file" accept=".csv,.txt" id="csv-upload-guests"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                                const res = await fetch("/api/guests/import", { method: "POST", body: formData });
                                const d = await res.json();
                                if (d.success) {
                                    alert(`✅ Imported! ${d.summary.created} new, ${d.summary.updated} updated`);
                                    window.location.reload();
                                } else {
                                    alert(`❌ ${d.error || "Import failed"}`);
                                }
                            } catch { alert("❌ Upload failed"); }
                            e.target.value = "";
                        }}
                    />
                    <label htmlFor="csv-upload-guests" style={{ fontSize: 12, padding: "6px 14px", background: "rgba(232,201,110,0.08)", border: "1px solid rgba(232,201,110,0.2)", color: "#E8C96E", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>📥 Import CSV</label>
                    {data?.stats?.totalGuests > 0 && (
                        <span style={{ fontSize: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--green)", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
                            {data.stats.totalGuests} Guests
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
                        {/* AI GUEST INSIGHTS */}
                        {(() => {
                            const today = new Date();
                            const lostGuests = guests.filter((g: any) => {
                                if (!g.lastVisit) return false;
                                const last = new Date(g.lastVisit);
                                const daysSince = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                                return daysSince > 30 && g.visitCount >= 3;
                            });
                            const upcomingOccasions = guests.filter((g: any) => g.specialOccasions && g.specialOccasions.length > 0).slice(0, 3);
                            return (lostGuests.length > 0 || upcomingOccasions.length > 0) ? (
                                <div style={{ display: "grid", gridTemplateColumns: lostGuests.length > 0 && upcomingOccasions.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 20 }}>
                                    {lostGuests.length > 0 && (
                                        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 14, padding: "16px 20px" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠️ At Risk — Haven't visited in 30+ days</div>
                                            {lostGuests.slice(0, 4).map((g: any) => {
                                                const daysSince = Math.floor((today.getTime() - new Date(g.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <div key={g.id} onClick={() => setSelected(g)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                                                        <div>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{g.isVip ? "⭐ " : ""}{g.firstName} {g.lastName}</span>
                                                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>{g.visitCount} visits · avg ${g.averageSpend}</span>
                                                        </div>
                                                        <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>{daysSince}d ago</span>
                                                    </div>
                                                );
                                            })}
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>🧠 Tip: Send a personalized offer or "we miss you" email to re-engage these guests.</div>
                                        </div>
                                    )}
                                    {upcomingOccasions.length > 0 && (
                                        <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "16px 20px" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#E8C96E", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>🎉 Special Occasions on File</div>
                                            {upcomingOccasions.map((g: any) => (
                                                <div key={g.id} onClick={() => setSelected(g)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{g.firstName} {g.lastName}</span>
                                                    <span style={{ fontSize: 12, color: "#E8C96E" }}>🎂 {g.specialOccasions[0]}</span>
                                                </div>
                                            ))}
                                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>🧠 Tip: Prepare a complimentary dessert or personalized greeting for these guests.</div>
                                        </div>
                                    )}
                                </div>
                            ) : null;
                        })()}

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

                                            {/* Contact - Editable */}
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Contact</div>
                                                    {!editingContact ? (
                                                        <button
                                                            onClick={() => { setEditingContact(true); setEditedPhone(selected.phone || ""); setEditedEmail(selected.email || ""); }}
                                                            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 11, padding: "3px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <button
                                                                onClick={() => {
                                                                    const updatedGuest = { ...selected, phone: editedPhone, email: editedEmail };
                                                                    savePatch(`${selected.firstName} ${selected.lastName}`, { phone: editedPhone, email: editedEmail });
                                                                    setSelected(updatedGuest);
                                                                    setData((prev: any) => {
                                                                        if (!prev) return prev;
                                                                        const updatedGuests = prev.guests.map((g: any) =>
                                                                            g.id === selected.id ? { ...g, phone: editedPhone, email: editedEmail } : g
                                                                        );
                                                                        return { ...prev, guests: updatedGuests };
                                                                    });
                                                                    setEditingContact(false);
                                                                }}
                                                                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, color: "var(--green)", fontSize: 11, padding: "3px 10px", cursor: "pointer" }}
                                                            >
                                                                ✓ Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingContact(false)}
                                                                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", fontSize: 11, padding: "3px 10px", cursor: "pointer" }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingContact ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 50, flexShrink: 0 }}>📞</span>
                                                            <input
                                                                value={editedPhone}
                                                                onChange={e => setEditedPhone(e.target.value)}
                                                                placeholder="Phone number"
                                                                style={{
                                                                    flex: 1, fontSize: 13, color: "var(--text-primary)",
                                                                    background: "var(--bg-secondary)", borderRadius: 8, padding: "8px 12px",
                                                                    border: "1px solid var(--gold)", outline: "none", fontFamily: "inherit",
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 50, flexShrink: 0 }}>✉️</span>
                                                            <input
                                                                value={editedEmail}
                                                                onChange={e => setEditedEmail(e.target.value)}
                                                                placeholder="Email address"
                                                                style={{
                                                                    flex: 1, fontSize: 13, color: "var(--text-primary)",
                                                                    background: "var(--bg-secondary)", borderRadius: 8, padding: "8px 12px",
                                                                    border: "1px solid var(--gold)", outline: "none", fontFamily: "inherit",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => { setEditingContact(true); setEditedPhone(selected.phone || ""); setEditedEmail(selected.email || ""); }}
                                                        style={{ cursor: "pointer", border: "1px solid transparent", borderRadius: 8, padding: "2px 0", transition: "border-color 0.15s" }}
                                                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                                                    >
                                                        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selected.phone || "No phone"}</div>
                                                        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selected.email || "No email"}</div>
                                                    </div>
                                                )}
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

                                            {/* Notes - Editable */}
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Manager Notes</div>
                                                    {!editingNotes ? (
                                                        <button
                                                            onClick={() => { setEditingNotes(true); setEditedNotes(selected.notes || ""); }}
                                                            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 11, padding: "3px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <button
                                                                onClick={() => {
                                                                    // Save edited notes locally
                                                                    const updatedGuest = { ...selected, notes: editedNotes };
                                                                    savePatch(`${selected.firstName} ${selected.lastName}`, { notes: editedNotes });
                                                                    setSelected(updatedGuest);
                                                                    setData((prev: any) => {
                                                                        if (!prev) return prev;
                                                                        const updatedGuests = prev.guests.map((g: any) =>
                                                                            g.id === selected.id ? { ...g, notes: editedNotes } : g
                                                                        );
                                                                        return { ...prev, guests: updatedGuests };
                                                                    });
                                                                    setEditingNotes(false);
                                                                }}
                                                                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, color: "var(--green)", fontSize: 11, padding: "3px 10px", cursor: "pointer" }}
                                                            >
                                                                ✓ Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingNotes(false)}
                                                                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", fontSize: 11, padding: "3px 10px", cursor: "pointer" }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingNotes ? (
                                                    <textarea
                                                        value={editedNotes}
                                                        onChange={e => setEditedNotes(e.target.value)}
                                                        placeholder="Add manager notes..."
                                                        style={{
                                                            width: "100%", minHeight: 80, fontSize: 13, color: "var(--text-primary)",
                                                            background: "var(--bg-secondary)", borderRadius: 10, padding: "10px 14px",
                                                            lineHeight: 1.6, border: "1px solid var(--gold)", outline: "none",
                                                            resize: "vertical", fontFamily: "inherit",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => { setEditingNotes(true); setEditedNotes(selected.notes || ""); }}
                                                        style={{
                                                            fontSize: 13, color: selected.notes ? "var(--text-secondary)" : "var(--text-muted)",
                                                            background: "var(--bg-secondary)", borderRadius: 10, padding: "10px 14px",
                                                            lineHeight: 1.6, cursor: "pointer", whiteSpace: "pre-wrap",
                                                            minHeight: 36, border: "1px solid transparent",
                                                            transition: "border-color 0.15s",
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                                                    >
                                                        {selected.notes || "Click to add notes..."}
                                                    </div>
                                                )}
                                            </div>

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
                                    🧠 AI Sentiment: {sentimentScore}% Positive
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
