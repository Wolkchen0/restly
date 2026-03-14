import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test");

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, code: string, restaurantName: string) {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test") {
        console.log(`[VERIFICATION CODE] ${email} → ${code}`);
        return { success: true, skipped: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: "Restly <noreply@restly.pro>",
            to: email,
            subject: `${code} — Your Restly Verification Code`,
            html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0e0e1c;color:#fff;border-radius:16px;">
                    <div style="text-align:center;margin-bottom:32px;">
                        <div style="font-size:28px;font-weight:900;color:#E8C96E;letter-spacing:-1px;">✦ Restly</div>
                        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">AI Restaurant Manager</div>
                    </div>
                    <div style="text-align:center;margin-bottom:24px;">
                        <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px;">Welcome, ${restaurantName}!</div>
                        <div style="font-size:14px;color:rgba(255,255,255,0.5);">Enter this code to verify your email:</div>
                    </div>
                    <div style="text-align:center;background:rgba(201,168,76,0.08);border:2px solid rgba(201,168,76,0.3);border-radius:16px;padding:24px;margin-bottom:24px;">
                        <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#E8C96E;">${code}</div>
                    </div>
                    <div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);">
                        This code expires in 10 minutes.<br/>If you didn't create a Restly account, ignore this email.
                    </div>
                </div>
            `,
        });
        if (error) {
            console.error("Resend verification error:", error);
            return { success: false, error };
        }
        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Verification email failed:", err);
        return { success: false, error: err };
    }
}
