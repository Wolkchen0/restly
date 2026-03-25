/**
 * Restly Üye Yönetim Aracı
 * ─────────────────────────
 * Kullanım:
 *   node tools/member-report.js                    → Rapor oluştur
 *   node tools/member-report.js activate EMAIL     → Sınırsız aç (ücretli üyelik)
 *   node tools/member-report.js deactivate EMAIL   → Erişimi kapat
 *   node tools/member-report.js extend EMAIL       → Trial +30 gün uzat
 *   node tools/member-report.js vip EMAIL          → VIP yap (enterprise)
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = "postgresql://postgres:%2AzCzNr%26-qJBX2fE@db.lauoqtwxinkchbgcxsbx.supabase.co:5432/postgres";

// ── VIP E-postalar (asla ücret almayacağınız kişiler) ──
const VIP_EMAILS = [
    // Buraya VIP e-postaları ekleyin:
    // "ornek@mail.com",
];

async function getClient() {
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    return client;
}

// ── RAPOR OLUŞTUR ──
async function generateReport() {
    const client = await getClient();

    const result = await client.query(`
        SELECT id, name, email, plan, "isActive", "emailVerified", "createdAt", "trialEndsAt"
        FROM "Restaurant"
        WHERE email NOT LIKE 'demo+%'
        ORDER BY "createdAt" DESC
    `);

    const now = new Date();
    const members = result.rows.map(r => {
        const created = new Date(r.createdAt);
        const daysSince = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        let trialRemaining = null;
        let status = "trial";
        const isVip = VIP_EMAILS.map(e => e.toLowerCase()).includes(r.email.toLowerCase());

        if (!r.isActive) {
            status = "⛔ KAPALI";
        } else if (isVip) {
            status = "👑 VIP";
        } else if (r.plan === "pro" || r.plan === "enterprise") {
            status = "🟢 AKTİF (Ücretli)";
        } else if (r.trialEndsAt) {
            const trialEnd = new Date(r.trialEndsAt);
            trialRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
            if (trialRemaining <= 0) {
                status = "🔴 SÜRESİ DOLMUŞ";
                trialRemaining = 0;
            } else {
                status = "🟡 TRIAL";
            }
        }

        return { ...r, daysSince, trialRemaining, status, isVip };
    });

    // İstatistikler
    const total = members.length;
    const active = members.filter(m => m.status.includes("AKTİF")).length;
    const trial = members.filter(m => m.status.includes("TRIAL")).length;
    const expired = members.filter(m => m.status.includes("DOLMUŞ")).length;
    const vip = members.filter(m => m.status.includes("VIP")).length;
    const inactive = members.filter(m => m.status.includes("KAPALI")).length;

    // Rapor dosyası oluştur
    const reportDate = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

    let report = `# 📊 Restly Üye Raporu\n`;
    report += `> Son güncelleme: ${reportDate}\n\n`;

    report += `## Özet\n`;
    report += `| Metrik | Sayı |\n|--------|------|\n`;
    report += `| 👥 Toplam Üye | ${total} |\n`;
    report += `| 🟢 Aktif (Ücretli) | ${active} |\n`;
    report += `| 🟡 Trial | ${trial} |\n`;
    report += `| 🔴 Süresi Dolmuş | ${expired} |\n`;
    report += `| 👑 VIP | ${vip} |\n`;
    report += `| ⛔ Kapalı | ${inactive} |\n\n`;

    report += `## Üye Listesi\n\n`;
    report += `| # | İsim | E-posta | Plan | Üyelik (gün) | Kalan Gün | Durum |\n`;
    report += `|---|------|---------|------|-------------|-----------|-------|\n`;

    members.forEach((m, i) => {
        const created = new Date(m.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
        const remaining = m.trialRemaining !== null ? `${m.trialRemaining} gün` : "—";
        report += `| ${i + 1} | ${m.name} | ${m.email} | ${m.plan} | ${m.daysSince} gün (${created}) | ${remaining} | ${m.status} |\n`;
    });

    report += `\n---\n\n`;
    report += `## Komutlar\n`;
    report += `\`\`\`\n`;
    report += `node tools/member-report.js                     → Bu raporu yeniden oluştur\n`;
    report += `node tools/member-report.js activate EMAIL      → Sınırsız aç (ücretli üyelik)\n`;
    report += `node tools/member-report.js deactivate EMAIL    → Erişimi kapat\n`;
    report += `node tools/member-report.js extend EMAIL        → Trial +30 gün uzat\n`;
    report += `node tools/member-report.js vip EMAIL           → VIP yap (enterprise)\n`;
    report += `\`\`\`\n`;

    const reportPath = path.join(__dirname, "..", "MEMBER_REPORT.md");
    fs.writeFileSync(reportPath, report, "utf-8");

    console.log(`\n✅ Rapor oluşturuldu: MEMBER_REPORT.md`);
    console.log(`📊 Toplam: ${total} | Aktif: ${active} | Trial: ${trial} | Expired: ${expired} | VIP: ${vip} | Kapalı: ${inactive}\n`);

    await client.end();
}

// ── ÜYE YÖNETİM ──
async function manageMember(action, email) {
    const client = await getClient();

    // Üyeyi bul
    const result = await client.query(`SELECT id, name, email, plan, "isActive" FROM "Restaurant" WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
        console.log(`\n❌ Üye bulunamadı: ${email}\n`);
        await client.end();
        return;
    }

    const member = result.rows[0];
    let updateQuery = "";
    let actionLabel = "";

    switch (action) {
        case "activate":
            updateQuery = `UPDATE "Restaurant" SET plan = 'pro', "isActive" = true, "trialEndsAt" = NULL WHERE email = $1`;
            actionLabel = "Sınırsız açıldı (Pro plan)";
            break;
        case "deactivate":
            updateQuery = `UPDATE "Restaurant" SET "isActive" = false WHERE email = $1`;
            actionLabel = "Erişim kapatıldı";
            break;
        case "extend":
            updateQuery = `UPDATE "Restaurant" SET plan = 'trial', "isActive" = true, "trialEndsAt" = NOW() + INTERVAL '30 days' WHERE email = $1`;
            actionLabel = "Trial 30 gün uzatıldı";
            break;
        case "vip":
            updateQuery = `UPDATE "Restaurant" SET plan = 'enterprise', "isActive" = true, "trialEndsAt" = NULL WHERE email = $1`;
            actionLabel = "VIP yapıldı (Enterprise plan)";
            break;
        default:
            console.log(`\n❌ Geçersiz komut: ${action}`);
            console.log(`Geçerli komutlar: activate, deactivate, extend, vip\n`);
            await client.end();
            return;
    }

    await client.query(updateQuery, [email]);
    console.log(`\n✅ ${member.name} (${email}): ${actionLabel}\n`);

    await client.end();

    // Raporu yeniden oluştur
    await generateReport();
}

// ── MAIN ──
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        await generateReport();
    } else if (args.length === 2) {
        await manageMember(args[0], args[1]);
    } else {
        console.log(`\nKullanım:`);
        console.log(`  node tools/member-report.js                  → Rapor oluştur`);
        console.log(`  node tools/member-report.js activate EMAIL   → Sınırsız aç`);
        console.log(`  node tools/member-report.js deactivate EMAIL → Erişimi kapat`);
        console.log(`  node tools/member-report.js extend EMAIL     → Trial +30 gün`);
        console.log(`  node tools/member-report.js vip EMAIL        → VIP yap\n`);
    }
}

main().catch(err => {
    console.error("Hata:", err.message);
    process.exit(1);
});
