import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToastAdapter } from "@/services/pos/toast-adapter";
import { aggregateStaffMetrics } from "@/services/pos/types";
import type { POSCredentials } from "@/services/pos/types";

// GET /api/team/performance?period=today|yesterday|week|month|year&date=YYYY-MM-DD
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ connected: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "today";
    const customDate = url.searchParams.get("date");

    // Get restaurant's default location and POS credentials
    let location: any;
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: {
                locations: {
                    where: { isDefault: true, isActive: true },
                    take: 1,
                    select: {
                        id: true,
                        posProvider: true,
                        posApiKey: true,
                        posSecretKey: true,
                        posLocationId: true,
                    },
                },
            },
        });

        location = restaurant?.locations?.[0];
    } catch (err) {
        console.error("DB error fetching POS credentials:", err);
        return NextResponse.json({ connected: false, error: "Database error" }, { status: 500 });
    }

    // Check if POS is configured
    if (!location?.posProvider || !location.posApiKey || !location.posSecretKey || !location.posLocationId) {
        return NextResponse.json({ connected: false, staff: [], message: "No POS system connected" });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (period) {
        case "today":
            startDate = endDate = now.toISOString().split("T")[0];
            break;
        case "yesterday": {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = endDate = yesterday.toISOString().split("T")[0];
            break;
        }
        case "week": {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate = weekAgo.toISOString().split("T")[0];
            endDate = now.toISOString().split("T")[0];
            break;
        }
        case "month": {
            const monthAgo = new Date(now);
            monthAgo.setDate(monthAgo.getDate() - 30);
            startDate = monthAgo.toISOString().split("T")[0];
            endDate = now.toISOString().split("T")[0];
            break;
        }
        case "year": {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            startDate = yearAgo.toISOString().split("T")[0];
            endDate = now.toISOString().split("T")[0];
            break;
        }
        case "custom":
            if (customDate) {
                startDate = endDate = customDate;
            } else {
                startDate = endDate = now.toISOString().split("T")[0];
            }
            break;
        default:
            startDate = endDate = now.toISOString().split("T")[0];
    }

    // Create the appropriate POS adapter
    const credentials: POSCredentials = {
        provider: location.posProvider as any,
        apiKey: location.posApiKey,
        secretKey: location.posSecretKey,
        locationId: location.posLocationId,
    };

    let adapter;
    switch (location.posProvider) {
        case "toast":
            adapter = new ToastAdapter(credentials);
            break;
        // Future: case "square": adapter = new SquareAdapter(credentials); break;
        // Future: case "clover": adapter = new CloverAdapter(credentials); break;
        default:
            return NextResponse.json({
                connected: true,
                error: `POS provider "${location.posProvider}" is not yet supported for staff data`,
                staff: [],
            });
    }

    try {
        // Fetch data from POS in parallel
        const [employees, orders, timeEntries] = await Promise.all([
            adapter.getEmployees(),
            adapter.getOrders(startDate, endDate),
            adapter.getTimeEntries(startDate, endDate),
        ]);

        // Aggregate into staff metrics
        const staff = aggregateStaffMetrics(employees, orders, timeEntries);

        return NextResponse.json({
            connected: true,
            staff,
            period,
            startDate,
            endDate,
            meta: {
                totalEmployees: employees.length,
                totalOrders: orders.length,
                totalTimeEntries: timeEntries.length,
            },
        });
    } catch (err: any) {
        console.error("POS data fetch error:", err);
        return NextResponse.json({
            connected: true,
            error: err.message || "Failed to fetch POS data",
            staff: [],
        });
    }
}
