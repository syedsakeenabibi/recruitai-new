require("dotenv").config();
const { Client } = require("pg");

(async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing from root .env");

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false : { rejectUnauthorized: false }
  });

  await db.connect();

  try {
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log("\n=== TABLE ROW COUNTS ===");
    for (const { table_name } of tables.rows) {
      const safeName = '"' + table_name.replace(/"/g, '""') + '"';
      const count = await db.query(
        `SELECT COUNT(*)::int AS count FROM public.${safeName}`
      );
      console.log(`${table_name}: ${count.rows[0].count} rows`);
    }

    for (const table of ["PublicJob", "PublicJobApplication"]) {
      const exists = await db.query(
        `SELECT to_regclass($1) AS name`, [`public."${table}"`]
      );

      console.log(`\n=== ${table} ===`);
      if (!exists.rows[0].name) {
        console.log("TABLE MISSING");
        continue;
      }

      const cols = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.log("Columns:", cols.rows.map(r => r.column_name).join(", "));

      if (table === "PublicJob") {
        const jobs = await db.query(`
          SELECT "id", "title", "status", "location", "createdAt"
          FROM public."PublicJob"
          ORDER BY "createdAt" DESC
          LIMIT 10
        `);
        console.table(jobs.rows);
      } else {
        console.log("Recent application rows (sensitive fields excluded):");
        const safeCols = cols.rows
          .map(r => r.column_name)
          .filter(c => !/email|resume|file|token|secret|password|phone|name/i.test(c));

        if (safeCols.length) {
          const projection = safeCols
            .map(c => '"' + c.replace(/"/g, '""') + '"').join(", ");
          const rows = await db.query(
            `SELECT ${projection} FROM public."PublicJobApplication" LIMIT 5`
          );
          console.table(rows.rows);
        } else {
          console.log("No non-sensitive columns available to display.");
        }
      }
    }
  } finally {
    await db.end();
  }
})().catch(e => {
  console.error("READ-ONLY DB CHECK FAILED:", e.message);
  process.exit(1);
});
