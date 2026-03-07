-- Migration: add_missing_fields
-- Adds: Article.deletedAt, Article.deletedAt index, SocialPost table,
--       WHATSAPP to SocialPlatform enum values inside AutomationQueue

-- -----------------------------------------------
-- 1. Add deletedAt soft-delete column to Article
-- -----------------------------------------------
ALTER TABLE `Article`
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- -----------------------------------------------
-- 2. Index on Article.deletedAt (same as schema)
-- -----------------------------------------------
CREATE INDEX `Article_deletedAt_idx` ON `Article`(`deletedAt`);

-- -----------------------------------------------
-- 3. Add WHATSAPP to AutomationQueue.socialPlatform enum
-- -----------------------------------------------
ALTER TABLE `AutomationQueue`
    MODIFY COLUMN `socialPlatform` ENUM('FACEBOOK', 'TELEGRAM', 'TWITTER', 'WHATSAPP') NULL;

-- -----------------------------------------------
-- 4. Create SocialPost table
-- -----------------------------------------------
CREATE TABLE `SocialPost` (
    `id`           VARCHAR(191) NOT NULL,
    `articleId`    VARCHAR(191) NOT NULL,
    `platform`     ENUM('FACEBOOK', 'TELEGRAM', 'TWITTER', 'WHATSAPP') NOT NULL,
    `status`       ENUM('PENDING', 'PROCESSING', 'POSTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `postId`       VARCHAR(255) NULL,
    `scheduledAt`  DATETIME(3) NULL,
    `postedAt`     DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `retryCount`   INTEGER NOT NULL DEFAULT 0,
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3) NOT NULL,

    UNIQUE INDEX `SocialPost_articleId_platform_key`(`articleId`, `platform`),
    INDEX `SocialPost_status_idx`(`status`),
    INDEX `SocialPost_articleId_idx`(`articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
