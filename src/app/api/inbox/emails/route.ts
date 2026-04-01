// Email Inbox API Route — fetches real emails via IMAP when connected
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchInboxEmails, type EmailCredentials } from "@/lib/email-client";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ emails: [], source: "unauthorized" });

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: { locations: true },
        });

        if (!restaurant) return NextResponse.json({ emails: [], source: "none" });

        const isDemoAccount = restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");
        const loc = restaurant.locations.find(l => l.isDefault) || restaurant.locations[0];

        // Check if email is connected (IMAP credentials exist)
        if (loc?.emailImapHost && loc.emailUser && loc.emailPass) {
            try {
                const creds: EmailCredentials = {
                    emailAddress: loc.emailAddress || loc.emailUser,
                    imapHost: loc.emailImapHost,
                    imapPort: loc.emailImapPort || 993,
                    smtpHost: loc.emailSmtpHost || loc.emailImapHost.replace("imap", "smtp"),
                    smtpPort: loc.emailSmtpPort || 587,
                    user: loc.emailUser,
                    pass: loc.emailPass,
                };

                const emails = await fetchInboxEmails(creds, 15);
                return NextResponse.json({
                    emails,
                    source: "imap",
                    apiStatus: "connected",
                    account: loc.emailAddress || loc.emailUser,
                    fetchedAt: new Date().toISOString(),
                });
            } catch (err: any) {
                console.error("IMAP fetch error:", err.message);
                return NextResponse.json({
                    emails: [],
                    source: "imap_error",
                    apiStatus: "error",
                    error: err.message,
                    note: "Email connected but failed to fetch. Check credentials in Settings.",
                });
            }
        }

        // Demo account: return demo emails
        if (isDemoAccount) {
            return NextResponse.json({
                emails: getDemoEmails(),
                source: "demo",
                apiStatus: "connected",
                fetchedAt: new Date().toISOString(),
            });
        }

        // Real user, no email connected
        return NextResponse.json({
            emails: [],
            source: "none",
            apiStatus: "not_connected",
            note: "Connect your email in Settings → Online Profiles to see messages here.",
        });
    } catch (err: any) {
        console.error("Email API error:", err);
        return NextResponse.json({ emails: [], source: "error", error: err.message }, { status: 500 });
    }
}

function getDemoEmails() {
    return [
        { id: "email_1", from: "Jennifer Oaks", fromEmail: "joaks@company.com", subject: "Corporate dinner inquiry for 35 guests — March 28th", body: "Hi there,\n\nI'm the events coordinator at Oaks & Partners. We're looking to host a corporate dinner for 35 guests on March 28th. We'd need a private dining area, a set menu with vegetarian options, and an open bar for 2 hours.\n\nCould you send us a proposal with pricing? We've dined with you before and the team loved it.\n\nBest regards,\nJennifer Oaks", date: "5m ago", unread: true },
        { id: "email_2", from: "David Kim", fromEmail: "dkim@gmail.com", subject: "Allergy question before our Saturday visit", body: "Hello,\n\nMy wife has a severe tree nut allergy. We have a reservation for this Saturday at 7pm under Kim. Could you please confirm which dishes are safe for her? We want to avoid any cross-contamination.\n\nThank you,\nDavid", date: "20m ago", unread: true },
        { id: "email_3", from: "Restaurant Depot", fromEmail: "orders@restaurantdepot.com", subject: "Weekly supply order confirmation #4821", body: "Your order #4821 has been confirmed and will be delivered on Wednesday between 6-8 AM.", date: "1h ago", unread: true },
        { id: "email_4", from: "Southern Glazer's", fromEmail: "rep@sgws.com", subject: "New wine catalog — Spring 2026 selections", body: "Hi,\n\nPlease find attached our Spring 2026 wine selections. We have some excellent new additions from Napa Valley.\n\nLet me know if you'd like to set up a tasting.", date: "3h ago", unread: false },
        { id: "email_5", from: "Sarah Martinez", fromEmail: "smartinez@corp.com", subject: "Team building event proposal — 20 guests", body: "Hi,\n\nWe're looking to host a team building event for 20 people. Can we do a cooking class or wine tasting? What are the options and pricing?", date: "8h ago", unread: false },
        { id: "email_6", from: "OpenTable Booking", fromEmail: "no-reply@opentable.com", subject: "New reservation: Sarah M. — Sat 7:30 PM, party of 4", body: "New reservation confirmed:\nGuest: Sarah M.\nDate: Saturday, 7:30 PM\nParty size: 4\nSpecial request: Anniversary dinner, window table preferred", date: "1d ago", unread: false },
    ];
}
