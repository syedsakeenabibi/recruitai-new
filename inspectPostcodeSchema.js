require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await db.connect();

  try {
    const result = await db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('Candidate', 'PublicJobApplication')
      ORDER BY table_name, ordinal_position
    `);

    console.table(result.rows);
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error("Database inspection failed:", error.message);
  process.exit(1);
});
