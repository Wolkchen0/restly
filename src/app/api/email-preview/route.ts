import { WelcomeEmail } from "@/emails/welcome";

// GET /api/email-preview — view the welcome email in browser (dev only)
export async function GET() {
    const html = WelcomeEmail({
        restaurantName: "Meyhouse",
        email: "demo@meyhouse.com",
        loginUrl: "http://localhost:3001/login",
    });

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
