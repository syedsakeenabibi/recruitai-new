require("dotenv").config();
const { Client } = require("pg");
const {
  S3Client, HeadBucketCommand, HeadObjectCommand
} = require("@aws-sdk/client-s3");

(async () => {
  let db;
  try {
    if (!process.env.DATABASE_URL) throw Error("DATABASE_URL missing");
    db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000
    });
    await db.connect();
    console.log("DATABASE CONNECTION: PASS");

    const counts = await db.query(`
      SELECT
        (SELECT count(*)::int FROM public."PublicJob"
         WHERE "status" = 'PUBLISHED') AS published_jobs,
        (SELECT count(*)::int FROM public."PublicJobApplication")
          AS applications
    `);
    console.log("Published jobs:", counts.rows[0].published_jobs);
    console.log("Applications:", counts.rows[0].applications);

    const apps = await db.query(`
      SELECT id, "jobTitle", "resumeKey"
      FROM public."PublicJobApplication"
      ORDER BY "createdAt" DESC LIMIT 5
    `);

    const required = [
      "R2_ENDPOINT", "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"
    ];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
      console.log("R2 CONFIG: FAIL — missing:", missing.join(", "));
      return;
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });

    try {
      await s3.send(new HeadBucketCommand({
        Bucket: process.env.R2_BUCKET_NAME
      }));
      console.log("R2 BUCKET ACCESS: PASS");
    } catch (e) {
      console.log("R2 BUCKET ACCESS: FAIL —", e.name, e.message);
      return;
    }

    for (const a of apps.rows) {
      if (!a.resumeKey) {
        console.log("RESUME OBJECT: MISSING KEY for application", a.id);
        continue;
      }
      try {
        await s3.send(new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: a.resumeKey
        }));
        console.log("RESUME OBJECT: PASS —", a.jobTitle, "(object exists)");
      } catch (e) {
        console.log("RESUME OBJECT: FAIL —", a.jobTitle, e.name);
      }
    }
  } catch (e) {
    console.log("DATABASE/R2 CHECK FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    if (db) await db.end().catch(() => {});
  }
})();
