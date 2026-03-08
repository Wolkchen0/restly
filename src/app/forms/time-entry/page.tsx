"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FormContent() {
    const searchParams = useSearchParams();
    const locId = searchParams.get("locId") || "";
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const employeeName = formData.get("employeeName") as string;
        const employeeRole = formData.get("employeeRole") as string;
        const date = formData.get("date") as string;
        const clockIn = formData.get("clockIn") as string;
        const clockOut = formData.get("clockOut") as string;
        const reasonStr = formData.get("reason") as string;

        const fullReason = `Missing punch on ${date}. In: ${clockIn || "N/A"}, Out: ${clockOut || "N/A"}. ${reasonStr}`;

        if (!locId) {
            alert("No Location ID found. This form link is invalid.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch("/api/timeoff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId: locId,
                    type: "TIMEENTRY",
                    employeeName,
                    employeeRole,
                    startDate: date,
                    endDate: date,
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

    if (status === "success") {
        return (
            <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", padding: 40, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", maxWidth: 400, width: "100%" }}>
                    <div style={{ fontSize: 50, marginBottom: 20 }}>✅</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Request Submitted</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Your manager has received your Time Entry Fix Request via Restly. You can now close this tab.</p>
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
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Forgot to clock in or out? Submit a fix request below. It will go directly to your manager's dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 32 }}>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Full Name *</label>
                        <input name="employeeName" required type="text" placeholder="e.g. Carlos Rivera" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15 }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Role / Department *</label>
                        <input name="employeeRole" required type="text" placeholder="e.g. Server, Line Cook, Bartender" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15 }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Date of Missing Punch *</label>
                        <input name="date" required type="date" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15 }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Correct Clock-In Time</label>
                            <input name="clockIn" type="time" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15 }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Correct Clock-Out Time</label>
                            <input name="clockOut" type="time" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15 }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Reason (Optional)</label>
                        <textarea name="reason" placeholder="Forgot to punch out, POS was down, etc." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 15, fontFamily: "inherit", resize: "vertical" }} />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        style={{ width: "100%", background: "linear-gradient(135deg, #C9A84C, #E8C96E)", color: "#1a1000", fontWeight: 800, fontSize: 16, padding: "16px", borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s", opacity: status === "loading" ? 0.7 : 1 }}
                    >
                        {status === "loading" ? "Submitting..." : "Submit Fix Request"}
                    </button>

                    <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        🔒 Securely submitted tracking via Restly AI
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
