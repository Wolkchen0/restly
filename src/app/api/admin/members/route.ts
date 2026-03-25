import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isVipEmail } from "@/lib/vip-emails";

// GET — Tüm üyeleri listele
export async function GET() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: {
                // Demo hesapları filtrele
                NOT: { email: { startsWith: "demo+" } },
            },
            select: {
                id: true,
                name: true,
                email: true,
                plan: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
                trialEndsAt: true,
                _count: { select: { locations: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const now = new Date();
        const members = restaurants.map((r) => {
            const createdAt = new Date(r.createdAt);
            const daysSinceCreation = Math.floor(
                (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            let trialDaysRemaining: number | null = null;
            let status: "active" | "trial" | "expired" | "vip" | "inactive" = "trial";

            const isVip = isVipEmail(r.email);

            if (!r.isActive) {
                status = "inactive";
            } else if (isVip) {
                status = "vip";
            } else if (r.plan === "pro" || r.plan === "enterprise") {
                status = "active";
            } else if (r.trialEndsAt) {
                const trialEnd = new Date(r.trialEndsAt);
                trialDaysRemaining = Math.ceil(
                    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (trialDaysRemaining <= 0) {
                    status = "expired";
                    trialDaysRemaining = 0;
                } else {
                    status = "trial";
                }
            }

            return {
                id: r.id,
                name: r.name,
                email: r.email,
                plan: r.plan,
                isActive: r.isActive,
                emailVerified: r.emailVerified,
                createdAt: r.createdAt,
                trialEndsAt: r.trialEndsAt,
                daysSinceCreation,
                trialDaysRemaining,
                status,
                isVip,
                locationCount: r._count.locations,
            };
        });

        // Özet istatistikler
        const summary = {
            total: members.length,
            active: members.filter((m) => m.status === "active").length,
            trial: members.filter((m) => m.status === "trial").length,
            expired: members.filter((m) => m.status === "expired").length,
            vip: members.filter((m) => m.status === "vip").length,
            inactive: members.filter((m) => m.status === "inactive").length,
        };

        return NextResponse.json({ members, summary });
    } catch (err) {
        console.error("Admin members GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PATCH — Üyelik durumunu güncelle
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { memberId, action } = body;

        if (!memberId || !action) {
            return NextResponse.json(
                { error: "memberId ve action gerekli" },
                { status: 400 }
            );
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: memberId },
        });

        if (!restaurant) {
            return NextResponse.json(
                { error: "Üye bulunamadı" },
                { status: 404 }
            );
        }

        let updateData: any = {};

        switch (action) {
            case "activate":
                // Sınırsız aç — ücretli üyelik
                updateData = {
                    plan: "pro",
                    isActive: true,
                    trialEndsAt: null,
                };
                break;

            case "deactivate":
                // Erişimi kapat
                updateData = {
                    isActive: false,
                };
                break;

            case "extend_trial":
                // Trial'ı 30 gün daha uzat
                const newTrialEnd = new Date();
                newTrialEnd.setDate(newTrialEnd.getDate() + 30);
                updateData = {
                    plan: "trial",
                    isActive: true,
                    trialEndsAt: newTrialEnd,
                };
                break;

            case "make_vip":
                // Enterprise seviyesine yükselt (VIP)
                updateData = {
                    plan: "enterprise",
                    isActive: true,
                    trialEndsAt: null,
                };
                break;

            default:
                return NextResponse.json(
                    { error: "Geçersiz action: activate | deactivate | extend_trial | make_vip" },
                    { status: 400 }
                );
        }

        const updated = await prisma.restaurant.update({
            where: { id: memberId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            member: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                plan: updated.plan,
                isActive: updated.isActive,
                trialEndsAt: updated.trialEndsAt,
            },
        });
    } catch (err) {
        console.error("Admin members PATCH error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
