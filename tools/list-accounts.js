const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const p = new PrismaClient();
p.restaurant.findMany({
  select: { email: true, name: true, plan: true, locations: { select: { id: true, name: true } } }
}).then(r => {
  let out = "";
  r.forEach(a => {
    out += `${a.email} | ${a.name} | ${a.plan}\n`;
    a.locations.forEach(l => out += `  -> ${l.name} [${l.id}]\n`);
  });
  out += `\nTOTAL: ${r.length} accounts`;
  fs.writeFileSync("tools/accounts-list.txt", out);
  console.log("Written to tools/accounts-list.txt");
  p.$disconnect();
});
