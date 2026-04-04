-- 1. Add rawCategories column to RSSArticle
ALTER TABLE `RSSArticle` 
    ADD COLUMN `rawCategories` TEXT NULL;

-- 2. Add status and publishedAt composite index to RSSArticle
CREATE INDEX `RSSArticle_status_publishedAt_idx` ON `RSSArticle`(`status`, `publishedAt`);

-- 3. Add fetchedAt index to RSSArticle
CREATE INDEX `RSSArticle_fetchedAt_idx` ON `RSSArticle`(`fetchedAt`);

-- 4. Update AutomationStatus enum in AutomationQueue (Adds SCRAPING and FAILED_SCRAPE)
ALTER TABLE `AutomationQueue` 
    MODIFY COLUMN `status` ENUM(
        'PENDING', 
        'SCRAPING', 
        'AI_PROCESSING', 
        'AI_COMPLETED', 
        'PUBLISHING', 
        'PUBLISHED', 
        'SOCIAL_PENDING', 
        'SOCIAL_POSTING', 
        'COMPLETED', 
        'FAILED', 
        'FAILED_SCRAPE'
    ) NOT NULL DEFAULT 'PENDING';
