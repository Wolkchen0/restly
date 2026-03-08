import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const locId = searchParams.get("locId");

    let requests: any[] = [];
    if (locId) {
        requests = await (prisma as any).timeRequest.findMany({
            where: { locationId: locId },
            orderBy: { createdAt: "desc" },
        });
    } else {
        requests = await (prisma as any).timeRequest.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    const stats = {
        pending: requests.filter((r: any) => r.status === "PENDING").length,
        approved: requests.filter((r: any) => r.status === "APPROVED").length,
        denied: requests.filter((r: any) => r.status === "DENIED").length,
        total: requests.length,
    };

    return NextResponse.json({ requests, stats });
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        if (!data.locationId || !data.employeeName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newRequest = await (prisma as any).timeRequest.create({
            data: {
                locationId: data.locationId,
                employeeName: data.employeeName,
                employeeRole: data.employeeRole,
                startDate: data.startDate,
                endDate: data.endDate,
                reason: data.reason,
                type: data.type || "TIMEOFF",
                status: "PENDING",
            },
        });

        return NextResponse.json(newRequest);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status } = await req.json();
        if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const updated = await (prisma as any).timeRequest.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
