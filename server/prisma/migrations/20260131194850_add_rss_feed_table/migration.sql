/*
  Warnings:

  - You are about to drop the column `sourceId` on the `rssarticle` table. All the data in the column will be lost.
  - You are about to drop the column `applyFilter` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `errorCount` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `feedUrl` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `fetchInterval` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `lastError` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `lastFetchedAt` on the `rsssource` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `rsssource` table. All the data in the column will be lost.
  - Added the required column `feedId` to the `RSSArticle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `rssarticle` DROP FOREIGN KEY `RSSArticle_sourceId_fkey`;

-- DropForeignKey
ALTER TABLE `rsssource` DROP FOREIGN KEY `RSSSource_categoryId_fkey`;

-- DropIndex
DROP INDEX `RSSSource_feedUrl_key` ON `rsssource`;

-- DropIndex
DROP INDEX `RSSSource_lastFetchedAt_idx` ON `rsssource`;

-- DropIndex
DROP INDEX `RSSSource_status_idx` ON `rsssource`;

-- AlterTable
ALTER TABLE `rssarticle` DROP COLUMN `sourceId`,
    ADD COLUMN `feedId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `rsssource` DROP COLUMN `applyFilter`,
    DROP COLUMN `categoryId`,
    DROP COLUMN `errorCount`,
    DROP COLUMN `feedUrl`,
    DROP COLUMN `fetchInterval`,
    DROP COLUMN `lastError`,
    DROP COLUMN `lastFetchedAt`,
    DROP COLUMN `status`;

-- CreateTable
CREATE TABLE `RSSFeed` (
    `id` VARCHAR(191) NOT NULL,
    `feedUrl` VARCHAR(500) NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ERROR') NOT NULL DEFAULT 'ACTIVE',
    `fetchInterval` INTEGER NOT NULL DEFAULT 15,
    `lastFetchedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `applyFilter` BOOLEAN NOT NULL DEFAULT true,
    `categoryId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RSSFeed_feedUrl_key`(`feedUrl`),
    INDEX `RSSFeed_status_idx`(`status`),
    INDEX `RSSFeed_sourceId_idx`(`sourceId`),
    INDEX `RSSFeed_categoryId_idx`(`categoryId`),
    INDEX `RSSFeed_lastFetchedAt_idx`(`lastFetchedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutomationQueue` (
    `id` VARCHAR(191) NOT NULL,
    `rssArticleId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'AI_PROCESSING', 'AI_COMPLETED', 'PUBLISHING', 'PUBLISHED', 'SOCIAL_PENDING', 'SOCIAL_POSTING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `aiRewrittenTitle` VARCHAR(500) NULL,
    `aiRewrittenContent` LONGTEXT NULL,
    `aiRewrittenExcerpt` TEXT NULL,
    `aiProcessedAt` DATETIME(3) NULL,
    `createdArticleId` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `socialPlatform` ENUM('FACEBOOK', 'TELEGRAM', 'TWITTER') NULL,
    `socialStatus` ENUM('PENDING', 'PROCESSING', 'POSTED', 'FAILED') NULL,
    `socialScheduledAt` DATETIME(3) NULL,
    `socialPostedAt` DATETIME(3) NULL,
    `socialPostId` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AutomationQueue_rssArticleId_key`(`rssArticleId`),
    INDEX `AutomationQueue_status_idx`(`status`),
    INDEX `AutomationQueue_socialStatus_idx`(`socialStatus`),
    INDEX `AutomationQueue_socialScheduledAt_idx`(`socialScheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemNotification` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemNotification_isRead_createdAt_idx`(`isRead`, `createdAt`),
    INDEX `SystemNotification_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `RSSArticle_feedId_idx` ON `RSSArticle`(`feedId`);

-- AddForeignKey
ALTER TABLE `RSSFeed` ADD CONSTRAINT `RSSFeed_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RSSFeed` ADD CONSTRAINT `RSSFeed_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `RSSSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RSSArticle` ADD CONSTRAINT `RSSArticle_feedId_fkey` FOREIGN KEY (`feedId`) REFERENCES `RSSFeed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutomationQueue` ADD CONSTRAINT `AutomationQueue_rssArticleId_fkey` FOREIGN KEY (`rssArticleId`) REFERENCES `RSSArticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
