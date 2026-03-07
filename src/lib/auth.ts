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

                const restaurant = await prisma.restaurant.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!restaurant || !restaurant.isActive) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    restaurant.passwordHash
                );
                if (!valid) return null;

                return {
                    id: restaurant.id,
                    email: restaurant.email,
                    name: restaurant.name,
                    plan: restaurant.plan,
                    primaryColor: restaurant.primaryColor,
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
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).plan = token.plan;
                (session.user as any).primaryColor = token.primaryColor;
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
