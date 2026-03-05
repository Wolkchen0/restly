import { NextResponse } from "next/server";
import { getAllTimeOffRequests, getScheduleStats } from "@/services/timeoff";

export async function GET() {
    const requests = getAllTimeOffRequests();
    const stats = getScheduleStats();
    return NextResponse.json({ requests, stats });
}
