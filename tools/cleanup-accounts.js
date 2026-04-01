const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

// Accounts to delete (test/old accounts - NOT demo@meyhouse.com)
const toDelete = [
  "test@test.com",
  "e2etest2@restly.pro",
  "ihsanduygu357+test1@gmail.com",
  "ihsanduygu357+verify456@gmail.com",
  "ihsan@restly.pro",
];

async function main() {
  for (const email of toDelete) {
    const r = await p.restaurant.findUnique({ where: { email } });
    if (r) {
      await p.restaurant.delete({ where: { email } });
      console.log(`🗑️  Deleted: ${email} (${r.name})`);
    } else {
      console.log(`⏩ Not found: ${email}`);
    }
  }
  
  console.log("\n📋 Remaining accounts:");
  const remaining = await p.restaurant.findMany({
    select: { email: true, name: true, plan: true, locations: { select: { name: true } } }
  });
  remaining.forEach(a => {
    console.log(`  ${a.email} | ${a.name} | ${a.plan}`);
    a.locations.forEach(l => console.log(`    -> ${l.name}`));
  });
  console.log(`\nTOTAL: ${remaining.length}`);
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
