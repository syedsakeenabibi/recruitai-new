
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client } = require("pg");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = 4000;
// PRIVATE CV STORAGE - LOCAL DEVELOPMENT
const uploadsDir = path.join(__dirname, "private_uploads", "resumes");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname).toLowerCase()}`;

    cb(null, safeName);
  },
});

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
// REAL CANDIDATE REGISTRATION
app.post(
  "/api/candidates/register",
  upload.single("resume"),
  async (req, res) => {
    let db;

    try {
      const {
        name,
        email,
        phone,
        country,
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

      // Required fields
      // Required fields
if (
  !name?.trim() ||
  !email?.trim() ||
  !phone?.trim() ||
  !req.file ||
  recruitmentConsent !== "true"
) {
        // Remove uploaded file if registration fails
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
         error:
  "Name, email, country, current job title, resume and recruitment consent are required.",
        });
      }

      const skillList = skills
        ? skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const roleList = preferredRoles
        ? preferredRoles
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const locationList = preferredLocations
        ? preferredLocations
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      db = new Client({
        connectionString: process.env.DATABASE_URL,
      });

      await db.connect();

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
          phone?.trim() || null,
          country.trim(),
          location?.trim() || null,
          currentTitle.trim(),
          industry?.trim() || null,
          experienceYears ? Number(experienceYears) : null,
          skillList,
          roleList,
          locationList,
          workPreference?.trim() || null,
          employmentType?.trim() || null,
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Candidate registration completed successfully.",
        candidate: result.rows[0],
      });
    } catch (error) {
      console.error("CANDIDATE REGISTRATION ERROR:", error);

      // Remove CV if database insertion fails
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }

      if (error.code === "23505") {
        return res.status(409).json({
          error: "A candidate with this email address already exists.",
        });
      }

      res.status(500).json({
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

app.post("/api/contact", async (req, res) => {
  let db;

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
        country.trim(),
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