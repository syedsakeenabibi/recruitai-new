CREATE TABLE "CompanyLead" (
  "id" TEXT NOT NULL,
  "companyName" VARCHAR(200),
  "companyWebsite" TEXT,
  "country" VARCHAR(120),
  "location" VARCHAR(200),
  "industry" VARCHAR(160),
  "source" VARCHAR(80),
  "sourceUrl" TEXT,
  "hiringSignal" TEXT,
  "contactName" VARCHAR(200),
  "contactTitle" VARCHAR(160),
  "contactEmail" VARCHAR(320),
  "contactLinkedInUrl" TEXT,
  "contactSource" VARCHAR(120),
  "status" VARCHAR(32) NOT NULL DEFAULT 'TARGET',
  "notes" TEXT,
  "campaignId" TEXT,
  "opportunityId" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyLead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompanyLead_status_check" CHECK ("status" IN (
    'TARGET', 'CONTACTED', 'RESPONDED', 'INTERESTED',
    'REQUIREMENT_CONFIRMED', 'HANDED_TO_RECRUITER', 'CLOSED', 'LOST'
  )),
  CONSTRAINT "CompanyLead_campaignId_fkey" FOREIGN KEY ("campaignId")
    REFERENCES "BDMCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CompanyLead_opportunityId_fkey" FOREIGN KEY ("opportunityId")
    REFERENCES "JobOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CompanyLead_opportunityId_key"
  ON "CompanyLead" ("opportunityId") WHERE "opportunityId" IS NOT NULL;
CREATE INDEX "CompanyLead_status_updatedAt_idx"
  ON "CompanyLead" ("status", "updatedAt");
CREATE INDEX "CompanyLead_campaignId_idx"
  ON "CompanyLead" ("campaignId");

CREATE TABLE "ClientRequirement" (
  "id" TEXT NOT NULL,
  "companyLeadId" TEXT,
  "companyName" VARCHAR(200),
  "jobTitle" VARCHAR(200) NOT NULL,
  "jobDescription" TEXT,
  "education" TEXT,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "experienceMin" DOUBLE PRECISION,
  "experienceMax" DOUBLE PRECISION,
  "country" VARCHAR(120),
  "location" VARCHAR(200),
  "employmentType" VARCHAR(80),
  "salaryMin" DOUBLE PRECISION,
  "salaryMax" DOUBLE PRECISION,
  "currency" VARCHAR(8),
  "openings" INTEGER NOT NULL DEFAULT 1,
  "workMode" VARCHAR(40),
  "noticePeriodPreference" VARCHAR(120),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "bdmOwner" TEXT,
  "assignedRecruiter" TEXT,
  "status" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientRequirement_status_check" CHECK ("status" IN (
    'DRAFT', 'CONFIRMED', 'ASSIGNED', 'SOURCING', 'SUBMITTED',
    'INTERVIEW', 'OFFER', 'PLACED', 'CLOSED', 'CANCELLED'
  )),
  CONSTRAINT "ClientRequirement_experience_check" CHECK (
    ("experienceMin" IS NULL OR "experienceMin" >= 0) AND
    ("experienceMax" IS NULL OR "experienceMax" >= 0) AND
    ("experienceMin" IS NULL OR "experienceMax" IS NULL OR "experienceMin" <= "experienceMax")
  ),
  CONSTRAINT "ClientRequirement_salary_check" CHECK (
    ("salaryMin" IS NULL OR "salaryMin" >= 0) AND
    ("salaryMax" IS NULL OR "salaryMax" >= 0) AND
    ("salaryMin" IS NULL OR "salaryMax" IS NULL OR "salaryMin" <= "salaryMax")
  ),
  CONSTRAINT "ClientRequirement_openings_check" CHECK ("openings" > 0),
  CONSTRAINT "ClientRequirement_priority_check" CHECK ("priority" >= 0),
  CONSTRAINT "ClientRequirement_companyLeadId_fkey" FOREIGN KEY ("companyLeadId")
    REFERENCES "CompanyLead"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ClientRequirement_status_updatedAt_idx"
  ON "ClientRequirement" ("status", "updatedAt");
CREATE INDEX "ClientRequirement_assignedRecruiter_status_idx"
  ON "ClientRequirement" ("assignedRecruiter", "status");

CREATE TABLE "RequirementShortlist" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'SHORTLISTED',
  "outreachStatus" VARCHAR(24) NOT NULL DEFAULT 'NOT_CONTACTED',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequirementShortlist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RequirementShortlist_status_check" CHECK ("status" IN (
    'SHORTLISTED', 'ON_HOLD', 'REMOVED'
  )),
  CONSTRAINT "RequirementShortlist_outreachStatus_check" CHECK ("outreachStatus" IN (
    'NOT_CONTACTED', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'DECLINED'
  )),
  CONSTRAINT "RequirementShortlist_requirementId_fkey" FOREIGN KEY ("requirementId")
    REFERENCES "ClientRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RequirementShortlist_candidateId_fkey" FOREIGN KEY ("candidateId")
    REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RequirementShortlist_requirement_candidate_key" UNIQUE ("requirementId", "candidateId")
);
CREATE INDEX "RequirementShortlist_candidateId_idx"
  ON "RequirementShortlist" ("candidateId");

CREATE TABLE "CandidateSubmission" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "submittedBy" TEXT,
  "submittedAt" TIMESTAMP(3),
  "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
  "clientFeedback" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CandidateSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CandidateSubmission_status_check" CHECK ("status" IN (
    'DRAFT', 'APPROVED', 'SUBMITTED', 'SHORTLISTED', 'REJECTED',
    'INTERVIEW', 'OFFER', 'PLACED'
  )),
  CONSTRAINT "CandidateSubmission_candidateId_fkey" FOREIGN KEY ("candidateId")
    REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CandidateSubmission_requirementId_fkey" FOREIGN KEY ("requirementId")
    REFERENCES "ClientRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CandidateSubmission_requirementId_status_idx"
  ON "CandidateSubmission" ("requirementId", "status");
CREATE INDEX "CandidateSubmission_candidateId_idx"
  ON "CandidateSubmission" ("candidateId");

CREATE TABLE "RecruitmentInterview" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "companyName" VARCHAR(200),
  "round" VARCHAR(120),
  "scheduledAt" TIMESTAMP(3),
  "timezone" VARCHAR(80),
  "mode" VARCHAR(40),
  "meetingLocation" TEXT,
  "status" VARCHAR(24) NOT NULL DEFAULT 'SCHEDULED',
  "candidateFeedback" TEXT,
  "clientFeedback" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentInterview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecruitmentInterview_status_check" CHECK ("status" IN (
    'SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'PASSED', 'REJECTED'
  )),
  CONSTRAINT "RecruitmentInterview_candidateId_fkey" FOREIGN KEY ("candidateId")
    REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecruitmentInterview_requirementId_fkey" FOREIGN KEY ("requirementId")
    REFERENCES "ClientRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RecruitmentInterview_scheduledAt_status_idx"
  ON "RecruitmentInterview" ("scheduledAt", "status");

CREATE TABLE "RecruitmentPlacement" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "companyName" VARCHAR(200),
  "offeredSalary" DOUBLE PRECISION,
  "currency" VARCHAR(8),
  "offerDate" TIMESTAMP(3),
  "expectedJoiningDate" TIMESTAMP(3),
  "actualJoiningDate" TIMESTAMP(3),
  "status" VARCHAR(24) NOT NULL DEFAULT 'OFFER_PENDING',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentPlacement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecruitmentPlacement_status_check" CHECK ("status" IN (
    'OFFER_PENDING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'JOINED', 'NO_SHOW', 'PLACED'
  )),
  CONSTRAINT "RecruitmentPlacement_offeredSalary_check" CHECK (
    "offeredSalary" IS NULL OR "offeredSalary" >= 0
  ),
  CONSTRAINT "RecruitmentPlacement_candidateId_fkey" FOREIGN KEY ("candidateId")
    REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecruitmentPlacement_requirementId_fkey" FOREIGN KEY ("requirementId")
    REFERENCES "ClientRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RecruitmentPlacement_status_updatedAt_idx"
  ON "RecruitmentPlacement" ("status", "updatedAt");
