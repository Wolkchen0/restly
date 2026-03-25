import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/verification-email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, location } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "All fields required" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const existing = await prisma.restaurant.findUnique({ where: { email } });
        if (existing) {
            if (existing.emailVerified) {
                // Verified account — cannot re-register
                return NextResponse.json({ error: "This email is already registered. Please log in instead." }, { status: 409 });
            }
            // Unverified account — delete it and allow fresh registration
            // First delete related records (locations, etc.)
            await prisma.location.deleteMany({ where: { restaurantId: existing.id } });
            await prisma.restaurant.delete({ where: { id: existing.id } });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Trial: 30 days from now (1 ay ücretsiz)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        const restaurant = await prisma.restaurant.create({
            data: {
                name, email, passwordHash, trialEndsAt, plan: "trial",
                emailVerified: false,
                verificationCode,
                verificationExpiry,
                // Create a default location for the new restaurant
                locations: {
                    create: {
                        name: `${name} — Main`,
                        city: location || null,
                        isDefault: true,
                    },
                },
            },
        });

        // Send verification code email
        sendVerificationEmail(email, verificationCode, name).catch(err =>
            console.error("Verification email failed (non-fatal):", err)
        );

        // Send welcome email (non-blocking)
        sendWelcomeEmail({ restaurantName: name, email }).catch(err =>
            console.error("Welcome email failed (non-fatal):", err)
        );

        return NextResponse.json({
            success: true,
            requiresVerification: true,
            restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email },
        });
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

