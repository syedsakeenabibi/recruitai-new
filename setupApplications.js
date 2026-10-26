require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await db.connect();
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "PublicJobApplication" (
        "id" TEXT PRIMARY KEY,
        "jobId" TEXT NOT NULL,
        "jobTitle" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "location" TEXT,
        "experience" TEXT,
        "message" TEXT,
        "resumeKey" TEXT,
        "resumeFileName" TEXT,
        "resumeMimeType" TEXT,
        "consent" BOOLEAN NOT NULL DEFAULT FALSE,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("SUCCESS: PublicJobApplication table is ready.");
  } finally {
    await db.end();
  }
}

main().catch(e => {
  console.error("SETUP ERROR:", e.message);
  process.exit(1);
});
