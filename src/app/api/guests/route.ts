import { NextResponse, NextRequest } from "next/server";
import { getAllGuests, getStats, getTodayReservations, getVipGuests, addOrUpdateGuest } from "@/services/opentable";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    const email = (session?.user as any)?.email || "";
    const isDemoAccount = email === "demo@restly.com";

    if (!isDemoAccount) {
        // Real users get empty guest data — this will come from POS/OpenTable when connected
        return NextResponse.json({
            guests: [],
            stats: { totalGuests: 0, vipGuests: 0, coversToday: 0, reservationsToday: 0, avgSpend: 0 },
            todayReservations: [],
            vipGuests: []
        });
    }

    const guests = getAllGuests();
    const stats = getStats();
    const todayRes = getTodayReservations();
    const vips = getVipGuests();
    return NextResponse.json({ guests, stats, todayReservations: todayRes, vipGuests: vips });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, isVip, notes } = body;
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        const guest = addOrUpdateGuest(name, isVip ?? true, notes);
        return NextResponse.json({ success: true, guest });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
