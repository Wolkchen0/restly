"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const result = await signIn("credentials", { email, password, redirect: false });
            if (result?.error) { setError("Invalid email or password"); setLoading(false); return; }
            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            {/* Background blob */}
            <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(201,168,76,0.05)", filter: "blur(100px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

            <div className="auth-card fade-in">
                <Link href="/" className="auth-logo">✦ Restly</Link>
                <div className="auth-title">Welcome back</div>
                <div className="auth-sub">Sign in to your restaurant dashboard</div>

                {error && <div className="form-error">⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Restaurant Email</label>
                        <input
                            className="form-input"
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="manager@yourrestaurant.com" required autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 8, justifyContent: "center" }}>
                        {loading ? "Signing in…" : "Sign In →"}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" style={{ color: "var(--gold-light)", fontWeight: 600, textDecoration: "none" }}>
                        Start free trial
                    </Link>
                </div>

                {/* Demo login hint */}
                <div style={{ marginTop: 28, padding: "14px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 6 }}>🎯 Demo Account</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Email: <span style={{ color: "var(--text-primary)" }}>demo@meyhouse.com</span></div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Password: <span style={{ color: "var(--text-primary)" }}>demo1234</span></div>
                </div>
            </div>
        </div>
    );
}
