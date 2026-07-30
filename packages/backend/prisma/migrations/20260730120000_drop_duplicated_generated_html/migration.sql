-- Strip the duplicated page HTML out of Website.configuration.
--
-- `configuration` is the small settings blob (hours, prices, customization) that every
-- background job has to load. Publishing also wrote the full generated page into
-- `configuration.generatedHTML`, duplicating `Website.publishedHtml` — and NOTHING ever
-- read it back. Measured on a real row: 11,958 B of configuration, of which 11,145 B
-- (93%) was that copy, making the reminder + daily-rhythm jobs ~15x heavier per site
-- than necessary.
--
-- Safe and non-destructive in substance: the HTML itself is untouched in `publishedHtml`
-- (and in WebsiteVersion), so this removes a redundant copy, not the only copy.
-- Forward-only, idempotent: the WHERE makes a re-run a no-op.
-- No schema change — this is a data cleanup, so there is no Prisma model diff.

UPDATE "Website"
SET "configuration" = "configuration" - 'generatedHTML'
WHERE "configuration" ? 'generatedHTML';
