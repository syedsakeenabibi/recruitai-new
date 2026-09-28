-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "country" TEXT,
    "currentTitle" TEXT,
    "currentCompany" TEXT,
    "industry" TEXT,
    "experienceYears" DOUBLE PRECISION,
    "education" TEXT,
    "degree" TEXT,
    "specialization" TEXT,
    "skills" TEXT[],
    "previousRoles" JSONB,
    "summary" TEXT,
    "resumeText" TEXT,
    "expectedSalary" DOUBLE PRECISION,
    "noticeDays" INTEGER,
    "availability" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SYNTHETIC',
    "sourceProfileId" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "rawJd" TEXT NOT NULL,
    "title" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "minimumExperience" DOUBLE PRECISION,
    "requiredSkills" TEXT[],
    "preferredSkills" TEXT[],
    "education" TEXT,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateResponse" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "classification" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateResponse" ADD CONSTRAINT "CandidateResponse_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "Outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
