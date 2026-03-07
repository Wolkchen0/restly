const { Client } = require('pg');

const regions = [
    "us-west-1", "us-east-1", "us-east-2", "eu-central-1", "eu-west-1",
    "eu-west-2", "eu-west-3", "ap-southeast-1", "ap-southeast-2",
    "ap-northeast-1", "ap-northeast-2", "sa-east-1", "ca-central-1"
];

const pass = "*zCzNr&-qJBX2fE";
const user = "postgres.lauoqtwxinkchbgcxsbx";

async function check() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:6543/postgres?sslmode=require`;

        // console.log("Testing:", connectionString);
        const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });
        try {
            await client.connect();
            console.log("SUCCESS:", region);
            console.log("URL:", `postgresql://${user}:[YOUR-PASSWORD]@${host}:6543/postgres?sslmode=require`);
            console.log("URL_RAW:", connectionString);
            await client.end();
            return connectionString;
        } catch (e) {
            if (!e.message.includes('timeout') && !e.message.includes('getaddrinfo')) {
                console.log("Failed:", region, e.message);
            }
        }
    }
    console.log("None worked");
}

check();
