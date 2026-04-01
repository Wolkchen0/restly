// ═══════════════════════════════════════════════════════════════════
// POST /api/pos-sync — Fetch REAL data from customer's POS system
// Called by dashboard pages to get live sales, menu, labor data
// ═══════════════════════════════════════════════════════════════════

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runPOSSync } from "@/lib/pos";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { locationId, period } = body;

        // Get restaurant with locations
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: { locations: true },
        });

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        // Find target location
        const loc = locationId
            ? restaurant.locations.find(l => l.id === locationId)
            : restaurant.locations.find(l => l.isDefault) || restaurant.locations[0];

        if (!loc) {
            return NextResponse.json({ error: "No location found" }, { status: 404 });
        }

        // Check if POS is connected
        if (!loc.posProvider || loc.posProvider === "manual") {
            return NextResponse.json({
                connected: false,
                provider: loc.posProvider || "none",
                message: "No POS system connected. Go to Settings to connect your POS.",
            });
        }

        if (!loc.posApiKey) {
            return NextResponse.json({
                connected: false,
                provider: loc.posProvider,
                message: `${loc.posProvider} is selected but credentials are missing. Go to Settings to enter your API keys.`,
            });
        }

        // Calculate date range based on period
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
        let startDate = today;
        let endDate = today;

        if (period === "yesterday") {
            const d = new Date(now);
            d.setDate(d.getDate() - 1);
            startDate = d.toISOString().split("T")[0];
            endDate = startDate;
        } else if (period === "week") {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split("T")[0];
        } else if (period === "month") {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            startDate = d.toISOString().split("T")[0];
        }

        // Run the sync
        const result = await runPOSSync(
            {
                provider: loc.posProvider,
                apiKey: loc.posApiKey,
                secretKey: loc.posSecretKey || undefined,
                locationId: loc.posLocationId || undefined,
            },
            loc.id,
            { start: startDate, end: endDate }
        );

        return NextResponse.json({
            ...result,
            connected: true,
            locationName: loc.name,
            period: period || "today",
        });

    } catch (err: any) {
        console.error("POST /api/pos-sync error:", err?.message || err);
        return NextResponse.json({
            connected: false,
            error: err?.message || "Sync failed",
        }, { status: 500 });
    }
}

// GET — quick status check (is POS connected for this user?)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.id },
            include: { locations: { select: { id: true, name: true, posProvider: true, posApiKey: true, isDefault: true } } },
        });

        if (!restaurant) {
            return NextResponse.json({ connected: false });
        }

        const locations = restaurant.locations.map(l => ({
            id: l.id,
            name: l.name,
            posProvider: l.posProvider,
            posConnected: !!(l.posProvider && l.posProvider !== "manual" && l.posApiKey),
        }));

        return NextResponse.json({
            connected: locations.some(l => l.posConnected),
            locations,
        });

    } catch (err: any) {
        console.error("GET /api/pos-sync error:", err?.message || err);
        return NextResponse.json({ connected: false, error: err?.message }, { status: 500 });
    }
}
