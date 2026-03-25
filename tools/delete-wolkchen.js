// Delete wolkchen357@gmail.com accounts (case-insensitive)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const accts = await prisma.restaurant.findMany({
        where: {
            email: { in: ["wolkchen357@gmail.com", "Wolkchen357@gmail.com"] }
        },
        select: { id: true, email: true, name: true, emailVerified: true, createdAt: true }
    });

    console.log("Found " + accts.length + " account(s):");
    for (const a of accts) {
        console.log("  - " + a.email + " (" + a.name + ") verified=" + a.emailVerified + " created=" + a.createdAt);
    }

    for (const a of accts) {
        await prisma.location.deleteMany({ where: { restaurantId: a.id } });
        await prisma.guest.deleteMany({ where: { restaurantId: a.id } });
        await prisma.restaurant.delete({ where: { id: a.id } });
        console.log("Deleted: " + a.email + " (" + a.name + ")");
    }

    console.log("Done!");
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
