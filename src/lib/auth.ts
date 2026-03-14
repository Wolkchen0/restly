import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.NEXTAUTH_SECRET || "restly-super-secret-key-change-in-production-32chars",
    trustHost: true,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // --- SANDBOX DEMO INTERCEPTION ---
                if (credentials.email === "demo@restly.com" && credentials.password === "demo1234") {
                    // 1. Asynchronously clean up old sandboxes (> 24 hours old)
                    prisma.restaurant.deleteMany({
                        where: {
                            email: { startsWith: "demo+" },
                            createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                        }
                    }).catch(console.error);

                    // 2. Create a fresh isolated Sandbox for this session
                    const hash = await bcrypt.hash("demo1234", 10);
                    const sandbox = await prisma.restaurant.create({
                        data: {
                            name: "Sample Restaurant",
                            email: `demo+${Date.now()}_${Math.random().toString(36).substring(2, 7)}@restly.com`,
                            passwordHash: hash,
                            plan: "pro",
                            primaryColor: "#C9A84C",
                            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                            locations: {
                                create: [
                                    {
                                        name: "Sample Rest. — Downtown",
                                        address: "1234 Market St",
                                        city: "San Francisco, CA",
                                        timezone: "America/Los_Angeles",
                                        isDefault: true,
                                        posProvider: "toast",
                                        posApiKey: "demo-toast-key-downtown",
                                        posLocationId: "demo-guid-001",
                                        opentableRestaurantId: "12345",
                                    },
                                    {
                                        name: "Sample Rest. — Westside",
                                        address: "9876 Sunset Blvd",
                                        city: "Los Angeles, CA",
                                        timezone: "America/Los_Angeles",
                                        isDefault: false,
                                        posProvider: "clover",
                                        posApiKey: "demo-clover-key-ws",
                                        posLocationId: "demo-merchant-002",
                                    },
                                    {
                                        name: "Sample Rest. — Waterfront",
                                        address: "200 Beach St",
                                        city: "Miami, FL",
                                        timezone: "America/New_York",
                                        isDefault: false,
                                        posProvider: "square",
                                        posApiKey: "demo-square-key-wf",
                                        posLocationId: "demo-location-003",
                                    },
                                ],
                            },
                        }
                    });

                    return {
                        id: sandbox.id,
                        email: sandbox.email,
                        name: sandbox.name,
                        plan: sandbox.plan,
                        primaryColor: sandbox.primaryColor,
                    };
                }
                // --- END SANDBOX INTERCEPTION ---

                const restaurant = await prisma.restaurant.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!restaurant || !restaurant.isActive) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    restaurant.passwordHash
                );
                if (!valid) return null;

                // Block unverified users from logging in
                if (!restaurant.emailVerified) {
                    throw new Error("EMAIL_NOT_VERIFIED");
                }

                return {
                    id: restaurant.id,
                    email: restaurant.email,
                    name: restaurant.name,
                    plan: restaurant.plan,
                    primaryColor: restaurant.primaryColor,
                    emailVerified: restaurant.emailVerified,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.plan = (user as any).plan;
                token.primaryColor = (user as any).primaryColor;
                token.emailVerified = (user as any).emailVerified;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).plan = token.plan;
                (session.user as any).primaryColor = token.primaryColor;
                (session.user as any).emailVerified = token.emailVerified;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: { strategy: "jwt" },
});
