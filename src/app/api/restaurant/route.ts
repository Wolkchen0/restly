import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/verification-email";

// PATCH /api/restaurant — change password (with email verification)
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, currentPassword, newPassword, verificationCode } = body;

        if (!currentPassword) {
            return NextResponse.json({ error: "Current password is required" }, { status: 400 });
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

        // Step 1: Send verification code
        if (action === "send_pw_verification") {
            const code = generateVerificationCode();
            const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            await prisma.restaurant.update({
                where: { id: session.user.id },
                data: { verificationCode: code, verificationExpiry: expiry },
            });
            await sendVerificationEmail(restaurant.email, code, restaurant.name);
            return NextResponse.json({ success: true, message: "Verification code sent" });
        }

        // Step 2: Verify code and change password
        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
        }

        if (!verificationCode) {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
        }

        // Check verification code
        if (restaurant.verificationCode !== verificationCode) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        if (restaurant.verificationExpiry && new Date() > restaurant.verificationExpiry) {
            return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
        }

        // Hash new password and update, clear verification code
        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.restaurant.update({
            where: { id: session.user.id },
            data: { passwordHash: newHash, verificationCode: null, verificationExpiry: null },
        });

        return NextResponse.json({ success: true, message: "Password updated" });
    } catch (err) {
        console.error("Change password error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
