// Email Connection Test API — validates IMAP/SMTP credentials
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testImapConnection, testSmtpConnection, type EmailCredentials } from "@/lib/email-client";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

// Auto-detect IMAP/SMTP from MX records
async function detectEmailProvider(domain: string): Promise<{ imap: string; smtp: string } | null> {
    try {
        const mxRecords = await resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) return null;

        const mx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange.toLowerCase();

        // Google Workspace
        if (mx.includes("google") || mx.includes("googlemail")) {
            return { imap: "imap.gmail.com", smtp: "smtp.gmail.com" };
        }
        // Microsoft 365
        if (mx.includes("outlook") || mx.includes("microsoft")) {
            return { imap: "outlook.office365.com", smtp: "smtp.office365.com" };
        }
        // Yahoo
        if (mx.includes("yahoo")) {
            return { imap: "imap.mail.yahoo.com", smtp: "smtp.mail.yahoo.com" };
        }
        // Zoho
        if (mx.includes("zoho")) {
            return { imap: "imap.zoho.com", smtp: "smtp.zoho.com" };
        }
        // GoDaddy
        if (mx.includes("secureserver.net")) {
            return { imap: "imap.secureserver.net", smtp: "smtpout.secureserver.net" };
        }
        // Namecheap / Privateemail
        if (mx.includes("privateemail") || mx.includes("registrar-servers")) {
            return { imap: "mail.privateemail.com", smtp: "mail.privateemail.com" };
        }
        // Hostinger
        if (mx.includes("hostinger")) {
            return { imap: "imap.hostinger.com", smtp: "smtp.hostinger.com" };
        }
        // Bluehost / cPanel
        if (mx.includes("bluehost")) {
            return { imap: `mail.${domain}`, smtp: `mail.${domain}` };
        }

        return null;
    } catch {
        return null;
    }
}

// Provider-specific error guidance
function getProviderHelp(email: string, detectedProvider?: string): string {
    const domain = email.split("@")[1]?.toLowerCase() || "";
    
    if (detectedProvider?.includes("gmail") || domain.includes("gmail")) {
        return "This email uses Google. Gmail/Google Workspace requires an App Password. Go to Google Account → Security → 2-Step Verification → App Passwords, generate one, and use it as your password.";
    }
    if (detectedProvider?.includes("outlook") || detectedProvider?.includes("office365") || domain.includes("outlook") || domain.includes("hotmail")) {
        return "This email uses Microsoft. Outlook/Microsoft 365 requires an App Password. Go to Microsoft Account → Security → App Passwords.";
    }
    if (domain.includes("yahoo")) {
        return "Yahoo requires an App Password. Go to Yahoo Account → Security → Generate App Password.";
    }
    return "Check that your email and password are correct. If using Gmail or Outlook hosting, you may need an App Password.";
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    let { emailAddress, imapHost, imapPort, smtpHost, smtpPort, user, pass } = await req.json();

    if (!user || !pass) {
        return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const email = emailAddress || user;
    const domain = email.split("@")[1]?.toLowerCase() || "";

    // If the provided imap host might not exist, try MX-based detection first
    if (!imapHost || imapHost === `imap.${domain}`) {
        const detected = await detectEmailProvider(domain);
        if (detected) {
            imapHost = detected.imap;
            smtpHost = detected.smtp;
            console.log(`[EMAIL] MX auto-detected for ${domain}: IMAP=${imapHost}, SMTP=${smtpHost}`);
        }
    }

    if (!imapHost) {
        imapHost = `imap.${domain}`;
    }

    const creds: EmailCredentials = {
        emailAddress: email,
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
        const help = getProviderHelp(email, imapHost);
        return NextResponse.json({
            success: false,
            error: `Connection failed. ${help}`,
            detectedHost: imapHost,
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
        detectedHost: imapHost,
    });
}
