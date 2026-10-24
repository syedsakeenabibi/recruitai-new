
require("dotenv").config();
const { Client } = require("pg");

async function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false }
  });

  await db.connect();

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS "PublicJob" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "companyName" TEXT NOT NULL DEFAULT 'Fusion Staffing Solutions',
        "category" TEXT NOT NULL,
        "industry" TEXT,
        "country" TEXT,
        "location" TEXT NOT NULL,
        "employmentType" TEXT,
        "workplaceType" TEXT,
        "salary" TEXT,
        "description" TEXT NOT NULL,
        "responsibilities" TEXT,
        "requirements" TEXT,
        "benefits" TEXT,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('PublicJob table created or already exists.');
  } finally {
    await db.end();
  }
}

setup().catch(error => {
  console.error("DATABASE SETUP ERROR:", error);
  process.exit(1);
});
