// Email client — IMAP read + SMTP send
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";

export interface EmailCredentials {
    emailAddress: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    user: string;
    pass: string;
}

export interface InboxEmail {
    id: string;
    uid: number;
    from: string;
    fromEmail: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    unread: boolean;
}

// ── IMAP: Fetch Inbox ──────────────────────────────────────────────────
export async function fetchInboxEmails(creds: EmailCredentials, limit = 20): Promise<InboxEmail[]> {
    const client = new ImapFlow({
        host: creds.imapHost,
        port: creds.imapPort,
        secure: creds.imapPort === 993,
        auth: { user: creds.user, pass: creds.pass },
        logger: false,
    });

    const emails: InboxEmail[] = [];

    try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");

        try {
            // Fetch most recent emails
            const totalMessages = (client.mailbox && typeof client.mailbox !== "boolean") ? (client.mailbox.exists || 0) : 0;
            if (totalMessages === 0) return emails;

            const startSeq = Math.max(1, totalMessages - limit + 1);
            const range = `${startSeq}:*`;

            for await (const message of client.fetch(range, {
                envelope: true,
                flags: true,
                bodyStructure: true,
                source: true,
            })) {
                const envelope = message.envelope;
                if (!envelope) continue;

                const fromAddr = envelope.from?.[0];
                const toAddr = envelope.to?.[0];

                // Parse body text from source
                let bodyText = "";
                if (message.source) {
                    const raw = message.source.toString();
                    // Simple text extraction — find the text/plain part
                    const parts = raw.split(/\r?\n\r?\n/);
                    if (parts.length > 1) {
                        bodyText = parts.slice(1).join("\n\n").trim();
                        // Remove base64 encoded parts and HTML
                        if (bodyText.includes("<html") || bodyText.includes("<HTML")) {
                            // Extract text between tags
                            bodyText = bodyText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                        }
                        // Limit length
                        if (bodyText.length > 2000) bodyText = bodyText.substring(0, 2000) + "...";
                    }
                }

                emails.push({
                    id: `email_${message.uid}`,
                    uid: message.uid,
                    from: fromAddr ? `${fromAddr.name || fromAddr.address}` : "Unknown",
                    fromEmail: fromAddr?.address || "",
                    to: toAddr?.address || creds.emailAddress,
                    subject: envelope.subject || "(no subject)",
                    body: bodyText || "(no text content)",
                    date: envelope.date ? formatRelativeDate(new Date(envelope.date)) : "",
                    unread: !message.flags?.has("\\Seen"),
                });
            }
        } finally {
            lock.release();
        }

        await client.logout();
    } catch (err: any) {
        console.error("IMAP fetch error:", err.message);
        throw new Error(`IMAP error: ${err.message}`);
    }

    // Return newest first
    return emails.reverse();
}

// ── IMAP: Test Connection ──────────────────────────────────────────────
export async function testImapConnection(creds: EmailCredentials): Promise<{ success: boolean; error?: string; count?: number }> {
    const client = new ImapFlow({
        host: creds.imapHost,
        port: creds.imapPort,
        secure: creds.imapPort === 993,
        auth: { user: creds.user, pass: creds.pass },
        logger: false,
    });

    try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");
        const count = (client.mailbox && typeof client.mailbox !== "boolean") ? (client.mailbox.exists || 0) : 0;
        lock.release();
        await client.logout();
        return { success: true, count };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ── SMTP: Send Email ──────────────────────────────────────────────────
export async function sendEmail(
    creds: EmailCredentials,
    to: string,
    subject: string,
    body: string,
    replyToMessageId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const transporter = nodemailer.createTransport({
        host: creds.smtpHost,
        port: creds.smtpPort,
        secure: creds.smtpPort === 465,
        auth: { user: creds.user, pass: creds.pass },
    });

    try {
        const info = await transporter.sendMail({
            from: `"${creds.emailAddress.split("@")[0]}" <${creds.emailAddress}>`,
            to,
            subject,
            text: body,
            ...(replyToMessageId ? { inReplyTo: replyToMessageId, references: replyToMessageId } : {}),
        });
        return { success: true, messageId: info.messageId };
    } catch (err: any) {
        console.error("SMTP send error:", err.message);
        return { success: false, error: err.message };
    }
}

// ── SMTP: Test Connection ─────────────────────────────────────────────
export async function testSmtpConnection(creds: EmailCredentials): Promise<{ success: boolean; error?: string }> {
    const transporter = nodemailer.createTransport({
        host: creds.smtpHost,
        port: creds.smtpPort,
        secure: creds.smtpPort === 465,
        auth: { user: creds.user, pass: creds.pass },
    });

    try {
        await transporter.verify();
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
