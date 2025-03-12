-- Drop read model and all related references
DROP TABLE IF EXISTS "Read";

-- Remove reads relation from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "reads";

-- Remove reads relation from Article
ALTER TABLE "Article" DROP COLUMN IF EXISTS "reads";