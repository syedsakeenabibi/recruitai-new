"use strict";

const express = require("express");
const { randomUUID } = require("node:crypto");

function createSavedSearchRouter({ getDb } = {}) {
  if (typeof getDb !== "function") {
    throw new TypeError("getDb is required.");
  }

  const router = express.Router();

  async function withDb(res, operation) {
    let db;
    try {
      db = await getDb();
      return await operation(db);
    } catch (error) {
      console.error("[RA saved searches]", error);
      if (!res.headersSent) {
        res.status(error.statusCode || 500).json({
          success: false,
          error: error.statusCode ? error.message : "Saved-search request failed."
        });
      }
      return null;
    } finally {
      if (db) await db.end().catch(() => {});
    }
  }

  function cleanStringArray(value, max = 50) {
    const input = Array.isArray(value) ? value : value ? [value] : [];
    return [...new Set(input
      .filter(item => typeof item === "string")
      .map(item => item.trim())
      .filter(Boolean))].slice(0, max);
  }

  // List saved searches with vacancy and employer totals.
  router.get("/", async (_req, res) => {
    await withDb(res, async db => {
      const result = await db.query(`
        SELECT
          s.*,
          COUNT(DISTINCT so."opportunityId")::int AS "linkedOpportunityCount",
          COUNT(DISTINCT LOWER(TRIM(o."companyName")))
            FILTER (WHERE o."companyName" IS NOT NULL)::int AS "employerCount"
        FROM "RASavedSearch" s
        LEFT JOIN "RASavedSearchOpportunity" so
          ON so."savedSearchId" = s."id"
        LEFT JOIN "JobOpportunity" o
          ON o."id" = so."opportunityId"
        GROUP BY s."id"
        ORDER BY s."createdAt" DESC
      `);

      res.json({ success: true, searches: result.rows });
    });
  });

  // Create a saved search and associate existing saved vacancies.
  router.post("/", async (req, res) => {
    await withDb(res, async db => {
      const body = req.body || {};
      const keywords = cleanStringArray(body.keywords, 50);
      const sources = cleanStringArray(body.sources, 30);
      const opportunityIds = cleanStringArray(body.opportunityIds, 5000);

      const name = String(body.name || keywords.join(", ") || "Saved RA search")
        .trim().slice(0, 200);

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "A saved-search name is required."
        });
      }

      if (!body.filters || typeof body.filters !== "object" || Array.isArray(body.filters)) {
        body.filters = {};
      }

      const discoveredCount = Math.max(0, Math.floor(Number(body.discoveredCount) || 0));
      const alreadySavedCount = Math.max(0, Math.floor(Number(body.alreadySavedCount) || 0));
      const failedCount = Math.max(0, Math.floor(Number(body.failedCount) || 0));

      await db.query("BEGIN");
      try {
        // Validate every vacancy before creating any association.
        if (opportunityIds.length) {
          const found = await db.query(
            `SELECT "id" FROM "JobOpportunity" WHERE "id" = ANY($1::text[])`,
            [opportunityIds]
          );

          if (found.rows.length !== opportunityIds.length) {
            const error = new Error("One or more vacancy IDs do not exist. No search was saved.");
            error.statusCode = 400;
            throw error;
          }
        }

        const id = randomUUID();
        const createdBy = req.admin?.id ? String(req.admin.id) : null;

        const inserted = await db.query(`
          INSERT INTO "RASavedSearch" (
            "id", "name", "keywords", "sources", "filters",
            "discoveredCount", "newlySavedCount",
            "alreadySavedCount", "failedCount", "createdBy"
          )
          VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)
          RETURNING *
        `, [
          id,
          name,
          keywords,
          sources,
          JSON.stringify(body.filters),
          discoveredCount,
          opportunityIds.length,
          alreadySavedCount,
          failedCount,
          createdBy
        ]);

        if (opportunityIds.length) {
          await db.query(`
            INSERT INTO "RASavedSearchOpportunity" (
              "id", "savedSearchId", "opportunityId"
            )
            SELECT gen_random_uuid()::text, $1, value
            FROM unnest($2::text[]) AS value
            ON CONFLICT ("savedSearchId", "opportunityId") DO NOTHING
          `, [id, opportunityIds]);
        }

        await db.query("COMMIT");

        res.status(201).json({
          success: true,
          search: inserted.rows[0],
          linkedOpportunityCount: opportunityIds.length
        });
      } catch (error) {
        await db.query("ROLLBACK").catch(() => {});
        throw error;
      }
    });
  });

  // Read one saved search and all its associated vacancies.
  router.get("/:id", async (req, res) => {
    await withDb(res, async db => {
      const search = await db.query(
        `SELECT * FROM "RASavedSearch" WHERE "id" = $1 LIMIT 1`,
        [req.params.id]
      );

      if (!search.rows[0]) {
        return res.status(404).json({
          success: false,
          error: "Saved search not found."
        });
      }

      const opportunities = await db.query(`
        SELECT o.*
        FROM "RASavedSearchOpportunity" so
        JOIN "JobOpportunity" o ON o."id" = so."opportunityId"
        WHERE so."savedSearchId" = $1
        ORDER BY o."discoveredAt" DESC
      `, [req.params.id]);

      const employers = await db.query(`
        SELECT
          LOWER(TRIM(o."companyName")) AS "employerKey",
          MIN(o."companyName") AS "companyName",
          COUNT(*)::int AS "vacancyCount"
        FROM "RASavedSearchOpportunity" so
        JOIN "JobOpportunity" o ON o."id" = so."opportunityId"
        WHERE so."savedSearchId" = $1
          AND NULLIF(TRIM(o."companyName"), '') IS NOT NULL
        GROUP BY LOWER(TRIM(o."companyName"))
        ORDER BY MIN(o."companyName")
      `, [req.params.id]);

      res.json({
        success: true,
        search: search.rows[0],
        opportunities: opportunities.rows,
        employers: employers.rows
      });
    });
  });

  return router;
}

module.exports = { createSavedSearchRouter };
