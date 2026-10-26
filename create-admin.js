require("dotenv").config();

const bcrypt = require("bcryptjs");
const { Client } = require("pg");

async function createAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password || !process.env.DATABASE_URL) {
    throw new Error("Missing admin details or DATABASE_URL.");
  }

  const db = new Client({
  connectionString: process.env.DATABASE_URL,
});

  await db.connect();

  await db.query(`
    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'ADMIN',
      "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  const passwordHash = await bcrypt.hash(password, 12);

  await db.query(
    `
    INSERT INTO "AdminUser"
      ("id", "name", "email", "passwordHash", "role", "isActive")
    VALUES
      (gen_random_uuid()::text, $1, $2, $3, 'ADMIN', TRUE)

    ON CONFLICT ("email")
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "passwordHash" = EXCLUDED."passwordHash",
      "role" = 'ADMIN',
      "isActive" = TRUE,
      "updatedAt" = NOW()
    `,
    [name, email.trim().toLowerCase(), passwordHash]
  );

  await db.end();

  console.log("ADMIN CREATED SUCCESSFULLY");
}

createAdmin().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});