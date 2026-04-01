// Email Connection Test API — validates IMAP/SMTP credentials
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testImapConnection, testSmtpConnection, type EmailCredentials } from "@/lib/email-client";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { emailAddress, imapHost, imapPort, smtpHost, smtpPort, user, pass } = await req.json();

    if (!imapHost || !user || !pass) {
        return NextResponse.json({ success: false, error: "Missing required: imapHost, user, pass" }, { status: 400 });
    }

    const creds: EmailCredentials = {
        emailAddress: emailAddress || user,
        imapHost,
        imapPort: imapPort || 993,
        smtpHost: smtpHost || imapHost.replace("imap", "smtp"),
        smtpPort: smtpPort || 587,
        user,
        pass,
    };

    // Test IMAP
    const imapResult = await testImapConnection(creds);
    if (!imapResult.success) {
        return NextResponse.json({
            success: false,
            error: `IMAP connection failed: ${imapResult.error}`,
            hint: "Check your email, password (use App Password for Gmail), and IMAP host/port.",
        });
    }

    // Test SMTP
    const smtpResult = await testSmtpConnection(creds);
    if (!smtpResult.success) {
        return NextResponse.json({
            success: false,
            imapOk: true,
            error: `SMTP connection failed: ${smtpResult.error}`,
            hint: "IMAP works but SMTP failed. Check SMTP host/port settings.",
        });
    }

    return NextResponse.json({
        success: true,
        message: `Email connected! Found ${imapResult.count} messages in inbox.`,
        imapOk: true,
        smtpOk: true,
        messageCount: imapResult.count,
    });
}
