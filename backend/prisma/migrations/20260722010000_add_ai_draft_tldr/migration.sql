-- AlterTable
-- Adds an optional TL;DR / key takeaways field to AI-generated drafts for GEO (AI search).
ALTER TABLE "ai_draft_outputs" ADD COLUMN "tldr" TEXT;
