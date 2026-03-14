import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/verification-email";

// POST: Verify a code
export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code required" }, { status: 400 });
        }

        const restaurant = await prisma.restaurant.findUnique({ where: { email } });

        if (!restaurant) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        if (restaurant.emailVerified) {
            return NextResponse.json({ success: true, alreadyVerified: true });
        }

        if (!restaurant.verificationCode || !restaurant.verificationExpiry) {
            return NextResponse.json({ error: "No verification code sent. Request a new one." }, { status: 400 });
        }

        if (new Date() > restaurant.verificationExpiry) {
            return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 410 });
        }

        if (restaurant.verificationCode !== code) {
            return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 401 });
        }

        // Mark as verified
        await prisma.restaurant.update({
            where: { email },
            data: {
                emailVerified: true,
                verificationCode: null,
                verificationExpiry: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Verification error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PUT: Resend a new code
export async function PUT(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const restaurant = await prisma.restaurant.findUnique({ where: { email } });

        if (!restaurant) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        if (restaurant.emailVerified) {
            return NextResponse.json({ success: true, alreadyVerified: true });
        }

        const code = generateVerificationCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.restaurant.update({
            where: { email },
            data: { verificationCode: code, verificationExpiry: expiry },
        });

        const sendResult = await sendVerificationEmail(email, code, restaurant.name);

        if (sendResult.skipped) {
            // No real email service — return code in logs for dev, tell user
            return NextResponse.json({ success: true, message: "Verification code generated. Check server logs if in development." });
        }

        if (!sendResult.success) {
            return NextResponse.json({ error: "Failed to send email. Please try again or contact support." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Verification code sent to your email" });
    } catch (err) {
        console.error("Resend code error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
