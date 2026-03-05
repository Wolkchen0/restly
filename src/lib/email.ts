import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWelcomeEmailParams {
    restaurantName: string;
    email: string;
}

export async function sendWelcomeEmail({ restaurantName, email }: SendWelcomeEmailParams) {
    // If no Resend key, log and skip (dev mode)
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_test") {
        console.log(`[EMAIL SKIPPED - no RESEND_API_KEY] Would send welcome email to: ${email}`);
        return { success: true, skipped: true };
    }

    try {
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
            : "https://app.restly.ai/login";

        const { data, error } = await resend.emails.send({
            from: "Restly <welcome@restly.ai>",   // ← change to your verified domain
            to: email,
            subject: `Welcome to Restly, ${restaurantName}! 🎉 Your 14-day trial starts now`,
            html: WelcomeEmail({ restaurantName, email, loginUrl }),
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }

        console.log(`[EMAIL SENT] Welcome email to ${email}, id: ${data?.id}`);
        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Email send failed:", err);
        return { success: false, error: err };
    }
}
