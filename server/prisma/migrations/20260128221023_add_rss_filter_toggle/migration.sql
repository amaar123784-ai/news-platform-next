-- AlterTable
ALTER TABLE `rsssource` ADD COLUMN `applyFilter` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `RSSArticle_status_publishedAt_idx` ON `RSSArticle`(`status`, `publishedAt`);

-- CreateIndex
CREATE INDEX `RSSArticle_fetchedAt_idx` ON `RSSArticle`(`fetchedAt`);
