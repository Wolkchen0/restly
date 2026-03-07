const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash("demo1234", 12);

    // Remove existing demo data
    await prisma.location.deleteMany({});
    await prisma.restaurant.deleteMany({ where: { email: "demo@meyhouse.com" } });

    // Create restaurant brand (parent account)
    const restaurant = await prisma.restaurant.create({
        data: {
            name: "Meyhouse",
            email: "demo@meyhouse.com",
            passwordHash: hash,
            plan: "pro",
            primaryColor: "#C9A84C",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),

            // Create 3 locations (branches) — all accessible from one login
            locations: {
                create: [
                    {
                        name: "Meyhouse — Hollywood",
                        address: "1234 Hollywood Blvd",
                        city: "Los Angeles, CA",
                        timezone: "America/Los_Angeles",
                        isDefault: true,
                        posProvider: "toast",
                        posApiKey: "demo-toast-key-hollywood",
                        posLocationId: "demo-guid-001",
                        opentableRestaurantId: "12345",
                    },
                    {
                        name: "Meyhouse — Beverly Hills",
                        address: "9876 Wilshire Blvd",
                        city: "Beverly Hills, CA",
                        timezone: "America/Los_Angeles",
                        isDefault: false,
                        posProvider: "clover",
                        posApiKey: "demo-clover-key-bh",
                        posLocationId: "demo-merchant-002",
                    },
                    {
                        name: "Meyhouse — Santa Monica",
                        address: "200 3rd Street Promenade",
                        city: "Santa Monica, CA",
                        timezone: "America/Los_Angeles",
                        isDefault: false,
                        posProvider: "square",
                        posApiKey: "demo-square-key-sm",
                        posLocationId: "demo-location-003",
                    },
                ],
            },
        },
        include: { locations: true },
    });

    console.log(`✅ Restaurant created: ${restaurant.name}`);
    console.log(`   Email: ${restaurant.email}`);
    console.log(`   Password: demo1234`);
    console.log(`   Plan: ${restaurant.plan}`);
    console.log(`   Locations (${restaurant.locations.length}):`);
    restaurant.locations.forEach(l => console.log(`     • ${l.name} — ${l.posProvider?.toUpperCase()} POS`));
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
