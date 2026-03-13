"use client";
import { useState, useRef, useEffect } from "react";
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

    // Verification step
    const [step, setStep] = useState<"form" | "verify">("form");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [verifyError, setVerifyError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

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

            if (data.requiresVerification) {
                setStep("verify");
                setResendCooldown(60);
                setLoading(false);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                await signIn("credentials", { email: form.email, password: form.password, redirect: false });
                router.push("/dashboard");
            }
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    function handleCodeChange(idx: number, val: string) {
        if (!/^\d?$/.test(val)) return;
        const newCode = [...code];
        newCode[idx] = val;
        setCode(newCode);
        setVerifyError("");

        if (val && idx < 5) {
            inputRefs.current[idx + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (val && idx === 5 && newCode.every(c => c)) {
            submitVerification(newCode.join(""));
        }
    }

    function handleCodeKeyDown(idx: number, e: React.KeyboardEvent) {
        if (e.key === "Backspace" && !code[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    }

    function handleCodePaste(e: React.ClipboardEvent) {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            e.preventDefault();
            const newCode = pasted.split("");
            setCode(newCode);
            inputRefs.current[5]?.focus();
            submitVerification(pasted);
        }
    }

    async function submitVerification(fullCode: string) {
        setVerifying(true);
        setVerifyError("");
        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, code: fullCode }),
            });
            const data = await res.json();
            if (!res.ok) {
                setVerifyError(data.error || "Invalid code");
                setVerifying(false);
                return;
            }
            // Verified! Auto sign-in
            await signIn("credentials", { email: form.email, password: form.password, redirect: false });
            router.push("/dashboard");
        } catch {
            setVerifyError("Something went wrong.");
            setVerifying(false);
        }
    }

    async function resendCode() {
        if (resendCooldown > 0) return;
        setResendCooldown(60);
        try {
            await fetch("/api/verify", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });
        } catch { /* ignore */ }
    }

    if (step === "verify") {
        return (
            <div className="auth-card fade-in">
                <Link href="/" className="auth-logo">✦ Restly</Link>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
                    <div className="auth-title" style={{ marginBottom: 4 }}>Verify your email</div>
                    <div className="auth-sub" style={{ maxWidth: 300, margin: "0 auto" }}>
                        We sent a 6-digit code to <strong style={{ color: "#E8C96E" }}>{form.email}</strong>
                    </div>
                </div>

                {verifyError && <div className="form-error" style={{ marginBottom: 16 }}>⚠ {verifyError}</div>}

                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleCodeChange(i, e.target.value)}
                            onKeyDown={e => handleCodeKeyDown(i, e)}
                            onPaste={i === 0 ? handleCodePaste : undefined}
                            style={{
                                width: 48, height: 56, textAlign: "center", fontSize: 24, fontWeight: 800,
                                background: digit ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.04)",
                                border: `2px solid ${digit ? "rgba(201,168,76,0.4)" : verifyError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                                borderRadius: 12, color: "#E8C96E", outline: "none", fontFamily: "inherit",
                                transition: "all 0.15s",
                            }}
                            onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.6)"; }}
                            onBlur={e => { e.target.style.borderColor = digit ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"; }}
                        />
                    ))}
                </div>

                <button
                    onClick={() => submitVerification(code.join(""))}
                    disabled={verifying || code.some(c => !c)}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", fontSize: 15, marginBottom: 16, opacity: code.some(c => !c) ? 0.5 : 1 }}
                >
                    {verifying ? "Verifying..." : "Verify & Continue →"}
                </button>

                <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                    Didn't receive the code?{" "}
                    {resendCooldown > 0 ? (
                        <span style={{ color: "rgba(255,255,255,0.25)" }}>Resend in {resendCooldown}s</span>
                    ) : (
                        <button onClick={resendCode} style={{ background: "none", border: "none", color: "#E8C96E", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Resend Code</button>
                    )}
                </div>
            </div>
        );
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

