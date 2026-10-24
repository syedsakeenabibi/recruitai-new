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
  "status" TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK ("status" IN ('DRAFT','PUBLISHED','CLOSED')),
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "PublicJob_status_publishedAt_idx"
ON "PublicJob" ("status", "publishedAt" DESC);
