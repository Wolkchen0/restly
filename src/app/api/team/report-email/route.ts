import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test");

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { staffName, role, email, restaurantName, period, metrics } = body;

        if (!email || !staffName) {
            return NextResponse.json({ error: "Email and staff name required" }, { status: 400 });
        }

        const {
            totalSales = 0, foodSales = 0, drinkSales = 0,
            checkAvg = 0, turnTime = 0, tipPct = 0,
            upsellRate = 0, daysWorked = 0, rank = 0,
            totalStaff = 0, overallScore = 0,
            strengths = [], opportunities = [], focusAreas = [],
        } = metrics || {};

        const drinkPct = totalSales > 0 ? Math.round((drinkSales / totalSales) * 100) : 0;
        const foodPct = 100 - drinkPct;

        const scoreColor = overallScore >= 80 ? "#22c55e" : overallScore >= 60 ? "#E8C96E" : "#ef4444";

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
    
    <!-- Header -->
    <div style="background:#0e0e1c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:#E8C96E;letter-spacing:-1px;">✦ Restly</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Staff Performance Report</div>
    </div>

    <!-- Main Content -->
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Name & Score -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;border-bottom:2px solid #f0f0f0;padding-bottom:20px;">
            <div>
                <h1 style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">${staffName}</h1>
                <div style="font-size:14px;color:#666;margin-top:4px;">${restaurantName} | ${role} | ${period}</div>
                <div style="font-size:13px;color:#888;margin-top:4px;">
                    ${daysWorked} shifts worked | $${totalSales.toLocaleString()} total sales | ${drinkPct}% bev mix
                </div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:48px;font-weight:900;color:${scoreColor};">${overallScore.toFixed(1)}</div>
                <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Score</div>
            </div>
        </div>

        <!-- Rank Badge -->
        <div style="background:${rank <= 3 ? '#f0fdf4' : rank <= totalStaff * 0.5 ? '#fefce8' : '#fef2f2'};border:1px solid ${rank <= 3 ? '#bbf7d0' : rank <= totalStaff * 0.5 ? '#fef08a' : '#fecaca'};border-radius:8px;padding:10px 16px;font-size:13px;font-weight:600;color:${rank <= 3 ? '#15803d' : rank <= totalStaff * 0.5 ? '#a16207' : '#dc2626'};margin-bottom:24px;text-align:center;">
            ${role} | Rank #${rank} of ${totalStaff} | ${overallScore >= 80 ? 'Top performer' : overallScore >= 60 ? 'Solid contributor' : 'Major opportunity'}
        </div>

        <!-- KPI Scores -->
        <h3 style="font-size:16px;font-weight:800;color:#1a1a1a;margin:24px 0 16px;">Weighted KPI Scores</h3>
        <div style="font-size:12px;color:#888;margin-bottom:16px;">Score = Your KPI / Average × Weight. Baseline 100 = average across all peers.</div>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:12px 8px;font-size:13px;color:#444;">Sales / guest (20%)</td>
                <td style="padding:12px 8px;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">$${checkAvg}</td>
            </tr>
            <tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:12px 8px;font-size:13px;color:#444;">Bev / guest (30%)</td>
                <td style="padding:12px 8px;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">$${totalSales > 0 && daysWorked > 0 ? Math.round(drinkSales / daysWorked) : 0}</td>
            </tr>
            <tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:12px 8px;font-size:13px;color:#444;">Bev mix % (30%)</td>
                <td style="padding:12px 8px;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">${drinkPct}%</td>
            </tr>
            <tr>
                <td style="padding:12px 8px;font-size:13px;color:#444;">Sales / day (20%)</td>
                <td style="padding:12px 8px;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">$${daysWorked > 0 ? Math.round(totalSales / daysWorked).toLocaleString() : 0}</td>
            </tr>
        </table>

        <!-- Performance Summary -->
        <h3 style="font-size:16px;font-weight:800;color:#1a1a1a;margin:24px 0 16px;">Performance Summary</h3>
        <table style="width:100%;border-collapse:collapse;">
            <tr style="vertical-align:top;">
                <td style="padding:8px;width:33%;">
                    <div style="font-size:12px;font-weight:700;color:#22c55e;margin-bottom:8px;">+ Strengths</div>
                    ${(strengths as string[]).map((s: string) => `<div style="font-size:12px;color:#444;margin-bottom:6px;line-height:1.4;">• ${s}</div>`).join('')}
                </td>
                <td style="padding:8px;width:33%;">
                    <div style="font-size:12px;font-weight:700;color:#E8C96E;margin-bottom:8px;">! Opportunities</div>
                    ${(opportunities as string[]).map((s: string) => `<div style="font-size:12px;color:#444;margin-bottom:6px;line-height:1.4;">• ${s}</div>`).join('')}
                </td>
                <td style="padding:8px;width:33%;">
                    <div style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:8px;">&gt; Focus Areas</div>
                    ${(focusAreas as string[]).map((s: string) => `<div style="font-size:12px;color:#444;margin-bottom:6px;line-height:1.4;">• ${s}</div>`).join('')}
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #f0f0f0;text-align:center;font-size:11px;color:#aaa;">
            Generated by Restly AI · ${new Date().toLocaleDateString()} · ${restaurantName}
        </div>
    </div>
</div>
</body>
</html>`;

        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test") {
            console.log(`[EMAIL SKIPPED] Would send performance report to: ${email}`);
            return NextResponse.json({ success: true, skipped: true, message: "Email skipped (no API key)" });
        }

        const { data, error } = await resend.emails.send({
            from: "Restly <noreply@restly.pro>",
            to: email,
            subject: `${staffName} — Performance Report | ${restaurantName}`,
            html,
        });

        if (error) {
            console.error("Report email error:", error);
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data?.id, message: `Report sent to ${email}` });
    } catch (err) {
        console.error("Report email error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
