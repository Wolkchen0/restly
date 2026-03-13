// Email Inbox API Route
// Tests email connectivity — uses JSONPlaceholder for demo, real IMAP/Gmail for production
import { NextResponse } from "next/server";

const EMAIL_SENDERS: Record<number, { name: string; email: string }> = {
    1: { name: "Jennifer Oaks", email: "joaks@company.com" },
    2: { name: "David Kim", email: "dkim@gmail.com" },
    3: { name: "Restaurant Depot", email: "orders@restaurantdepot.com" },
    4: { name: "Southern Glazer's", email: "rep@sgws.com" },
    5: { name: "Sarah Martinez", email: "smartinez@corp.com" },
    6: { name: "OpenTable Booking", email: "no-reply@opentable.com" },
};

const EMAIL_SUBJECTS: Record<number, string> = {
    1: "Corporate dinner inquiry for 35 guests — March 28th",
    2: "Allergy question before our Saturday visit",
    3: "Weekly supply order confirmation #4821",
    4: "New wine catalog — Spring 2026 selections",
    5: "Team building event proposal — 20 guests",
    6: "New reservation: Sarah M. — Sat 7:30 PM, party of 4",
};

export async function GET() {
    try {
        // Test with JSONPlaceholder (free, always-on API)
        const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=6", {
            next: { revalidate: 60 }, // Cache 60s
        });

        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }

        const posts = await res.json();

        const emails = posts.map((p: any) => ({
            id: `email_${p.id}`,
            from: EMAIL_SENDERS[p.userId]?.name || `Contact ${p.userId}`,
            fromEmail: EMAIL_SENDERS[p.userId]?.email || `user${p.userId}@email.com`,
            subject: EMAIL_SUBJECTS[p.id] || p.title.substring(0, 60),
            body: p.id <= 2
                ? getRestaurantEmailBody(p.id)
                : p.body,
            date: getRelativeTime(p.id),
            unread: p.id <= 3,
            platform: "Email",
            type: "email",
        }));

        return NextResponse.json({
            emails,
            source: "api",
            apiStatus: "connected",
            apiUrl: "https://jsonplaceholder.typicode.com",
            fetchedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Email API error:", error);
        return NextResponse.json({
            emails: [],
            source: "error",
            error: error.message,
        }, { status: 500 });
    }
}

function getRelativeTime(id: number): string {
    const times = ["5m ago", "20m ago", "1h ago", "3h ago", "8h ago", "1d ago"];
    return times[(id - 1) % times.length];
}

function getRestaurantEmailBody(id: number): string {
    if (id === 1) return "Hi there,\n\nI'm the events coordinator at Oaks & Partners. We're looking to host a corporate dinner for 35 guests on March 28th. We'd need a private dining area, a set menu with vegetarian options, and an open bar for 2 hours.\n\nCould you send us a proposal with pricing? We've dined with you before and the team loved it.\n\nBest regards,\nJennifer Oaks";
    return "Hello,\n\nMy wife has a severe tree nut allergy. We have a reservation for this Saturday at 7pm under Kim. Could you please confirm which dishes are safe for her? We want to avoid any cross-contamination.\n\nThank you,\nDavid";
}
