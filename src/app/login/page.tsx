"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDemo = searchParams.get("demo") === "true";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [demoHint, setDemoHint] = useState(false);

    // Auto-fill if demo=true param present
    useEffect(() => {
        if (isDemo) {
            setEmail("demo@restly.com");
            setPassword("demo1234");
            setDemoHint(true);
        }
    }, [isDemo]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const result = await signIn("credentials", { email, password, redirect: false });
            if (result?.error) {
                if (result.error.includes("EMAIL_NOT_VERIFIED")) {
                    setError("Your email is not verified. Please check your inbox for the verification code and complete signup.");
                } else {
                    setError("Invalid email or password. Try the demo credentials below.");
                }
                setLoading(false);
                return;
            }
            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    async function handleDemoLogin() {
        setEmail("demo@restly.com");
        setPassword("demo1234");
        setLoading(true);
        setError("");
        const result = await signIn("credentials", {
            email: "demo@restly.com",
            password: "demo1234",
            redirect: false,
        });
        if (result?.error) {
            setError("Demo account unavailable. Please try again.");
            setLoading(false);
            return;
        }
        router.push("/dashboard");
    }

    return (
        <div className="auth-page">
            {/* Background glow */}
            <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(201,168,76,0.06)", filter: "blur(100px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

            <div className="auth-card fade-in">
                <Link href="/" className="auth-logo">✦ Restly</Link>

                {isDemo ? (
                    <>
                        <div className="auth-title">Live Demo</div>
                        <div className="auth-sub">Explore all Restly enterprise features in a live environment</div>
                    </>
                ) : (
                    <>
                        <div className="auth-title">Welcome back</div>
                        <div className="auth-sub">Sign in to your restaurant dashboard</div>
                    </>
                )}

                {error && <div className="form-error">⚠ {error}</div>}

                {/* Demo auto-login banner */}
                {demoHint && (
                    <div style={{ marginBottom: 20, padding: "14px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#E8C96E", marginBottom: 8 }}>🎯 Demo Account Pre-filled</div>
                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            style={{ width: "100%", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", color: "#1a1000", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                            {loading ? "Entering demo…" : "Enter Live Demo →"}
                        </button>
                        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                            demo@restly.com · Sample Restaurant Group (3 locations)
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Restaurant Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="manager@yourrestaurant.com"
                            required
                            autoFocus={!isDemo}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: "100%", marginTop: 8, justifyContent: "center" }}
                    >
                        {loading ? "Signing in…" : isDemo ? "Sign in to Demo →" : "Sign In →"}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>
                        Don&apos;t have an account?
                    </div>
                    <Link href="/signup" style={{ display: "block", width: "100%", padding: "12px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, color: "#E8C96E", fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center", fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s" }}>
                        Sign Up — Start Free Trial →
                    </Link>
                </div>

                {/* Demo hint (non-demo mode) */}
                {!isDemo && (
                    <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 6 }}>🎯 Want to explore first?</div>
                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            style={{ width: "100%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "#E8C96E", fontWeight: 700, fontSize: 12, borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                            Try Global Demo Account →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrap in Suspense for useSearchParams
export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ background: "#08080f", minHeight: "100vh" }} />}>
            <LoginForm />
        </Suspense>
    );
}
