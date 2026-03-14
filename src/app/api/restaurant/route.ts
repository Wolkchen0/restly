import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/restaurant — change password
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
        }

        const restaurant = await prisma.restaurant.findUnique({ where: { id: session.user.id } });
        if (!restaurant) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, restaurant.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
        }

        // Hash new password and update
        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.restaurant.update({
            where: { id: session.user.id },
            data: { passwordHash: newHash },
        });

        return NextResponse.json({ success: true, message: "Password updated" });
    } catch (err) {
        console.error("Change password error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
