const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const NEW_PASSWORD = "Restly2026!";
const EMAIL = "Wolkchen357@gmail.com";

async function main() {
    const p = new PrismaClient();
    const hash = await bcrypt.hash(NEW_PASSWORD, 12);
    const updated = await p.restaurant.updateMany({
        where: { email: { equals: EMAIL, mode: "insensitive" } },
        data: { passwordHash: hash },
    });
    console.log(`Updated ${updated.count} account(s) for ${EMAIL}`);
    console.log(`New password: ${NEW_PASSWORD}`);
    await p.$disconnect();
}
main();
