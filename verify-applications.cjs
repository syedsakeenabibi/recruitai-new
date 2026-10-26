require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false : { rejectUnauthorized: false }
  });

  await db.connect();
  try {
    const r = await db.query(`
      SELECT
        a.id,
        a."jobTitle",
        a.status,
        (a."resumeKey" IS NOT NULL AND a."resumeKey" <> '') AS has_resume_key,
        (j.id IS NOT NULL) AS job_exists,
        a."createdAt"
      FROM public."PublicJobApplication" a
      LEFT JOIN public."PublicJob" j ON j.id = a."jobId"
      ORDER BY a."createdAt" DESC
    `);
    console.table(r.rows);
  } finally {
    await db.end();
  }
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});
