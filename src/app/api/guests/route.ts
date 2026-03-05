import { NextResponse } from "next/server";
import { getAllGuests, getStats, getTodayReservations, getVipGuests } from "@/services/opentable";

export async function GET() {
    const guests = getAllGuests();
    const stats = getStats();
    const todayRes = getTodayReservations();
    const vips = getVipGuests();
    return NextResponse.json({ guests, stats, todayReservations: todayRes, vipGuests: vips });
}
