"use client";
import { useState, useEffect } from "react";

interface Member {
    id: string;
    name: string;
    email: string;
    plan: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    trialEndsAt: string | null;
    daysSinceCreation: number;
    trialDaysRemaining: number | null;
    status: "active" | "trial" | "expired" | "vip" | "inactive";
    isVip: boolean;
    locationCount: number;
}

interface Summary {
    total: number;
    active: number;
    trial: number;
    expired: number;
    vip: number;
    inactive: number;
}

const STATUS_CONFIG = {
    active: { label: "Aktif (Ücretli)", emoji: "🟢", color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
    trial: { label: "Trial", emoji: "🟡", color: "#facc15", bg: "rgba(250,204,21,0.1)" },
    expired: { label: "Süresi Dolmuş", emoji: "🔴", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
    vip: { label: "VIP", emoji: "👑", color: "#E8C96E", bg: "rgba(232,201,110,0.1)" },
    inactive: { label: "Kapalı", emoji: "⛔", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

export default function AdminReportsPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch("/api/admin/members");
            const data = await res.json();
            setMembers(data.members || []);
            setSummary(data.summary || null);
        } catch (err) {
            console.error("Üye listesi alınamadı:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleAction = async (memberId: string, action: string, memberName: string) => {
        setActionLoading(`${memberId}-${action}`);
        try {
            const res = await fetch("/api/admin/members", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, action }),
            });
            const data = await res.json();
            if (data.success) {
                const actionLabels: Record<string, string> = {
                    activate: "Sınırsız açıldı",
                    deactivate: "Erişim kapatıldı",
                    extend_trial: "Trial 30 gün uzatıldı",
                    make_vip: "VIP yapıldı",
                };
                showToast(`✅ ${memberName}: ${actionLabels[action]}`);
                fetchMembers();
            } else {
                showToast(`❌ Hata: ${data.error}`);
            }
        } catch {
            showToast("❌ Sunucu hatası");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredMembers = members.filter((m) => {
        if (filter !== "all" && m.status !== filter) return false;
        if (search) {
            const s = search.toLowerCase();
            return m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s);
        }
        return true;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div style={{ padding: "32px 28px 80px", maxWidth: 1400, margin: "0 auto" }}>
            <style>{`
                .admin-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:24px; transition:all 0.2s; }
                .admin-card:hover { border-color:rgba(201,168,76,0.2); }
                .admin-btn { padding:8px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#fff; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
                .admin-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); }
                .admin-btn:disabled { opacity:0.4; cursor:not-allowed; }
                .btn-activate { border-color:rgba(74,222,128,0.3); color:#4ade80; }
                .btn-activate:hover { background:rgba(74,222,128,0.1); }
                .btn-deactivate { border-color:rgba(248,113,113,0.3); color:#f87171; }
                .btn-deactivate:hover { background:rgba(248,113,113,0.1); }
                .btn-extend { border-color:rgba(250,204,21,0.3); color:#facc15; }
                .btn-extend:hover { background:rgba(250,204,21,0.1); }
                .btn-vip { border-color:rgba(232,201,110,0.3); color:#E8C96E; }
                .btn-vip:hover { background:rgba(232,201,110,0.1); }
                .filter-btn { padding:8px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:rgba(255,255,255,0.5); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
                .filter-btn:hover { background:rgba(255,255,255,0.04); color:#fff; }
                .filter-btn.active { background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.3); color:#E8C96E; }
                .member-row { display:grid; grid-template-columns:2fr 2fr 1fr 1fr 1fr 1fr 2fr; gap:12px; align-items:center; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.04); transition:all 0.15s; }
                .member-row:hover { background:rgba(255,255,255,0.02); }
                @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 100,
                    background: "rgba(10,10,15,0.95)", border: "1px solid rgba(201,168,76,0.3)",
                    color: "#fff", padding: "14px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)",
                    animation: "fadeIn 0.3s ease-out",
                }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: "#E8C96E", fontWeight: 700, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>
                    Admin Panel
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
                    Üye Yönetimi & Raporlar
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                    Tüm üyeleri buradan görüntüleyin ve yönetin
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 32 }}>
                    {[
                        { label: "Toplam Üye", value: summary.total, color: "#fff", icon: "👥" },
                        { label: "Aktif (Ücretli)", value: summary.active, color: "#4ade80", icon: "🟢" },
                        { label: "Trial", value: summary.trial, color: "#facc15", icon: "🟡" },
                        { label: "Süresi Dolmuş", value: summary.expired, color: "#f87171", icon: "🔴" },
                        { label: "VIP", value: summary.vip, color: "#E8C96E", icon: "👑" },
                        { label: "Kapalı", value: summary.inactive, color: "#6b7280", icon: "⛔" },
                    ].map((c) => (
                        <div key={c.label} className="admin-card" style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: c.color, marginBottom: 4 }}>
                                {c.value}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                {c.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters & Search */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    {[
                        { key: "all", label: "Tümü" },
                        { key: "active", label: "🟢 Aktif" },
                        { key: "trial", label: "🟡 Trial" },
                        { key: "expired", label: "🔴 Expired" },
                        { key: "vip", label: "👑 VIP" },
                        { key: "inactive", label: "⛔ Kapalı" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            className={`filter-btn ${filter === f.key ? "active" : ""}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="İsim veya e-posta ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 13, width: 280,
                        outline: "none",
                    }}
                />
            </div>

            {/* Member Table */}
            <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Table Header */}
                <div className="member-row" style={{
                    background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                    <div>İsim</div>
                    <div>E-posta</div>
                    <div>Plan</div>
                    <div>Üyelik Süresi</div>
                    <div>Kalan Gün</div>
                    <div>Durum</div>
                    <div>Aksiyonlar</div>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
                        Üyeler yükleniyor...
                    </div>
                )}

                {/* Empty */}
                {!loading && filteredMembers.length === 0 && (
                    <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>📭</div>
                        {search ? "Aramayla eşleşen üye bulunamadı" : "Henüz kayıtlı üye yok"}
                    </div>
                )}

                {/* Rows */}
                {!loading && filteredMembers.map((m, i) => {
                    const cfg = STATUS_CONFIG[m.status];
                    return (
                        <div key={m.id} className="member-row" style={{ animation: `fadeIn 0.3s ease-out ${i * 0.05}s both` }}>
                            {/* Name */}
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                                    {m.name}
                                    {m.isVip && <span style={{ marginLeft: 6 }}>👑</span>}
                                </div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                                    {m.locationCount} lokasyon • {m.emailVerified ? "✓ Doğrulanmış" : "✗ Doğrulanmamış"}
                                </div>
                            </div>

                            {/* Email */}
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", wordBreak: "break-all" }}>
                                {m.email}
                            </div>

                            {/* Plan */}
                            <div style={{
                                fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                                color: m.plan === "trial" ? "#facc15" : m.plan === "pro" ? "#4ade80" : m.plan === "enterprise" ? "#E8C96E" : "#6b7280",
                            }}>
                                {m.plan}
                            </div>

                            {/* Days since creation */}
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                                {m.daysSinceCreation} gün
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                                    {formatDate(m.createdAt)}
                                </div>
                            </div>

                            {/* Trial remaining */}
                            <div style={{ fontSize: 13, fontWeight: 700, color: m.trialDaysRemaining !== null && m.trialDaysRemaining <= 5 ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                                {m.trialDaysRemaining !== null ? `${m.trialDaysRemaining} gün` : "—"}
                            </div>

                            {/* Status badge */}
                            <div>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 6,
                                    background: cfg.bg, color: cfg.color,
                                    fontSize: 11, fontWeight: 700,
                                }}>
                                    {cfg.emoji} {cfg.label}
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {m.status !== "active" && m.status !== "vip" && (
                                    <button
                                        className="admin-btn btn-activate"
                                        disabled={actionLoading === `${m.id}-activate`}
                                        onClick={() => handleAction(m.id, "activate", m.name)}
                                    >
                                        {actionLoading === `${m.id}-activate` ? "..." : "✓ Sınırsız Aç"}
                                    </button>
                                )}
                                {m.isActive && m.status !== "inactive" && (
                                    <button
                                        className="admin-btn btn-deactivate"
                                        disabled={actionLoading === `${m.id}-deactivate`}
                                        onClick={() => handleAction(m.id, "deactivate", m.name)}
                                    >
                                        {actionLoading === `${m.id}-deactivate` ? "..." : "✗ Kapat"}
                                    </button>
                                )}
                                {(m.status === "expired" || m.status === "trial") && (
                                    <button
                                        className="admin-btn btn-extend"
                                        disabled={actionLoading === `${m.id}-extend_trial`}
                                        onClick={() => handleAction(m.id, "extend_trial", m.name)}
                                    >
                                        {actionLoading === `${m.id}-extend_trial` ? "..." : "+30 Gün"}
                                    </button>
                                )}
                                {!m.isVip && m.status !== "vip" && (
                                    <button
                                        className="admin-btn btn-vip"
                                        disabled={actionLoading === `${m.id}-make_vip`}
                                        onClick={() => handleAction(m.id, "make_vip", m.name)}
                                    >
                                        {actionLoading === `${m.id}-make_vip` ? "..." : "👑 VIP Yap"}
                                    </button>
                                )}
                                {m.status === "inactive" && (
                                    <button
                                        className="admin-btn btn-activate"
                                        disabled={actionLoading === `${m.id}-activate`}
                                        onClick={() => handleAction(m.id, "activate", m.name)}
                                    >
                                        {actionLoading === `${m.id}-activate` ? "..." : "↻ Yeniden Aç"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer info */}
            <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 12, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                💡 <strong style={{ color: "#E8C96E" }}>Kullanım:</strong> "Sınırsız Aç" ile ödeme yapan müşterinin üyeliğini açın. "Kapat" ile ödeme yapmayan müşterinin erişimini kapatın. "+30 Gün" ile trial süresini uzatın. Her yeni üye otomatik olarak 30 gün ücretsiz trial alır.
            </div>
        </div>
    );
}
