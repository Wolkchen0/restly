const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    const users = await prisma.restaurant.findMany();
    console.log("Users in DB:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
