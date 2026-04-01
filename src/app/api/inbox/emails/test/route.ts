// Email Connection Test API — validates IMAP/SMTP credentials
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testImapConnection, testSmtpConnection, type EmailCredentials } from "@/lib/email-client";

// Provider-specific error guidance
function getProviderHelp(email: string): string {
    const domain = email.split("@")[1]?.toLowerCase() || "";
    if (domain.includes("gmail")) {
        return "Gmail requires an App Password. Go to Google Account → Security → 2-Step Verification → App Passwords, generate one, and use it here instead of your regular password.";
    }
    if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
        return "Outlook/Hotmail requires an App Password. Go to Microsoft Account → Security → App Passwords and generate one.";
    }
    if (domain.includes("yahoo")) {
        return "Yahoo requires an App Password. Go to Yahoo Account → Security → Generate App Password.";
    }
    return "Check that your email and password are correct. Some providers require an App Password instead of your regular password.";
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { emailAddress, imapHost, imapPort, smtpHost, smtpPort, user, pass } = await req.json();

    if (!imapHost || !user || !pass) {
        return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
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
        const help = getProviderHelp(emailAddress || user);
        return NextResponse.json({
            success: false,
            error: `Connection failed. ${help}`,
        });
    }

    // Test SMTP
    const smtpResult = await testSmtpConnection(creds);
    if (!smtpResult.success) {
        return NextResponse.json({
            success: false,
            imapOk: true,
            error: `Email reading works, but sending failed. Check your SMTP settings or try again.`,
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
