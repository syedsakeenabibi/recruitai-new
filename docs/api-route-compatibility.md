# API route compatibility

Existing routes were not renamed, removed, or rewritten. The recruitment API remains additive. The public ATS endpoints and local RA-to-BDM service path were also exercised against the isolated local database; authenticated browser access still requires an administrator session.

## Existing routes retained

| Method | Path |
| --- | --- |
| POST | `/api/admin/signup` |
| POST | `/api/admin/login` |
| GET | `/api/admin/me` |
| POST | `/api/admin/logout` |
| GET | `/` |
| POST | `/api/match` |
| POST | `/api/generate-outreach` |
| GET | `/api/admin/enquiries` |
| GET | `/api/admin/candidates/:id/resume` |
| GET | `/api/admin/candidates` |
| POST | `/api/admin/candidates` |
| POST | `/api/candidates/register` |
| POST | `/api/contact` |
| POST | `/api/send-email` |
| GET, POST, PATCH, DELETE | `/api/admin/bdm/campaigns` |
| GET, PATCH, DELETE | `/api/admin/bdm/campaigns/:id` |
| GET, POST, PATCH, DELETE | `/api/admin/bdm/opportunities` |
| GET, PATCH, DELETE | `/api/admin/bdm/opportunities/:id` |
| POST | `/api/admin/ra/discover` |
| GET | `/api/admin/ra/opportunities` |
| POST | `/api/admin/ra/import-url` |
| GET | `/api/admin/ra/sources` |
| POST | `/api/admin/ra/discover-live` |
| POST | `/api/admin/ra/save-live` |

The candidate registration, admin candidate/CV, employer enquiry, login/session, BDM, and RA route handlers remain unchanged. The new server integration only imports and mounts the additional router.

## Public ATS discovery

The new authenticated RA routes connect to public Greenhouse Job Board, Lever Postings, and Ashby Job Posting APIs. Configured boards are queried server-side; each request returns per-board connection status and provider errors. Results are deduplicated by normalized original URL, country is limited to verified US/UK location signals, and categories are inferred from job titles only. Unclassified roles are excluded from category-filtered searches. Posting dates and compensation are shown only when supplied by the provider.

Saved ATS vacancies are re-verified against their provider before persistence. To preserve the existing database source constraint, the existing `MANUAL_URL` source value is retained and the real provider name, board, and external job ID are recorded in `rawData`; no migration or source-constraint change is needed.

LinkedIn, Indeed, Glassdoor, ZipRecruiter, Reed, Totaljobs, and social-media sources are not represented as connected APIs; they are labeled as requiring authorization. Direct employer links continue to use the existing manual URL import route.

RA can send a saved vacancy to the existing BDM company-lead workflow. Such a lead starts as a target, contains no invented contact details, and is not a confirmed staffing requirement. BDM can prepare and edit a draft, then record human approval only after attesting to a sourced business contact and lawful basis. Draft and approval history use the existing lead `notes` field with a versioned prefix, preserving prior notes. The draft workflow does not call the existing generic SMTP endpoint; sending is not connected to this approval flow, and no message is sent.

## Added routes

All new routes are mounted below `/api/admin/recruitment` and use the existing `requireAdmin` authentication middleware.

| Method | Path |
| --- | --- |
| GET, POST | `/leads` |
| PATCH | `/leads/:id` |
| GET, POST | `/requirements` |
| GET, PATCH | `/requirements/:id` |
| GET | `/requirements/:id/matches` |
| GET | `/assigned-jobs` |
| GET | `/candidates` |
| GET, POST | `/shortlists` |
| PATCH | `/shortlists/:id` |
| GET, POST | `/submissions` |
| PATCH | `/submissions/:id` |
| GET, POST | `/interviews` |
| PATCH | `/interviews/:id` |
| GET, POST | `/placements` |
| PATCH | `/placements/:id` |
| GET | `/reports` |

## Role enforcement activation

Role constants and a `requireRoles` middleware are prepared in `modules/recruitment/roleAuthorization.js`, but not attached to any route. Existing login behavior and access are therefore unchanged. Before activation, provision and verify appropriate roles for existing users, test each route with ADMIN, MANAGER, BDM, RA, and RECRUITER accounts, then apply an explicitly reviewed role-to-route policy. Do not activate until the existing administrator/recruiter account has been confirmed to retain required access.

## Database migration

`prisma/migrations/20261007150000_add_recruitment_workflow/migration.sql` was applied to the local `recruitai_dev` database during the earlier authorized database step. It was not rerun or modified for the ATS integration.
