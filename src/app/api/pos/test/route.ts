import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToastAdapter } from "@/services/pos/toast-adapter";
import type { POSCredentials } from "@/services/pos/types";

// POST /api/pos/test
// Tests POS connection with the credentials stored in the user's default location
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    // Optionally accept credentials in the body (for testing before saving)
    let credentials: POSCredentials;
    try {
        const body = await req.json().catch(() => null);
        if (body?.provider && body?.apiKey && body?.secretKey && body?.locationId) {
            credentials = {
                provider: body.provider,
                apiKey: body.apiKey,
                secretKey: body.secretKey,
                locationId: body.locationId,
            };
        } else {
            // Fall back to stored credentials
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: session.user.id },
                include: {
                    locations: {
                        where: { isDefault: true, isActive: true },
                        take: 1,
                        select: {
                            posProvider: true,
                            posApiKey: true,
                            posSecretKey: true,
                            posLocationId: true,
                        },
                    },
                },
            });

            const loc = restaurant?.locations?.[0];
            if (!loc?.posProvider || !loc.posApiKey || !loc.posSecretKey || !loc.posLocationId) {
                return NextResponse.json({ success: false, message: "No POS credentials configured. Go to Settings → Locations & Integrations." });
            }

            credentials = {
                provider: loc.posProvider as any,
                apiKey: loc.posApiKey,
                secretKey: loc.posSecretKey,
                locationId: loc.posLocationId,
            };
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message || "Invalid request" }, { status: 400 });
    }

    // Create adapter and test
    let adapter;
    switch (credentials.provider) {
        case "toast":
            adapter = new ToastAdapter(credentials);
            break;
        default:
            return NextResponse.json({
                success: false,
                message: `POS provider "${credentials.provider}" test not yet implemented. Supported: toast.`,
            });
    }

    const result = await adapter.testConnection();
    return NextResponse.json(result);
}
