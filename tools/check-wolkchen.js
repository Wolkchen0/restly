const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.restaurant.findMany({
    where: { email: { contains: "olkchen", mode: "insensitive" } },
    select: { id: true, email: true, name: true, emailVerified: true, verificationCode: true, verificationExpiry: true }
}).then(r => {
    for (const a of r) {
        console.log(a.email + " | code=" + a.verificationCode + " | verified=" + a.emailVerified + " | expires=" + a.verificationExpiry);
    }
    p.$disconnect();
});
