-- AlterTable
-- Adds an optional TL;DR / Key Takeaways field for GEO (AI search) optimization.
ALTER TABLE "posts" ADD COLUMN "tldr" TEXT;
