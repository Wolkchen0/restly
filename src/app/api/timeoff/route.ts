import { NextResponse } from "next/server";

// In-memory storage for demo/fallback when DB table doesn't exist
const memoryStore: any[] = (globalThis as any).__timeRequests || [];
(globalThis as any).__timeRequests = memoryStore;

let dbAvailable: boolean | null = null;

async function getPrisma() {
    try {
        const { prisma } = await import("@/lib/prisma");
        return prisma;
    } catch { return null; }
}

async function checkDb(prisma: any) {
    if (dbAvailable !== null) return dbAvailable;
    try {
        await prisma.timeRequest.findFirst();
        dbAvailable = true;
    } catch {
        dbAvailable = false;
    }
    return dbAvailable;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const locId = searchParams.get("locId");

    let requests: any[] = [];
    const prisma = await getPrisma();

    if (prisma && await checkDb(prisma)) {
        try {
            requests = locId
                ? await (prisma as any).timeRequest.findMany({ where: { locationId: locId }, orderBy: { createdAt: "desc" } })
                : await (prisma as any).timeRequest.findMany({ orderBy: { createdAt: "desc" } });
        } catch { requests = []; }
    } else {
        // Fallback to memory
        requests = locId ? memoryStore.filter(r => r.locationId === locId) : [...memoryStore];
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

        const prisma = await getPrisma();
        if (prisma && await checkDb(prisma)) {
            try {
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
            } catch (e) { /* fall through to memory */ }
        }

        // Memory fallback
        const newRequest = {
            id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            locationId: data.locationId,
            employeeName: data.employeeName,
            employeeRole: data.employeeRole || "",
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason || "",
            type: data.type || "TIMEOFF",
            status: "PENDING",
            createdAt: new Date().toISOString(),
        };
        memoryStore.push(newRequest);
        return NextResponse.json(newRequest);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, status } = await req.json();
        if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const prisma = await getPrisma();
        if (prisma && await checkDb(prisma)) {
            try {
                const updated = await (prisma as any).timeRequest.update({
                    where: { id },
                    data: { status },
                });
                return NextResponse.json(updated);
            } catch { /* fall through */ }
        }

        // Memory fallback
        const item = memoryStore.find(r => r.id === id);
        if (item) {
            item.status = status;
            return NextResponse.json(item);
        }
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
