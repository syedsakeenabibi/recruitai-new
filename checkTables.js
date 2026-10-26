require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  try {
    await db.connect();

    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.table(result.rows);
  } finally {
    await db.end();
  }
}

main().catch(e => {
  console.error("DATABASE CHECK ERROR:", e.message);
  process.exit(1);
});
