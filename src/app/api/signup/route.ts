import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

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
            return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Trial: 14 days from now
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const restaurant = await prisma.restaurant.create({
            data: { name, email, passwordHash, location: location || "", trialEndsAt, plan: "trial" },
        });

        // Send welcome email (non-blocking — don't fail signup if email fails)
        sendWelcomeEmail({ restaurantName: name, email }).catch(err =>
            console.error("Welcome email failed (non-fatal):", err)
        );

        return NextResponse.json({
            success: true,
            restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email },
        });
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
