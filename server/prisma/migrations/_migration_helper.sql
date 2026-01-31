-- =====================================================
-- Migration Script: RSS Sources to Multi-Feed Architecture
-- Run this AFTER prisma migrate to preserve existing data
-- =====================================================

-- Step 1: Create RSSFeed entries from existing RSSSource data
-- This preserves all existing sources as feeds linked to their parent source
INSERT INTO RSSFeed (id, feedUrl, status, fetchInterval, lastFetchedAt, lastError, errorCount, applyFilter, categoryId, sourceId, createdAt, updatedAt)
SELECT 
    UUID() as id,
    feedUrl,
    status,
    fetchInterval,
    lastFetchedAt,
    lastError,
    errorCount,
    applyFilter,
    categoryId,
    id as sourceId,  -- Link to same RSSSource
    createdAt,
    updatedAt
FROM RSSSource_old;  -- Will need to rename table first

-- Step 2: Update RSSArticle to link to new RSSFeed instead of RSSSource
-- Get the feedId from the newly created RSSFeed where sourceId matches
UPDATE RSSArticle ra
INNER JOIN RSSFeed rf ON rf.sourceId = ra.sourceId
SET ra.feedId = rf.id;

-- Step 3: Verify migration
SELECT 
    'RSSSource' as table_name, COUNT(*) as count FROM RSSSource
UNION ALL
SELECT 'RSSFeed', COUNT(*) FROM RSSFeed
UNION ALL
SELECT 'RSSArticle', COUNT(*) FROM RSSArticle;
