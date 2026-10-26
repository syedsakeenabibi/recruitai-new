const express = require("express");
const { randomUUID } = require("crypto");
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");


function createPublicJobsRouter({ getDb, requireAdmin, requireRole }) {
  const router = express.Router();
  const adminOnly = [requireAdmin, requireRole(["ADMIN"])];

  const fields = [
    "title", "companyName", "category", "industry",
    "country", "location", "employmentType", "workplaceType",
    "salary", "description", "responsibilities",
    "requirements", "benefits"
  ];

  function cleanJob(body) {
    const job = {};
    for (const field of fields) {
      const value = body?.[field];
      job[field] = typeof value === "string" ? value.trim().slice(0, 20000) : "";
    }
    job.companyName ||= "Fusion Staffing Solutions";
    return job;
  }

  function validate(job) {
    if (!job.title || !job.location || !job.description || !job.category) {
      return "Job title, location, description and category are required.";
    }
    return null;
  }

  async function query(sql, params = []) {
    const db = await getDb();
    try {
      return await db.query(sql, params);
    } finally {
      await db.end().catch(() => {});
    }
  }

  router.get("/", async (_req, res) => {
    try {
      const result = await query(
        'SELECT * FROM "PublicJob" WHERE "status" = $1 ORDER BY "publishedAt" DESC, "createdAt" DESC',
        ["PUBLISHED"]
      );
      res.set("Cache-Control", "no-store");
      res.json({ success: true, jobs: result.rows });
    } catch (error) {
      console.error("PUBLIC JOBS LIST ERROR:", error);
      res.status(500).json({ error: "Unable to load vacancies." });
    }
  });

  router.get("/manage", adminOnly, async (_req, res) => {
    try {
      const result = await query('SELECT * FROM "PublicJob" ORDER BY "createdAt" DESC');
      res.set("Cache-Control", "no-store");
      res.json({ success: true, jobs: result.rows });
    } catch (error) {
      console.error("ADMIN JOBS LIST ERROR:", error);
      res.status(500).json({ error: "Unable to load managed jobs." });
    }
  });

  router.get("/applications/manage", adminOnly, async (_req, res) => {
    try {
      const result = await query(
        'SELECT "id","jobId","jobTitle","name","email","phone","location","experience","message","resumeFileName","status","createdAt" FROM "PublicJobApplication" ORDER BY "createdAt" DESC LIMIT 500'
      );
      res.set("Cache-Control", "no-store");
      res.json({ success: true, applications: result.rows });
    } catch (error) {
      console.error("ADMIN APPLICATIONS ERROR:", error);
      res.status(500).json({ error: "Unable to load applications." });
    }
  });

  router.patch("/applications/:id/status", adminOnly, async (req, res) => {
    if (!["NEW","REVIEWING","SHORTLISTED","REJECTED"].includes(req.body?.status)) {
      return res.status(400).json({ error: "Invalid application status." });
    }
    try {
      const result = await query(
        'UPDATE "PublicJobApplication" SET "status" = $1 WHERE "id" = $2 RETURNING "id","status"',
        [req.body.status, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Application not found." });
      res.json({ success: true, application: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: "Unable to update application." });
    }
  });

  router.get("/applications/:id/resume", adminOnly, async (req, res) => {
    try {
      const result = await query(
        'SELECT "resumeKey","resumeFileName","resumeMimeType" FROM "PublicJobApplication" WHERE "id" = $1',
        [req.params.id]
      );
      const application = result.rows[0];
      if (!application) return res.status(404).json({ error: "Application not found." });

      const object = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: application.resumeKey
      }));
      if (!object.Body) return res.status(404).json({ error: "CV unavailable." });

      const safeName = application.resumeFileName.replace(/[\r\n"\\]/g, "_");
      res.set("Cache-Control", "no-store");
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Content-Type", application.resumeMimeType);
      res.set("Content-Disposition", 'attachment; filename="' + safeName + '"');
      object.Body.on("error", () => res.destroy());
      object.Body.pipe(res);
    } catch (error) {
      console.error("APPLICATION CV ERROR:", error);
      if (!res.headersSent) res.status(500).json({ error: "Unable to download CV." });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const result = await query(
        'SELECT * FROM "PublicJob" WHERE "id" = $1 AND "status" = $2',
        [req.params.id, "PUBLISHED"]
      );
      res.set("Cache-Control", "no-store");
      if (!result.rows.length) return res.status(404).json({ error: "Job not found." });
      res.json({ success: true, job: result.rows[0] });
    } catch (error) {
      console.error("PUBLIC JOB DETAIL ERROR:", error);
      res.status(500).json({ error: "Unable to load job." });
    }
  });

  router.post("/", adminOnly, async (req, res) => {
    const job = cleanJob(req.body);
    const error = validate(job);
    if (error) return res.status(400).json({ error });

    const id = randomUUID();
    try {
      const values = fields.map((field) => job[field] || null);
      const columns = ['"id"', ...fields.map((field) => `"${field}"`)].join(", ");
      const placeholders = values.map((_, i) => `$${i + 2}`).join(", ");
      const result = await query(
        `INSERT INTO "PublicJob" (${columns}) VALUES ($1, ${placeholders}) RETURNING *`,
        [id, ...values]
      );
      res.status(201).json({ success: true, job: result.rows[0] });
    } catch (error) {
      console.error("CREATE PUBLIC JOB ERROR:", error);
      res.status(500).json({ error: "Unable to create job." });
    }
  });

  router.put("/:id", adminOnly, async (req, res) => {
    const job = cleanJob(req.body);
    const error = validate(job);
    if (error) return res.status(400).json({ error });

    try {
      const values = fields.map((field) => job[field] || null);
      const assignments = fields.map((field, i) => `"${field}" = $${i + 1}`).join(", ");
      const result = await query(
        `UPDATE "PublicJob" SET ${assignments}, "updatedAt" = NOW() WHERE "id" = $${fields.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Job not found." });
      res.json({ success: true, job: result.rows[0] });
    } catch (error) {
      console.error("UPDATE PUBLIC JOB ERROR:", error);
      res.status(500).json({ error: "Unable to update job." });
    }
  });

  router.patch("/:id/status", adminOnly, async (req, res) => {
    const status = req.body?.status;
    if (!["DRAFT", "PUBLISHED", "CLOSED"].includes(status)) {
      return res.status(400).json({ error: "Invalid job status." });
    }

    try {
      const result = await query(
        `UPDATE "PublicJob"
         SET "status" = $1,
             "publishedAt" = CASE WHEN $1 = 'PUBLISHED' THEN COALESCE("publishedAt", NOW()) ELSE "publishedAt" END,
             "updatedAt" = NOW()
         WHERE "id" = $2 RETURNING *`,
        [status, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Job not found." });
      res.json({ success: true, job: result.rows[0] });
    } catch (error) {
      console.error("PUBLIC JOB STATUS ERROR:", error);
      res.status(500).json({ error: "Unable to change job status." });
    }
  });

  router.delete("/:id", adminOnly, async (req, res) => {
    try {
      const result = await query(
        'DELETE FROM "PublicJob" WHERE "id" = $1 RETURNING "id"',
        [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Job not found." });
      res.json({ success: true, deletedId: req.params.id });
    } catch (error) {
      console.error("DELETE PUBLIC JOB ERROR:", error);
      res.status(500).json({ error: "Unable to delete job." });
    }
  });


  const applicationUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      const types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      };
      if (types[extension] === file.mimetype) return callback(null, true);
      callback(new Error("Only PDF and DOCX resumes are allowed."));
    }
  });

  function uploadResume(req, res, next) {
    applicationUpload.single("resume")(req, res, (error) => {
      if (!error) return next();
      return res.status(400).json({
        error: error.code === "LIMIT_FILE_SIZE"
          ? "CV must be 5 MB or smaller."
          : "Invalid CV upload. Only PDF and DOCX files are allowed."
      });
    });
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });



router.post("/:id/apply", uploadResume, async (req, res) => {
  const {
    name,
    email,
    phone,
    country,
    postcode,
    location,
    experience,
    message,
    consent,
  } = req.body;

  if (!name?.trim() || !email?.trim() || !req.file || consent !== "true") {
    return res.status(400).json({
      error: "Name, email, CV and recruitment consent are required.",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = (phone || "").trim();
  const cleanCountry = (country || "").trim();
  const cleanPostcode = (postcode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  const cleanLocation = (location || "").trim();
  const cleanExperience = (experience || "").trim();
  const cleanMessage = (message || "").trim();

  if (!["United States", "United Kingdom"].includes(cleanCountry)) {
    return res.status(400).json({
      error: "Only United States and United Kingdom applications are accepted.",
    });
  }

  const validUSPostcode = /^\d{5}(?:-\d{4})?$/.test(cleanPostcode);
  const validUKPostcode =
    /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/.test(cleanPostcode);

  if (
    (cleanCountry === "United States" && !validUSPostcode) ||
    (cleanCountry === "United Kingdom" && !validUKPostcode)
  ) {
    return res.status(400).json({
      error:
        cleanCountry === "United States"
          ? "Enter a valid US ZIP code, such as 10001."
          : "Enter a valid UK postcode, such as SW1A 1AA.",
    });
  }

  if (
    cleanName.length > 200 ||
    cleanEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanPhone.length > 60 ||
    cleanPostcode.length > 20 ||
    cleanLocation.length > 300 ||
    cleanExperience.length > 100 ||
    cleanMessage.length > 5000
  ) {
    return res.status(400).json({
      error: "Please check your application details.",
    });
  }

  if (!process.env.R2_BUCKET_NAME) {
    return res.status(500).json({
      error: "CV storage is not configured.",
    });
  }

  const file = req.file;
  const extension = path.extname(file.originalname).toLowerCase();

  const signatureValid =
    file.mimetype === "application/pdf"
      ? file.buffer.subarray(0, 5).toString("ascii") === "%PDF-"
      : file.buffer
          .subarray(0, 4)
          .equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  if (!signatureValid) {
    return res.status(400).json({
      error: "CV file content does not match its format.",
    });
  }

  let resumeKey = null;
  let db = null;
  let transactionStarted = false;

  try {
    const jobResult = await query(
      'SELECT "id", "title" FROM "PublicJob" WHERE "id" = $1 AND "status" = $2',
      [req.params.id, "PUBLISHED"]
    );

    const job = jobResult.rows[0];

    if (!job) {
      return res.status(404).json({
        error: "This vacancy is not available.",
      });
    }

    resumeKey = "resumes/" + randomUUID() + extension;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: resumeKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const applicationId = randomUUID();
    const resumeFileName = path.basename(file.originalname).slice(0, 200);

    const experienceMatch = cleanExperience.match(/\d+(\.\d+)?/);
    const experienceYears = experienceMatch
      ? Number(experienceMatch[0])
      : null;

    db = await getDb();
    await db.query("BEGIN");
    transactionStarted = true;

    const candidateResult = await db.query(
      `INSERT INTO "Candidate" (
        "id",
        "name",
        "email",
        "phone",
        "location",
        "country",
        "experienceYears",
        "resumeFileName",
        "resumeFileUrl",
        "resumeMimeType",
        "source",
        "recruitmentConsent",
        "consentedAt",
        "privacyVersion",
        "updatedAt",
        "skills",
        "preferredRoles",
        "preferredLocations",
        "postcode"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        'PUBLIC_JOB_APPLICATION', TRUE, NOW(),
        'public-job-application-v1', NOW(),
        ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], $11
      )
      ON CONFLICT ("email") DO UPDATE SET
        "name" = EXCLUDED."name",
        "phone" = EXCLUDED."phone",
        "location" = COALESCE(EXCLUDED."location", "Candidate"."location"),
        "country" = COALESCE(EXCLUDED."country", "Candidate"."country"),
        "postcode" = COALESCE(EXCLUDED."postcode", "Candidate"."postcode"),
        "experienceYears" = COALESCE(
          EXCLUDED."experienceYears",
          "Candidate"."experienceYears"
        ),
        "resumeFileName" = EXCLUDED."resumeFileName",
        "resumeFileUrl" = EXCLUDED."resumeFileUrl",
        "resumeMimeType" = EXCLUDED."resumeMimeType",
        "recruitmentConsent" = TRUE,
        "consentedAt" = NOW(),
        "privacyVersion" = EXCLUDED."privacyVersion",
        "updatedAt" = NOW()
      RETURNING "id"`,
      [
        randomUUID(),
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanLocation || null,
        cleanCountry,
        experienceYears,
        resumeFileName,
        resumeKey,
        file.mimetype,
        cleanPostcode,
      ]
    );

    await db.query(
      `INSERT INTO "PublicJobApplication" (
        "id",
        "jobId",
        "jobTitle",
        "name",
        "email",
        "phone",
        "location",
        "experience",
        "message",
        "resumeKey",
        "resumeFileName",
        "resumeMimeType",
        "consent",
        "postcode"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        applicationId,
        job.id,
        job.title,
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanLocation,
        cleanExperience,
        cleanMessage,
        resumeKey,
        resumeFileName,
        file.mimetype,
        true,
        cleanPostcode,
      ]
    );

    await db.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      applicationId,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    if (db && transactionStarted) {
      await db.query("ROLLBACK").catch(() => {});
    }

    if (resumeKey) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: resumeKey,
        })
      ).catch((cleanupError) => {
        console.error("CV CLEANUP ERROR:", cleanupError);
      });
    }

    console.error("JOB APPLICATION ERROR:", error);

    return res.status(500).json({
      error: "Unable to submit application. Please try again.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});

return router;
}

module.exports = { createPublicJobsRouter };
