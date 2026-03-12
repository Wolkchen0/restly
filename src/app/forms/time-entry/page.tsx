"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FormContent() {
    const searchParams = useSearchParams();
    const locId = searchParams.get("locId") || "";
    const [status, setStatus] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");
    const [formValues, setFormValues] = useState<{ employeeName: string; employeeRole: string; date: string; clockIn: string; clockOut: string; reason: string }>({ employeeName: "", employeeRole: "", date: "", clockIn: "", clockOut: "", reason: "" });

    const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setFormValues({
            employeeName: formData.get("employeeName") as string,
            employeeRole: formData.get("employeeRole") as string,
            date: formData.get("date") as string,
            clockIn: formData.get("clockIn") as string || "N/A",
            clockOut: formData.get("clockOut") as string || "N/A",
            reason: formData.get("reason") as string || "",
        });
        setStatus("confirm");
    };

    const handleConfirmSubmit = async () => {
        if (!locId) {
            alert("No Location ID found. This form link is invalid.");
            return;
        }
        setStatus("loading");
        const fullReason = `Missing punch on ${formValues.date}. In: ${formValues.clockIn}, Out: ${formValues.clockOut}. ${formValues.reason}`;
        try {
            const res = await fetch("/api/timeoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId: locId,
                    type: "TIMEENTRY",
                    employeeName: formValues.employeeName,
                    employeeRole: formValues.employeeRole,
                    startDate: formValues.date,
                    endDate: formValues.date,
                    reason: fullReason,
                })
            });
            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch (e) {
            setStatus("error");
        }
    };

    const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box" as const };
    const labelStyle = { display: "block" as const, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 };

    if (status === "success") {
        return (
            <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", padding: 40, borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)", maxWidth: 420, width: "100%" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, color: "#4ade80" }}>✓</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "#4ade80" }}>Fix Request Submitted</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                        Your time entry fix request has been submitted. Your manager will review and correct the punch record.
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, textAlign: "left", fontSize: 13, color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ marginBottom: 8 }}>{formValues.employeeName} — {formValues.employeeRole}</div>
                        <div style={{ marginBottom: 8 }}>Date: {formValues.date} | In: {formValues.clockIn} | Out: {formValues.clockOut}</div>
                        {formValues.reason && <div style={{ color: "rgba(255,255,255,0.4)" }}>{formValues.reason}</div>}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>You may close this page now.</div>
                </div>
            </div>
        );
    }

    if (status === "confirm" || status === "loading") {
        return (
            <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ maxWidth: 500, width: "100%" }}>
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <div style={{ fontWeight: 900, fontSize: 24, color: "#E8C96E", marginBottom: 16 }}>✦ Restly</div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Confirm Fix Request</h1>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Please review the details below before submitting.</p>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
                        {[
                            { label: "Name", value: formValues.employeeName },
                            { label: "Role", value: formValues.employeeRole },
                            { label: "Date", value: formValues.date },
                            { label: "Clock In", value: formValues.clockIn },
                            { label: "Clock Out", value: formValues.clockOut },
                            { label: "Reason", value: formValues.reason || "—" },
                        ].map(item => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{item.label}</span>
                                <span style={{ fontSize: 14, color: "#fff", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                            <button
                                onClick={() => setStatus("idle")}
                                disabled={status === "loading"}
                                style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                            >
                                ← Go Back
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={status === "loading"}
                                style={{ flex: 2, padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #C9A84C, #E8C96E)", color: "#1a1000", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: status === "loading" ? 0.7 : 1 }}
                            >
                                {status === "loading" ? "Submitting..." : "Confirm & Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", padding: 40, borderRadius: 20, border: "1px solid rgba(239,68,68,0.2)", maxWidth: 400, width: "100%" }}>
                    <div style={{ fontSize: 50, marginBottom: 20 }}>⚠</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: "#ef4444" }}>Submission Failed</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 20 }}>Something went wrong. Please try again.</p>
                    <button onClick={() => setStatus("confirm")} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #C9A84C, #E8C96E)", color: "#1a1000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ maxWidth: 500, width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontWeight: 900, fontSize: 24, color: "#E8C96E", marginBottom: 16 }}>✦ Restly</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Time Entry Fix Request</h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Forgot to clock in or out? Submit a fix request below.</p>
                </div>

                <form onSubmit={handlePreview} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 32 }}>

                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Full Name *</label>
                        <input name="employeeName" required type="text" placeholder="e.g. Carlos Rivera" defaultValue={formValues.employeeName} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Role / Department *</label>
                        <input name="employeeRole" required type="text" placeholder="e.g. Server, Line Cook, Bartender" defaultValue={formValues.employeeRole} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Date of Missing Punch *</label>
                        <input name="date" required type="date" defaultValue={formValues.date} style={inputStyle} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={labelStyle}>Correct Clock-In Time</label>
                            <input name="clockIn" type="time" defaultValue={formValues.clockIn !== "N/A" ? formValues.clockIn : ""} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Correct Clock-Out Time</label>
                            <input name="clockOut" type="time" defaultValue={formValues.clockOut !== "N/A" ? formValues.clockOut : ""} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={labelStyle}>Reason (Optional)</label>
                        <textarea name="reason" placeholder="Forgot to punch out, POS was down, etc." rows={3} defaultValue={formValues.reason} style={{ ...inputStyle, resize: "vertical" as const }} />
                    </div>

                    <button
                        type="submit"
                        style={{ width: "100%", background: "linear-gradient(135deg, #C9A84C, #E8C96E)", color: "#1a1000", fontWeight: 800, fontSize: 16, padding: "16px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                        Review & Submit →
                    </button>

                    <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        Securely submitted via Restly
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TimeEntryFixForm() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <FormContent />
        </Suspense>
    );
}
