-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "preferredLocations" TEXT[],
ADD COLUMN     "preferredRoles" TEXT[],
ADD COLUMN     "privacyVersion" TEXT,
ADD COLUMN     "recruitmentConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resumeFileName" TEXT,
ADD COLUMN     "resumeFileUrl" TEXT,
ADD COLUMN     "resumeMimeType" TEXT,
ADD COLUMN     "workPreference" TEXT;
