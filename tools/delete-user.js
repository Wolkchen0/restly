// Delete user accounts by email
// Usage: node tools/delete-user.js <email>
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "Wolkchen357@gmail.com";
  console.log(`\n🔍 Looking for account: ${email}\n`);

  // Find the restaurant
  const restaurant = await prisma.restaurant.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      locations: {
        include: {
          timeRequests: true
        }
      },
      guests: true
    }
  });

  if (!restaurant) {
    console.log(`❌ No account found with email: ${email}`);
    
    // List all accounts
    const all = await prisma.restaurant.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.log('\n📋 All accounts in database:');
    all.forEach(a => console.log(`   - ${a.email} (${a.name}) created: ${a.createdAt.toISOString().split('T')[0]}`));
    return;
  }

  console.log(`✅ Found: "${restaurant.name}" (${restaurant.email})`);
  console.log(`   ID: ${restaurant.id}`);
  console.log(`   Plan: ${restaurant.plan}`);
  console.log(`   Created: ${restaurant.createdAt}`);
  console.log(`   Locations: ${restaurant.locations.length}`);
  restaurant.locations.forEach(loc => {
    console.log(`     - ${loc.name} (${loc.id}) — ${loc.timeRequests.length} time requests`);
  });
  console.log(`   Guests: ${restaurant.guests.length}`);

  // CASCADE delete will remove locations, timeRequests, and guests
  console.log(`\n🗑️  Deleting restaurant and all related data...`);
  const deleted = await prisma.restaurant.delete({
    where: { id: restaurant.id }
  });
  console.log(`✅ Deleted: "${deleted.name}" (${deleted.email})\n`);

  // Also check for test accounts we created during E2E testing
  const testEmails = ["e2etest@restly.pro", "customer@example.com"];
  for (const te of testEmails) {
    const test = await prisma.restaurant.findUnique({ where: { email: te } });
    if (test) {
      await prisma.restaurant.delete({ where: { email: te } });
      console.log(`🗑️  Also deleted test account: ${te}`);
    }
  }

  console.log('\n📋 Remaining accounts:');
  const remaining = await prisma.restaurant.findMany({
    select: { email: true, name: true }
  });
  remaining.forEach(a => console.log(`   - ${a.email} (${a.name})`));
}

main()
  .catch(e => { console.error("Error:", e.message); })
  .finally(() => prisma.$disconnect());
