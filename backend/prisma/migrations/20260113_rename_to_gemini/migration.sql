-- SQLite doesn't support RENAME COLUMN directly, so we recreate the table
-- Step 1: Create new table with correct schema
CREATE TABLE "new_SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "geminiApiKey" TEXT NOT NULL,
    "selectedModel" TEXT NOT NULL DEFAULT 'gemini-3-flash-preview',
    "imageAnalysisApiKey" TEXT,
    "imageAnalysisModel" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL
);

-- Step 2: Copy data from old table, mapping openRouterKey to geminiApiKey
INSERT INTO "new_SystemSettings" ("id", "geminiApiKey", "selectedModel", "imageAnalysisApiKey", "imageAnalysisModel", "updatedAt", "updatedBy")
SELECT "id", "openRouterKey", "selectedModel", "imageAnalysisApiKey", "imageAnalysisModel", "updatedAt", "updatedBy"
FROM "SystemSettings";

-- Step 3: Drop old table
DROP TABLE "SystemSettings";

-- Step 4: Rename new table to original name
ALTER TABLE "new_SystemSettings" RENAME TO "SystemSettings";
