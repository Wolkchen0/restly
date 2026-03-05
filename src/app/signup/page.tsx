"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";

function SignupForm() {
    const router = useRouter();
    const params = useSearchParams();
    const defaultPlan = params.get("plan") || "starter";

    const [form, setForm] = useState({ name: "", email: "", password: "", location: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, plan: defaultPlan }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }

            // Auto sign-in after registration
            await signIn("credentials", { email: form.email, password: form.password, redirect: false });
            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="auth-card fade-in">
            <Link href="/" className="auth-logo">✦ Restly</Link>
            <div className="auth-title">Start your free trial</div>
            <div className="auth-sub">14 days free · No credit card required · Cancel anytime</div>

            {/* Plan indicator */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "var(--gold-light)", marginBottom: 24 }}>
                ✦ {defaultPlan === "pro" ? "Professional Plan" : "Starter Plan"} — 14-day trial
            </div>

            {error && <div className="form-error">⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Restaurant Name</label>
                    <input className="form-input" type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Rosewood Bistro" required autoFocus />
                </div>
                <div className="form-group">
                    <label className="form-label">Manager Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="manager@restaurant.com" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="Minimum 8 characters" required minLength={8} />
                </div>
                <div className="form-group">
                    <label className="form-label">Location <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                    <input className="form-input" type="text" value={form.location} onChange={e => update("location", e.target.value)} placeholder="e.g. Los Angeles, CA" />
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 6, justifyContent: "center", fontSize: 15 }}>
                    {loading ? "Creating your account…" : "Create Account & Start Trial →"}
                </button>
            </form>

            <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
                By signing up you agree to our Terms of Service and Privacy Policy.<br />
                CCPA/CPRA compliant — your data stays private.
            </div>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--gold-light)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="auth-page">
            <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(201,168,76,0.05)", filter: "blur(100px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
            <Suspense fallback={null}>
                <SignupForm />
            </Suspense>
        </div>
    );
}
