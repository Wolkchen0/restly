// Send Email API Route — sends emails via SMTP
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, type EmailCredentials } from "@/lib/email-client";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { to, subject, body, replyToId } = await req.json();
    if (!to || !subject || !body) {
        return NextResponse.json({ success: false, error: "Missing required fields: to, subject, body" }, { status: 400 });
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: { locations: true },
        });

        if (!restaurant) return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });

        const isDemoAccount = restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
        const loc = restaurant.locations.find(l => l.isDefault) || restaurant.locations[0];

        // Demo mode: simulate send
        if (isDemoAccount) {
            return NextResponse.json({
                success: true,
                messageId: `demo_${Date.now()}`,
                note: "Demo mode — email was not actually sent.",
            });
        }

        // Check if email is connected
        if (!loc?.emailSmtpHost || !loc.emailUser || !loc.emailPass) {
            return NextResponse.json({
                success: false,
                error: "Email not connected. Go to Settings → Online Profiles → Connect your email.",
            }, { status: 400 });
        }

        const creds: EmailCredentials = {
            emailAddress: loc.emailAddress || loc.emailUser,
            imapHost: loc.emailImapHost || "",
            imapPort: loc.emailImapPort || 993,
            smtpHost: loc.emailSmtpHost,
            smtpPort: loc.emailSmtpPort || 587,
            user: loc.emailUser,
            pass: loc.emailPass,
        };

        const result = await sendEmail(creds, to, subject, body, replyToId);

        if (result.success) {
            return NextResponse.json({ success: true, messageId: result.messageId });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (err: any) {
        console.error("Send email error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
