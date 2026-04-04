/**
 * AI Service - Ollama Integration (Local AI)
 * Handles article rewriting using local Ollama instance
 *
 * Features:
 * - Professional journalistic rewriting
 * - Fact preservation with engaging style
 * - Plagiarism-free content generation
 * - Arabic language optimization
 */
export interface RewriteResult {
    rewrittenTitle: string;
    rewrittenExcerpt: string;
}
export interface FullRewriteResult {
    title: string;
    content: string;
    excerpt: string;
}
/**
 * Rewrite article title and excerpt using Local Ollama AI
 */
export declare function rewriteArticle(title: string, excerpt: string): Promise<RewriteResult | null>;
/**
 * Rewrite full article as a professional journalist
 * Used by the automation pipeline for complete content transformation
 */
export declare function rewriteAsJournalist(article: {
    title: string;
    content: string;
    category: string;
}): Promise<FullRewriteResult | null>;
/**
 * Check if AI rewriting is available
 */
export declare function isAIEnabled(): boolean;
/**
 * Test AI connection
 */
export declare function testAIConnection(): Promise<boolean>;
//# sourceMappingURL=ai.service.d.ts.map