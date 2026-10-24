CREATE TABLE "BDMCampaign" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "industries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "locations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "employmentTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "experienceMin" DOUBLE PRECISION,
  "experienceMax" DOUBLE PRECISION,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BDMCampaign_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BDMCampaign_country_check" CHECK ("country" IN ('US', 'UK')),
  CONSTRAINT "BDMCampaign_status_check" CHECK ("status" IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED')),
  CONSTRAINT "BDMCampaign_priority_check" CHECK ("priority" >= 0),
  CONSTRAINT "BDMCampaign_experience_min_check" CHECK ("experienceMin" IS NULL OR "experienceMin" >= 0),
  CONSTRAINT "BDMCampaign_experience_max_check" CHECK ("experienceMax" IS NULL OR "experienceMax" >= 0),
  CONSTRAINT "BDMCampaign_experience_range_check" CHECK (
    "experienceMin" IS NULL OR "experienceMax" IS NULL OR "experienceMin" <= "experienceMax"
  )
);

CREATE INDEX "BDMCampaign_country_status_idx"
  ON "BDMCampaign" ("country", "status");
CREATE INDEX "BDMCampaign_updatedAt_idx"
  ON "BDMCampaign" ("updatedAt");

CREATE TABLE "JobOpportunity" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "source" VARCHAR(16) NOT NULL DEFAULT 'MANUAL',
  "externalId" VARCHAR(200),
  "sourceUrl" TEXT,
  "companyName" VARCHAR(200),
  "companyWebsite" TEXT,
  "jobTitle" VARCHAR(200) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "location" VARCHAR(200),
  "description" TEXT,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "employmentType" VARCHAR(80),
  "postedAt" TIMESTAMP(3),
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(16) NOT NULL DEFAULT 'NEW',
  "rawData" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobOpportunity_source_check" CHECK ("source" = 'MANUAL'),
  CONSTRAINT "JobOpportunity_country_check" CHECK ("country" IN ('US', 'UK')),
  CONSTRAINT "JobOpportunity_status_check" CHECK ("status" IN ('NEW', 'REVIEWED', 'LEAD_CREATED', 'IGNORED')),
  CONSTRAINT "JobOpportunity_campaignId_fkey" FOREIGN KEY ("campaignId")
    REFERENCES "BDMCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "JobOpportunity_campaignId_idx"
  ON "JobOpportunity" ("campaignId");
CREATE INDEX "JobOpportunity_status_discoveredAt_idx"
  ON "JobOpportunity" ("status", "discoveredAt");
CREATE INDEX "JobOpportunity_country_idx"
  ON "JobOpportunity" ("country");
