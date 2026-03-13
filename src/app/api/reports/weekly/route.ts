import { NextResponse } from "next/server";
import { getInventoryStats } from "@/services/toast";
import { getTodayReservations, getAllGuests } from "@/services/opentable";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test");

export async function GET() {
    // Generate weekly report data
    const dayOfMonth = new Date().getDate();
    const daily = { revenue: 5867, cogs: 1710, labor: 1903, opex: 500 };
    const weekDays = Math.min(dayOfMonth, 7);
    const stats = getInventoryStats();
    const guests = getAllGuests();
    const reservations = getTodayReservations();

    const weeklyRevenue = daily.revenue * weekDays;
    const weeklyCogs = daily.cogs * weekDays;
    const weeklyLabor = daily.labor * weekDays;
    const weeklyOpex = daily.opex * weekDays;
    const weeklyProfit = weeklyRevenue - weeklyCogs - weeklyLabor - weeklyOpex;
    const profitMargin = ((weeklyProfit / weeklyRevenue) * 100).toFixed(1);
    const laborPct = ((weeklyLabor / weeklyRevenue) * 100).toFixed(1);
    const cogsPct = ((weeklyCogs / weeklyRevenue) * 100).toFixed(1);

    // Staff performance data
    const topPerformers = [
        { name: "Sarah Jenkins", role: "Sr. Server", sales: 8430, tipPct: 22.4 },
        { name: "Lisa Park", role: "Bartender", sales: 7100, tipPct: 24.1 },
        { name: "Marcus Torres", role: "Server", sales: 6480, tipPct: 19.8 },
    ];

    // Menu engineering highlights
    const menuHighlights = [
        { item: "Truffle Burger", category: "Star ⭐", sales: 142, margin: "68%" },
        { item: "Wagyu Tenderloin", category: "Puzzle ❓", sales: 28, margin: "72%" },
        { item: "Lobster Bisque", category: "Cash Cow 🐄", sales: 98, margin: "45%" },
    ];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weekDays + 1);
    const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const report = {
        subject: `Restly Weekly Report — ${formatDate(weekStart)} to ${formatDate(now)}`,
        period: `${formatDate(weekStart)} – ${formatDate(now)} (${weekDays} days)`,
        generatedAt: now.toISOString(),
        financialSummary: {
            revenue: { value: weeklyRevenue, formatted: "$" + weeklyRevenue.toLocaleString(), changeFromLastWeek: "+3.2%" },
            cogs: { value: weeklyCogs, formatted: "$" + weeklyCogs.toLocaleString(), percent: cogsPct + "%" },
            labor: { value: weeklyLabor, formatted: "$" + weeklyLabor.toLocaleString(), percent: laborPct + "%" },
            opex: { value: weeklyOpex, formatted: "$" + weeklyOpex.toLocaleString() },
            netProfit: { value: weeklyProfit, formatted: "$" + weeklyProfit.toLocaleString(), margin: profitMargin + "%" },
            primeCost: ((weeklyCogs + weeklyLabor) / weeklyRevenue * 100).toFixed(1) + "%",
        },
        inventory: {
            totalItems: stats.total,
            inStock: stats.inStock,
            lowStock: stats.lowStock,
            outOfStock: stats.outOfStock,
            totalValue: "$" + stats.totalValue.toLocaleString(),
        },
        staffPerformance: {
            topPerformers,
            totalStaffSales: "$" + topPerformers.reduce((a, s) => a + s.sales, 0).toLocaleString(),
        },
        guests: {
            totalGuests: guests.length,
            vipGuests: guests.filter(g => g.isVip).length,
            avgReservationsPerDay: reservations.length,
        },
        equipmentAlerts: [
            { name: "Hobart Dishwasher", status: "Needs Maintenance", daysPending: 3 },
            { name: "Pitco Fryer #2", status: "Broken", daysPending: 5 },
        ],
        menuHighlights,
        aiRecommendations: [
            "Labor cost %32.4 son 2 haftadır hedefin üstünde. Salı ve Çarşamba öğlen shift'lerinde 1 server azaltmayı düşünün — tahmini haftalık tasarruf: $380.",
            "Wagyu Tenderloin %72 marjla Puzzle kategorisinde — satışı haftada sadece 28. Server'lara $50 upsell bonusu verin, $1,600/hafta ek gelir potansiyeli.",
            "3 ürün out of stock — Black Truffle, Crème Brûlée Mix, Aperol. Bu 3 ürün 4 menü itemını etkiliyor.",
            "Pitco Fryer #2 arızası 5. gününde. Garanti süresi dolmuş. Yeni fryer maliyeti vs. tamir maliyetini değerlendirin.",
        ],
    };

    return NextResponse.json(report);
}

export async function POST(req: Request) {
    const { email } = await req.json().catch(() => ({ email: "" }));

    if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Generate the report data
    const reportRes = await GET();
    const report = await reportRes.json();
    const f = report.financialSummary;

    // Build styled HTML email
    const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0e0e1c;color:#fff;border-radius:20px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 28px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15);">
            <div style="font-size:24px;font-weight:900;color:#E8C96E;letter-spacing:-0.5px;margin-bottom:4px;">✦ Restly</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:16px;">AI Restaurant Manager</div>
            <div style="font-size:18px;font-weight:800;color:#fff;">📊 Weekly Performance Report</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;">${report.period}</div>
        </div>

        <!-- KPI Grid -->
        <div style="padding:24px 28px;">
            <div style="font-size:12px;font-weight:700;color:#E8C96E;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">💰 Financial Summary</div>
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="padding:10px 12px;background:rgba(74,222,128,0.06);border-radius:10px 0 0 0;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);">Revenue</div>
                        <div style="font-size:18px;font-weight:800;color:#4ade80;">${f.revenue.formatted}</div>
                    </td>
                    <td style="padding:10px 12px;background:rgba(248,113,113,0.06);border-radius:0 10px 0 0;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);">COGS (${f.cogs.percent})</div>
                        <div style="font-size:18px;font-weight:800;color:#f87171;">${f.cogs.formatted}</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:10px 12px;background:rgba(96,165,250,0.06);border-radius:0 0 0 10px;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);">Labor (${f.labor.percent})</div>
                        <div style="font-size:18px;font-weight:800;color:#60a5fa;">${f.labor.formatted}</div>
                    </td>
                    <td style="padding:10px 12px;background:rgba(201,168,76,0.06);border-radius:0 0 10px 0;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);">Net Profit (${f.netProfit.margin})</div>
                        <div style="font-size:18px;font-weight:800;color:#E8C96E;">${f.netProfit.formatted}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Staff Leaderboard -->
        <div style="padding:0 28px 24px;">
            <div style="font-size:12px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">🏆 Top Staff</div>
            ${report.staffPerformance.topPerformers.map((s: { name: string; role: string; sales: number; tipPct: number }, i: number) => `
                <div style="display:flex;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px;">
                    <span style="font-size:16px;margin-right:10px;">${["🥇", "🥈", "🥉"][i]}</span>
                    <span style="flex:1;font-size:13px;font-weight:600;color:#fff;">${s.name} <span style="color:rgba(255,255,255,0.3);font-weight:400;">— ${s.role}</span></span>
                    <span style="font-size:13px;font-weight:700;color:#4ade80;">$${s.sales.toLocaleString()}</span>
                </div>
            `).join("")}
        </div>

        <!-- Inventory -->
        <div style="padding:0 28px 24px;">
            <div style="font-size:12px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">📦 Inventory Status</div>
            <div style="display:flex;gap:8px;">
                <div style="flex:1;text-align:center;padding:10px;background:rgba(74,222,128,0.06);border-radius:10px;">
                    <div style="font-size:18px;font-weight:800;color:#4ade80;">${report.inventory.inStock}</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.4);">In Stock</div>
                </div>
                <div style="flex:1;text-align:center;padding:10px;background:rgba(251,191,36,0.06);border-radius:10px;">
                    <div style="font-size:18px;font-weight:800;color:#fbbf24;">${report.inventory.lowStock}</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.4);">Low Stock</div>
                </div>
                <div style="flex:1;text-align:center;padding:10px;background:rgba(248,113,113,0.06);border-radius:10px;">
                    <div style="font-size:18px;font-weight:800;color:#f87171;">${report.inventory.outOfStock}</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.4);">Out of Stock</div>
                </div>
            </div>
        </div>

        <!-- AI Recommendations -->
        <div style="padding:0 28px 24px;">
            <div style="font-size:12px;font-weight:700;color:#E8C96E;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">🤖 AI Recommendations</div>
            ${report.aiRecommendations.map((tip: string) => `
                <div style="padding:10px 14px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.1);border-radius:10px;margin-bottom:6px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">
                    💡 ${tip}
                </div>
            `).join("")}
        </div>

        <!-- Footer -->
        <div style="padding:20px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:11px;color:rgba(255,255,255,0.25);">Generated by Restly AI • ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.15);margin-top:4px;">Powered by Meyhouse</div>
        </div>
    </div>`;

    // Send via Resend
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test") {
        console.log(`[WEEKLY REPORT SKIPPED] No RESEND_API_KEY — would send to ${email}`);
        return NextResponse.json({ success: true, message: `Report generated (email requires API key)`, report });
    }

    try {
        const { data, error } = await resend.emails.send({
            from: "Restly <onboarding@resend.dev>",
            to: email,
            subject: report.subject,
            html,
        });

        if (error) {
            console.error("Weekly report email error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        console.log(`[WEEKLY REPORT SENT] to ${email}, id: ${data?.id}`);
        return NextResponse.json({ success: true, message: `Weekly report sent to ${email}`, emailId: data?.id, report });
    } catch (err) {
        console.error("Weekly report send failed:", err);
        return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }
}

