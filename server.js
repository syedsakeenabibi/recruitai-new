require("dotenv").config();
const { createPublicJobsRouter } = require("./modules/publicJobs");
const { randomUUID } = require("node:crypto");
const express = require("express");
const cors = require("cors");
const { Client } = require("pg");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { isSessionRevoked, revokeSession } = require("./modules/auth/sessionRevocation");
const { requireRoles } = require("./modules/auth/requireRoles");
const { createBdmRouter } = require("./modules/bdm");
const { createRaRouter } = require("./modules/ra");
const { createRecruitmentRouter } = require("./modules/recruitment");
const { discoverAtsJobs } = require("./modules/ra/sources/atsSources");


const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");


const app = express();

// Log requests before CORS so OPTIONS preflight requests are visible.
app.use((req, res, next) => {
  const startedAt = Date.now();

  console.log("[HTTP IN]", {
    method: req.method,
    path: req.path,
    origin: req.headers.origin || "no-origin",
    requestedMethod:
      req.headers["access-control-request-method"] || "-",
    requestedHeaders:
      req.headers["access-control-request-headers"] || "-",
  });

  res.on("finish", () => {
    console.log("[HTTP OUT]", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const PORT = process.env.PORT || 4000;
// PRIVATE CV STORAGE - CLOUDFLARE R2
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".docx"];
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      allowedTypes.includes(file.mimetype) &&
      allowedExtensions.includes(extension)
    ) {
      return cb(null, true);
    }
    cb(new Error("Only PDF and DOCX resumes are allowed."));
  },
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
function normalize(value = "") {
  return String(value).toLowerCase().trim();
}
function containsValue(candidateValue, requirement) {
  if (!candidateValue || !requirement) return false;
  return normalize(candidateValue).includes(normalize(requirement));
}
function skillMatches(candidateSkills = [], requiredSkill) {
  const required = normalize(requiredSkill);
  return candidateSkills.some((skill) => {
    const current = normalize(skill);
    return current === required ||
           current.includes(required) ||
           required.includes(current);
  });
}
// STEP 1 — AI understands ANY JD
async function extractJobRequirements(jd) {
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: [
      {
        role: "system",
        content: `
You are the job-description understanding engine for a recruitment system.
Read the supplied job description and extract ONLY job-related requirements.
Return valid JSON with exactly this structure:
{
  "jobTitle": "",
  "industry": "",
  "location": "",
  "minimumExperience": null,
  "requiredSkills": [],
  "preferredSkills": [],
  "education": "",
  "responsibilities": [],
  "keywords": []
}
Rules:
- requiredSkills = explicit or clearly mandatory skills.
- preferredSkills = optional, desirable, plus, preferred or nice-to-have skills.
- minimumExperience must be a number representing years, or null.
- Do not infer protected characteristics.
- Do not use age, gender, race, religion, disability, marital status or similar characteristics.
- Do not invent requirements that are absent from the JD.
- Return JSON only.
        `,
      },
      {
        role: "user",
        content: jd,
      },
    ],
  });
  let text = response.output_text.trim();
  text = text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(text);
}
// STEP 2 — Calculate explainable job-related score
function calculateMatch(candidate, job) {
  let earned = 0;
  let possible = 0;
  const reasons = [];
  const missingRequirements = [];
  const candidateSkills = candidate.skills || [];
  // Required skills — 45%
  if (job.requiredSkills?.length) {
    possible += 45;
    const matched = job.requiredSkills.filter(skill =>
      skillMatches(candidateSkills, skill) ||
      containsValue(candidate.resumeText, skill)
    );
    const missing = job.requiredSkills.filter(skill =>
      !matched.includes(skill)
    );
    earned +=
      45 * (matched.length / job.requiredSkills.length);
    if (matched.length) {
      reasons.push(
        `Required skills matched: ${matched.join(", ")}`
      );
    }
    missingRequirements.push(...missing);
  }
  // Job title — 20%
  if (job.jobTitle) {
    possible += 20;
    if (
      containsValue(candidate.currentTitle, job.jobTitle) ||
      containsValue(job.jobTitle, candidate.currentTitle)
    ) {
      earned += 20;
      reasons.push("Job title aligned");
    }
  }
  // Experience — 15%
  if (job.minimumExperience !== null &&
      job.minimumExperience !== undefined) {
    possible += 15;
    const experience =
      Number(candidate.experienceYears || 0);
    const required =
      Number(job.minimumExperience);
    if (experience >= required) {
      earned += 15;
      reasons.push(
        `${experience} years experience meets ${required}+ year requirement`
      );
    } else if (required > 0) {
      earned +=
        15 * Math.min(1, experience / required);
      missingRequirements.push(
        `Minimum ${required} years experience`
      );
    }
  }
  // Preferred skills — 10%
  if (job.preferredSkills?.length) {
    possible += 10;
    const preferredMatched =
      job.preferredSkills.filter(skill =>
        skillMatches(candidateSkills, skill) ||
        containsValue(candidate.resumeText, skill)
      );
    earned +=
      10 *
      (preferredMatched.length /
        job.preferredSkills.length);
    if (preferredMatched.length) {
      reasons.push(
        `Preferred skills: ${preferredMatched.join(", ")}`
      );
    }
  }
  // Industry — 5%
  if (job.industry) {
    possible += 5;
    if (
      containsValue(candidate.industry, job.industry) ||
      containsValue(job.industry, candidate.industry)
    ) {
      earned += 5;
      reasons.push("Industry aligned");
    }
  }
  // Location — 3%
  if (job.location) {
    possible += 3;
    if (
      containsValue(candidate.location, job.location) ||
      containsValue(candidate.country, job.location) ||
      containsValue(job.location, candidate.location) ||
      containsValue(job.location, candidate.country)
    ) {
      earned += 3;
      reasons.push("Location aligned");
    }
  }
  // Education — 2%
  if (job.education) {
    possible += 2;
    if (
      containsValue(candidate.education, job.education) ||
      containsValue(candidate.degree, job.education) ||
      containsValue(candidate.resumeText, job.education)
    ) {
      earned += 2;
      reasons.push("Education aligned");
    }
  }
  const matchPercentage =
    possible > 0
      ? Math.round((earned / possible) * 100)
      : 0;
  return {
    matchPercentage,
    reasons,
    missingRequirements
  };
}
// ==========================================================
// ADMIN AUTHENTICATION
// ==========================================================

async function getDb() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("render.com")
      ? { rejectUnauthorized: false }
      : false,
  });
  db.on("error", (err) => {
    console.error("PostgreSQL connection error:", err.message);
  });


  await db.connect();
  return db;
}

function isProtectedDatabaseConfigured() {
  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
    return databaseUrl.hostname.toLowerCase().endsWith(".render.com")
      || databaseName.toLowerCase() === "recruitai_i3uj";
  } catch {
    return true;
  }
}

const PUBLIC_JOB_CACHE_MS = 5 * 60 * 1000;
const PUBLIC_REFRESH_WINDOW_MS = 60 * 1000;
const PUBLIC_JOB_LIMIT = 100;
const PUBLIC_ATS_BOARDS = [
  { provider: "GREENHOUSE", slug: "stripe" },
  { provider: "GREENHOUSE", slug: "cloudflare" },
  { provider: "LEVER", slug: "spotify" },
  { provider: "LEVER", slug: "palantir" },
  { provider: "ASHBY", slug: "ramp" },
  { provider: "ASHBY", slug: "notion" },
  { provider: "SMARTRECRUITERS", slug: "Experian" },
  { provider: "SMARTRECRUITERS", slug: "RedBull" },
];
let publicJobCache = null;
let publicJobRefresh = null;
const publicRefreshRequests = new Map();

function getPublicWorkplaceType(job) {
  const text = `${job.location || ""} ${job.employmentType || ""} ${job.description || ""}`.toLowerCase();
  if (/\bhybrid\b/.test(text)) return "HYBRID";
  if (/\b(remote|work from home|wfh|distributed)\b/.test(text)) return "REMOTE";
  if (/\b(on[ -]?site|in[ -]?office)\b/.test(text)) return "ON_SITE";
  return null;
}

function getPublicJobState(location) {
  const match = String(location || "").match(/\b([A-Z]{2})\b(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
  return match ? match[1] : null;
}

function publicLocation(location, country) {
  const value = String(location || "").replace(/\s+/g, " ").trim();
  if (!value || /\b(or|canada|germany|france|paris)\b/i.test(value) || /[|/]/.test(value)) {
    return country === "US" ? "United States" : "United Kingdom";
  }
  return value.slice(0, 140);
}

function cleanPublicDescription(value) {
  const plain = String(value || "").replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, " ").replace(/\s+/g, " ").trim();
  if (!plain) return null;
  const sentences = plain.split(/(?<=[.!?])\s+/).filter((sentence) => !/^(about|who we are|our mission|benefits|equal opportunity)/i.test(sentence));
  return sentences.slice(0, 2).join(" ").slice(0, 360) || null;
}

function publicIndustry(job) {
  const text = `${job.jobTitle || ""} ${job.industry || ""} ${job.providerDepartment || ""}`.toLowerCase();
  if (/software|developer|data|cloud|devops|cyber|it support|technology/.test(text)) return "Information Technology";
  if (/health|nurs|medical|clinical/.test(text)) return "Healthcare";
  if (/manufact|machin|production|assembly/.test(text)) return "Manufacturing";
  if (/construction|electrician|plumber|welder/.test(text)) return "Construction";
  if (/warehouse|logistics|forklift|supply chain/.test(text)) return "Warehouse & Logistics";
  if (/hospitality|hotel|restaurant/.test(text)) return "Hospitality";
  if (/retail|store/.test(text)) return "Retail";
  if (/finance|bank|account/.test(text)) return "Finance & Banking";
  if (/admin|office|human resources/.test(text)) return "Administration";
  if (/education|teacher|school/.test(text)) return "Education";
  if (/real estate|property/.test(text)) return "Real Estate";
  return null;
}

function publicEmploymentType(value) {
  const text = String(value || "").toLowerCase();
  if (/full[ -]?time/.test(text)) return "Full-Time";
  if (/part[ -]?time/.test(text)) return "Part-Time";
  if (/contract|fixed.term/.test(text)) return "Contract";
  if (/temporary|temp\b/.test(text)) return "Temporary";
  return null;
}

function toPublicJob(job) {
  return {
    companyName: job.companyName || "Employer not specified",
    jobTitle: job.jobTitle,
    country: job.country,
    location: publicLocation(job.location, job.country),
    city: null,
    state: getPublicJobState(job.location),
    description: cleanPublicDescription(job.description),
    employmentType: publicEmploymentType(job.employmentType),
    workplaceType: getPublicWorkplaceType(job),
    salary: job.salary || job.salaryText || null,
    postedAt: job.postedAt || null,
    sourceUrl: job.sourceUrl,
    category: job.category || "Unclassified",
    industry: publicIndustry(job),
  };
}

async function refreshPublicJobs() {
  const result = await discoverAtsJobs({
    country: "BOTH",
    boards: PUBLIC_ATS_BOARDS,
    onlyRequestedBoards: true,
  });
  const companies = new Map();
  const jobs = result.opportunities.map(toPublicJob).filter((job) => {
    const count = companies.get(job.companyName) || 0;
    if (count >= 3) return false;
    companies.set(job.companyName, count + 1);
    return true;
  }).slice(0, PUBLIC_JOB_LIMIT);
  publicJobCache = { jobs, refreshedAt: new Date().toISOString() };
  return publicJobCache;
}

async function getPublicJobs(forceRefresh) {
  const cacheIsFresh = publicJobCache && Date.now() - new Date(publicJobCache.refreshedAt).getTime() < PUBLIC_JOB_CACHE_MS;
  if (!forceRefresh && cacheIsFresh) return publicJobCache;
  if (!publicJobRefresh) {
    publicJobRefresh = refreshPublicJobs().finally(() => {
      publicJobRefresh = null;
    });
  }
  return publicJobRefresh;
}

app.get("/api/jobs", async (req, res) => {
  const forceRefresh = req.query.refresh === "1";
  const requestKey = req.ip || "unknown";
  if (forceRefresh) {
    const lastRequest = publicRefreshRequests.get(requestKey) || 0;
    if (Date.now() - lastRequest < PUBLIC_REFRESH_WINDOW_MS) {
      return res.status(429).json({ success: false, error: "Please wait one minute before refreshing vacancies again." });
    }
    publicRefreshRequests.set(requestKey, Date.now());
  }

  try {
    const listing = await getPublicJobs(forceRefresh);
    res.set("Cache-Control", "public, max-age=60");
    return res.json({
      jobs: listing.jobs,
      refreshedAt: listing.refreshedAt,
      cached: !forceRefresh && Date.now() - new Date(listing.refreshedAt).getTime() < PUBLIC_JOB_CACHE_MS,
      notice: "These are third-party employer postings from public ATS job boards, not confirmed Fusion Staffing Solutions client openings.",
    });
  } catch (error) {
    console.error("Public ATS job listing request failed:", error);
    if (publicJobCache) {
      return res.json({
        jobs: publicJobCache.jobs,
        refreshedAt: publicJobCache.refreshedAt,
        cached: true,
        stale: true,
        notice: "These are third-party employer postings from public ATS job boards, not confirmed Fusion Staffing Solutions client openings.",
      });
    }
    return res.status(503).json({
      success: false,
      error: "Current public ATS vacancies are temporarily unavailable. Please try again shortly.",
    });
  }
});

// Create AdminUser table if it does not already exist
async function ensureAdminTable() {
  let db;

  try {
    db = await getDb();

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

    console.log("AdminUser table ready.");
  } catch (error) {
    console.error("ADMIN TABLE SETUP ERROR:", error);
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
}

ensureAdminTable();

function createAdminToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
      jwtid: randomUUID(),
    }
  );
}

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_session;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    if (isSessionRevoked(req.admin.jti)) {
      return res.status(401).json({
        success: false,
        error: "Session has been logged out.",
      });
    }
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid.",
    });
  }
}

app.use("/api/public-jobs", createPublicJobsRouter({ getDb, requireAdmin, requireRole: requireRoles }));

app.use(
  "/api/admin/bdm",
  createBdmRouter({ getDb, requireAdmin, requireRole: requireRoles(["ADMIN", "BDM"]) })
);

// Current requireAdmin authenticates the session but does not provide
// complete role-based authorization for BDM/RA/recruiter workflows.
// Front-end menu visibility is not a security boundary.
app.use(
  "/api/admin/ra",
  createRaRouter({ getDb, requireAdmin, requireRole: requireRoles(["ADMIN", "RA"]) })
);
app.use(
  "/api/admin/recruitment",
  createRecruitmentRouter({ getDb, requireAdmin, requireRole: requireRoles })
);

// ADMIN / RECRUITER SIGN UP
app.post("/api/admin/signup", async (req, res) => {
  let db;

  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    console.log("SIGNUP EMAIL RECEIVED:", email);

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters.",
      });
    }

    db = await getDb();

    const existing = await db.query(
      `SELECT "id" FROM "AdminUser" WHERE LOWER("email") = LOWER($1) LIMIT 1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
      INSERT INTO "AdminUser"
        ("id", "name", "email", "passwordHash", "role", "isActive")
      VALUES
        (gen_random_uuid()::text, $1, $2, $3, 'RECRUITER', TRUE)
      RETURNING "id", "name", "email", "role"
      `,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("ADMIN SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to create account.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});

// REAL ADMIN LOGIN
app.post("/api/admin/login", async (req, res) => {
  let db;

  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    db = await getDb();

    const result = await db.query(
      `
        SELECT
          "id",
          "name",
          "email",
          "passwordHash",
          "role",
          "isActive"
        FROM "AdminUser"
        WHERE LOWER("email") = LOWER($1)
        LIMIT 1
      `,
      [email]
    );

    const admin = result.rows[0];

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const token = createAdminToken(admin);

    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to sign in.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});

// CHECK CURRENT ADMIN SESSION
app.get("/api/admin/me", requireAdmin, async (req, res) => {
  let db;

  try {
    db = await getDb();

    const result = await db.query(
      `
        SELECT "id", "name", "email", "role", "isActive"
        FROM "AdminUser"
        WHERE "id" = $1
        LIMIT 1
      `,
      [req.admin.id]
    );

    const admin = result.rows[0];

    if (!admin || !admin.isActive) {
      res.clearCookie("admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res.status(401).json({
        success: false,
        error: "Administrator account unavailable.",
      });
    }

    return res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("ADMIN SESSION ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to verify session.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});

app.get("/api/admin/session", requireAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    success: true,
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// REAL ADMIN LOGOUT
app.post("/api/admin/logout", (req, res) => {
  const token = req.cookies.admin_session;
  if (token && process.env.JWT_SECRET) {
    try {
      const session = jwt.verify(token, process.env.JWT_SECRET);
      revokeSession(session.jti, session.exp * 1000);
    } catch {
      // Expired or invalid tokens are still cleared from the browser.
    }
  }
  res.clearCookie("admin_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "RecruitAI AI API running"
  });
});
// MAIN AI MATCH ENDPOINT
app.post("/api/match", async (req, res) => {
  const jd = req.body.jd;
  if (!jd || jd.trim().length < 20) {
    return res.status(400).json({
      error: "Please provide a valid job description."
    });
  }
  let db;
  try {
    console.log("AI is understanding JD...");
    const job =
      await extractJobRequirements(jd);
    console.log("AI extracted:", job);
    db = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await db.connect();
    const result = await db.query(`
      SELECT *
      FROM "Candidate"
    `);
    const matches = result.rows
      .map(candidate => {
        const score =
          calculateMatch(candidate, job);
        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          currentTitle: candidate.currentTitle,
          currentCompany: candidate.currentCompany,
          industry: candidate.industry,
          experienceYears: candidate.experienceYears,
          location: candidate.location,
          country: candidate.country,
          skills: candidate.skills,
          summary: candidate.summary,
          matchPercentage:
            score.matchPercentage,
          matchReasons:
            score.reasons,
          missingRequirements:
            score.missingRequirements
        };
      })
      // Return ALL genuinely relevant candidates.
      // Not a fixed top-10.
      .filter(candidate =>
        candidate.matchPercentage >= 35
      )
      .sort((a, b) =>
        b.matchPercentage -
        a.matchPercentage
      );
    res.json({
      aiExtractedJob: job,
      totalCandidatesSearched:
        result.rows.length,
      totalRelevantCandidates:
        matches.length,
      candidates:
        matches
    });
  } catch (error) {
    console.error("MATCH ERROR:", error);
    res.status(500).json({
      error: "AI candidate matching failed.",
      details: error.message
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});
app.post("/api/generate-outreach", async (req, res) => {
  const { jd, candidate } = req.body;
  if (!jd || !candidate) {
    return res.status(400).json({
      error: "Job description and candidate are required.",
    });
  }
  try {
    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: [
        {
          role: "system",
          content: `
You write professional recruitment outreach emails.
Write a short personalized email inviting a candidate to discuss a job opportunity.
Rules:
- Use only information supplied about the candidate and job.
- Do not invent salary, benefits, company details, or candidate experience.
- Keep the email professional and concise.
- Mention why the candidate appears relevant.
- Ask whether they are interested in discussing the opportunity.
- Do not make a hiring decision or guarantee suitability.
Return valid JSON only:
{
  "subject": "",
  "body": ""
}
          `,
        },
        {
          role: "user",
          content: JSON.stringify({
            jobDescription: jd,
            candidate: {
              name: candidate.name,
              currentTitle: candidate.currentTitle,
              currentCompany: candidate.currentCompany,
              experienceYears: candidate.experienceYears,
              location: candidate.location,
              skills: candidate.skills,
              matchReasons: candidate.matchReasons,
            },
          }),
        },  
      ],
    });
    let text = response.output_text
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
    const outreach = JSON.parse(text);
    res.json({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      subject: outreach.subject,
      body: outreach.body,
      status: "DRAFT",
    });
  } catch (error) {
    console.error("OUTREACH ERROR:", error);
    res.status(500).json({
      error: "Failed to generate outreach email.",
      details: error.message,
    });
  }
});
// ==========================================================
// ADMIN - GET EMPLOYER ENQUIRIES
// ==========================================================

app.get("/api/admin/enquiries", requireAdmin, async (req, res) => {
  let db;

  try {
    db = await getDb();

    const result = await db.query(`
      SELECT
        "id",
        "name",
        "company",
        "email",
        "country",
        "countryCode",
        "phone",
        "enquiryType",
        "message",
        "status",
        "source",
        "createdAt",
        "updatedAt"
      FROM "ContactEnquiry"
      ORDER BY "createdAt" DESC
    `);

    return res.json({
      success: true,
      total: result.rows.length,
      enquiries: result.rows,
    });
  } catch (error) {
    console.error("GET ADMIN ENQUIRIES ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to load employer enquiries.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});

// ==========================================================
// ADMIN - SECURE CANDIDATE CV VIEW / DOWNLOAD
// ==========================================================

app.get(
  "/api/admin/candidates/:id/resume",
  requireAdmin,
  async (req, res) => {
    let db;

    try {
      const mode =
        req.query.mode === "download" ? "download" : "view";

      db = await getDb();

      const result = await db.query(
        `
        SELECT
          "resumeFileName",
          "resumeFileUrl",
          "resumeMimeType"
        FROM "Candidate"
        WHERE "id" = $1
        LIMIT 1
        `,
        [req.params.id]
      );

      const candidate = result.rows[0];

      if (!candidate || !candidate.resumeFileUrl) {
        return res.status(404).json({
          success: false,
          error: "Candidate CV not found.",
        });
      }

      const object = await r2.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: candidate.resumeFileUrl,
        })
      );

      const fileName =
        candidate.resumeFileName || "candidate-cv";

      res.setHeader(
        "Content-Type",
        candidate.resumeMimeType ||
          object.ContentType ||
          "application/octet-stream"
      );

      res.setHeader(
        "Content-Disposition",
        `${mode === "download" ? "attachment" : "inline"}; filename="${fileName.replace(/"/g, "")}"`
      );

      if (!object.Body) {
        return res.status(404).json({
          success: false,
          error: "CV file is unavailable.",
        });
      }

      object.Body.pipe(res);
    } catch (error) {
      console.error("ADMIN CV ACCESS ERROR:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: "Unable to access candidate CV.",
        });
      }

      res.end();
    } finally {
      if (db) {
        await db.end().catch(() => {});
      }
    }
  }
);

// ADMIN - GET ALL CANDIDATES
app.get("/api/admin/candidates", requireAdmin, async (req, res) => {
  let db;

  try {
    db = await getDb();

    const result = await db.query(`
      SELECT
        "id",
        "name",
        "email",
        "phone",
        "location",
        "country",
        "currentTitle",
        "currentCompany",
        "industry",
        "experienceYears",
        "education",
        "degree",
        "specialization",
        "skills",
        "preferredRoles",
        "preferredLocations",
        "workPreference",
        "employmentType",
        "resumeFileName",
        "resumeMimeType",
        "source",
        "createdAt",
        "updatedAt"
      FROM "Candidate"
      ORDER BY "createdAt" DESC
    `);

    res.json({
      success: true,
      total: result.rows.length,
      candidates: result.rows,
    });
  } catch (error) {
    console.error("GET ADMIN CANDIDATES ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Unable to load candidates.",
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});
// ==========================================================
// ADMIN - MANUAL CANDIDATE / CV UPLOAD
// ==========================================================

app.post(
  "/api/admin/candidates",
  requireAdmin,
  upload.single("resume"),
  async (req, res) => {
    let db;
    let resumeKey = null;
    let registrationStage = "validating request";
try {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const phone = String(req.body.phone || "").trim();

      // Name + CV are required.
      // Email and phone are optional.
      if (!name || !req.file) {
        return res.status(400).json({
          success: false,
          error: "Candidate name and CV are required.",
        });
      }

      // ------------------------------------------------------
      // 1. Upload CV to private Cloudflare R2
      // ------------------------------------------------------

      const extension = path
        .extname(req.file.originalname)
        .toLowerCase();

      resumeKey =
        `resumes/${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${extension}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: resumeKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // ------------------------------------------------------
      // 2. Save candidate metadata in PostgreSQL
      // ------------------------------------------------------

      db = await getDb();

      const result = await db.query(
        `
        INSERT INTO "Candidate" (
          "id",
          "name",
          "email",
          "phone",
          "skills",
          "preferredRoles",
          "preferredLocations",
          "resumeFileName",
          "resumeFileUrl",
          "resumeMimeType",
          "source",
          "recruitmentConsent",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid()::text,
          $1,
          $2,
          $3,
          ARRAY[]::TEXT[],
          ARRAY[]::TEXT[],
          ARRAY[]::TEXT[],
          $4,
          $5,
          $6,
          'MANUAL_UPLOAD',
          FALSE,
          NOW()
        )
        RETURNING
          "id",
          "name",
          "email",
          "phone",
          "resumeFileName",
          "source",
          "createdAt"
        `,
        [
          name,
          email || null,
          phone || null,
          req.file.originalname,
          resumeKey,
          req.file.mimetype,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Candidate CV uploaded successfully.",
        candidate: result.rows[0],
      });
    } catch (error) {
      console.error("ADMIN CANDIDATE UPLOAD ERROR:", error);

      // If DB insert fails after R2 upload,
      // remove the orphaned CV from R2.
      if (resumeKey) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: resumeKey,
            })
          );
        } catch (cleanupError) {
          console.error(
            "ADMIN CV CLEANUP ERROR:",
            cleanupError
          );
        }
      }

      // Candidate.email is unique in the current database.
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          error:
            "A candidate with this email address already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Unable to upload candidate.",
        details: error.message,
      });
    } finally {
      if (db) {
        await db.end().catch(() => {});
      }
    }
  }
);

// REAL CANDIDATE REGISTRATION
// REAL CANDIDATE REGISTRATION
app.post(
  "/api/candidates/register",
  upload.single("resume"),
  async (req, res) => {
    let db;
    let resumeKey = null;
    let registrationStage = "validating request";

    try {
   


const {
  name,
  email,
  phone,
  country,
  postcode,
  location,
  currentTitle,
  industry,
  experienceYears,
  skills,
  preferredRoles,
  preferredLocations,
  workPreference,
  employmentType,
  recruitmentConsent,
} = req.body;

// Validate required fields
      if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !req.file ||
        recruitmentConsent !== "true"
      ) {
        return res.status(400).json({
          error:
            "Name, email, phone, resume and recruitment consent are required.",
        });
      }

      // Upload candidate CV to private Cloudflare R2
      const extension = path.extname(req.file.originalname).toLowerCase();

      resumeKey =
        `resumes/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

      registrationStage = "uploading CV to R2";

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: resumeKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // Prepare candidate data
      const skillList = skills
        ? skills.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      const roleList = preferredRoles
        ? preferredRoles.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      const locationList = preferredLocations
        ? preferredLocations.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      // Connect using the existing database helper
      registrationStage = "connecting to PostgreSQL";
      db = await getDb();

      // Insert candidate into PostgreSQL
      registrationStage = "inserting candidate into PostgreSQL";

      const result = await db.query(
        `
        INSERT INTO "Candidate" (
          "id",
          "name",
          "email",
          "phone",
          "country",
          "location",
          "currentTitle",
          "industry",
          "experienceYears",
          "skills",
          "preferredRoles",
          "preferredLocations",
          "workPreference",
          "employmentType",
          "resumeFileName",
          "resumeFileUrl",
          "resumeMimeType",
          "source",
          "recruitmentConsent",
          "consentedAt",
          "privacyVersion",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid()::text,
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16,
          'TALENT_NETWORK',
          TRUE,
          NOW(),
          '1.0',
          NOW()
        )
        RETURNING
          "id",
          "name",
          "email",
          "source",
          "createdAt"
        `,
        [
          name.trim(),
          email.trim().toLowerCase(),
          phone.trim(),
          country?.trim() || null,
          location?.trim() || null,
          currentTitle?.trim() || null,
          industry?.trim() || null,
          experienceYears ? Number(experienceYears) : null,
          skillList,
          roleList,
          locationList,
          workPreference?.trim() || null,
          employmentType?.trim() || null,
          req.file.originalname,
          resumeKey,
          req.file.mimetype,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Candidate registration completed successfully.",
        candidate: result.rows[0],
      });
    } catch (error) {
      console.error("CANDIDATE REGISTRATION ERROR:", {
        stage: registrationStage,
        code: error.code,
        message: error.message,
      });

      // Remove uploaded CV if registration fails
      if (resumeKey) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: resumeKey,
            })
          );
        } catch (cleanupError) {
          console.error(
            "R2 CV CLEANUP ERROR:",
            cleanupError.message
          );
        }
      }

      if (error.code === "23505") {
        return res.status(409).json({
          error: "A candidate with this email address already exists.",
        });
      }

      return res.status(500).json({
        error: "Candidate registration failed.",
        details: error.message,
      });
    } finally {
      if (db) {
        await db.end().catch(() => {});
      }
    }
  }
);
// CONTACT / EMPLOYER ENQUIRY
// CONTACT / EMPLOYER ENQUIRY
app.post("/api/contact",
  async (req, res) => {
  let db;
  let resumeKey = null;
  try {
    const {
      name,
      company,
      email,
      country,
      countryCode,
      phone,
      enquiryType,
      message,
    } = req.body;
    // Required contact-form fields
    if (
      !name?.trim() ||
      !email?.trim() ||
      !country?.trim() ||
      !enquiryType?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Name, email, country, enquiry type and message are required.",
      });
    }
    db = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await db.connect();
    await db.query(`
      CREATE TABLE IF NOT EXISTS "ContactEnquiry" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "company" TEXT,
        "email" TEXT NOT NULL,
        "country" TEXT,
        "countryCode" TEXT,
        "phone" TEXT,
        "enquiryType" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "source" TEXT NOT NULL DEFAULT 'WEBSITE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Add new columns if ContactEnquiry already existed
    await db.query(`
      ALTER TABLE "ContactEnquiry"
      ADD COLUMN IF NOT EXISTS "country" TEXT
    `);
    await db.query(`
      ALTER TABLE "ContactEnquiry"
      ADD COLUMN IF NOT EXISTS "countryCode" TEXT
    `);
    const result = await db.query(
      `
      INSERT INTO "ContactEnquiry" (
        "id",
        "name",
        "company",
        "email",
        "country",
        "countryCode",
        "phone",
        "enquiryType",
        "message",
        "status",
        "source",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'NEW',
        'WEBSITE',
        NOW(),
        NOW()
      )
      RETURNING
        "id",
        "name",
        "company",
        "email",
        "country",
        "phone",
        "enquiryType",
        "status",
        "createdAt"
      `,
      [
        name.trim(),
        company?.trim() || null,
        email.trim().toLowerCase(),
      country?.trim() || null,
        countryCode?.trim() || null,
        phone?.trim() || null,
        enquiryType.trim(),
        message.trim(),
      ]
    );
    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry: result.rows[0],
    });
  } catch (error) {
    console.error("CONTACT ENQUIRY ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to submit enquiry.",
      details: error.message,
    });
  } finally {
    if (db) {
      await db.end().catch(() => {});
    }
  }
});
// GMAIL EMAIL SENDER
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "To, subject and body are required.",
      });
    }
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: body,
    });
    console.log("EMAIL SENT:", info.messageId);
    res.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(
    `RecruitAI AI API running on http://localhost:${PORT}`
  );
});
