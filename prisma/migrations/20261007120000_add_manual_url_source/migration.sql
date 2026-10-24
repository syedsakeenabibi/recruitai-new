ALTER TABLE "JobOpportunity"
  DROP CONSTRAINT IF EXISTS "JobOpportunity_source_check";

ALTER TABLE "JobOpportunity"
  ADD CONSTRAINT "JobOpportunity_source_check"
  CHECK ("source" IN ('MANUAL', 'MANUAL_URL'));
