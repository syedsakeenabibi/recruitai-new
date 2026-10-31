CREATE TABLE "RASavedSearch" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "filters" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "discoveredCount" INTEGER NOT NULL DEFAULT 0,
  "newlySavedCount" INTEGER NOT NULL DEFAULT 0,
  "alreadySavedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RASavedSearch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RASavedSearch_counts_check" CHECK (
    "discoveredCount" >= 0 AND
    "newlySavedCount" >= 0 AND
    "alreadySavedCount" >= 0 AND
    "failedCount" >= 0
  )
);

CREATE INDEX "RASavedSearch_createdAt_idx"
  ON "RASavedSearch" ("createdAt" DESC);

CREATE TABLE "RASavedSearchOpportunity" (
  "id" TEXT NOT NULL,
  "savedSearchId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RASavedSearchOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RASavedSearchOpportunity_savedSearchId_fkey"
    FOREIGN KEY ("savedSearchId")
    REFERENCES "RASavedSearch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RASavedSearchOpportunity_opportunityId_fkey"
    FOREIGN KEY ("opportunityId")
    REFERENCES "JobOpportunity"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RASavedSearchOpportunity_unique"
    UNIQUE ("savedSearchId", "opportunityId")
);

CREATE INDEX "RASavedSearchOpportunity_opportunityId_idx"
  ON "RASavedSearchOpportunity" ("opportunityId");
CREATE INDEX "RASavedSearchOpportunity_savedSearchId_idx"
  ON "RASavedSearchOpportunity" ("savedSearchId");
