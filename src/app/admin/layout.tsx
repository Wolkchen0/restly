import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0a0f 0%, #121218 50%, #0a0a0f 100%)",
            color: "#fff",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
            {/* Admin Header */}
            <header style={{
                padding: "16px 32px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(20px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #C9A84C, #E8C96E)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 900, color: "#1a1000",
                    }}>R</div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Restly Admin</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Üye Yönetim Paneli</div>
                    </div>
                </div>
                <a href="/dashboard" style={{
                    fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                    textDecoration: "none", padding: "8px 16px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s",
                }}>
                    ← Dashboard'a Dön
                </a>
            </header>
            <main>{children}</main>
        </div>
    );
}
