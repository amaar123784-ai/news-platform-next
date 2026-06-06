/**
 * Category Classifier Service
 * Keyword-based automatic article categorization for mixed RSS sources
 */
export interface ClassificationResult {
    categorySlug: string | null;
    confidence: number;
    scores: Record<string, number>;
}
/**
 * Classify an article based on title and excerpt
 * Returns category slug or null if no confident match
 */
export declare function classifyArticle(title: string, excerpt?: string): ClassificationResult;
/**
 * Check if a source category is "mixed" (requires auto-classification)
 */
export declare function isMixedCategory(categorySlug: string): boolean;
//# sourceMappingURL=categoryClassifier.service.d.ts.map