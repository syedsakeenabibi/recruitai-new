require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter NEW password (minimum 12 characters): ", async (password) => {
  rl.close();

  if (password.length < 12) {
    console.log("Password must be at least 12 characters.");
    return;
  }

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("render.com")
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    await db.connect();
    await db.query("BEGIN");

    const result = await db.query(
      'SELECT "id", "passwordHash" FROM "AdminUser" WHERE LOWER("email") = LOWER($1) FOR UPDATE',
      ["info@researchersfusion.com"]
    );

    if (result.rows.length !== 1) {
      throw new Error("Account not found.");
    }

    const backup = "admin-password-backup-" + Date.now() + ".json";
    fs.writeFileSync(backup, JSON.stringify({
      email: "info@researchersfusion.com",
      passwordHash: result.rows[0].passwordHash
    }), { mode: 0o600 });

    const hash = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE "AdminUser" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      [hash, result.rows[0].id]
    );

    await db.query("COMMIT");
    console.log("PASSWORD RESET SUCCESSFUL");
    console.log("Backup:", backup);
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("ERROR:", error.message);
  } finally {
    await db.end().catch(() => {});
  }
});
