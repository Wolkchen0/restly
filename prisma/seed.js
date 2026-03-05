// run: node prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash("demo1234", 12);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.restaurant.upsert({
        where: { email: "demo@meyhouse.com" },
        update: {},
        create: {
            name: "Meyhouse",
            email: "demo@meyhouse.com",
            passwordHash: hash,
            plan: "pro",
            location: "Los Angeles, CA",
            trialEndsAt,
        },
    });

    console.log("✅ Demo account created: demo@meyhouse.com / demo1234");
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
