/**
 * HTML & Text Sanitization Utilities
 * Prevents stored XSS by sanitizing user-provided HTML/text content
 * Uses DOMPurify + JSDOM for Node.js server-side rendering
 */
/**
 * Sanitize HTML content (for article body)
 * - Strips: <script>, <iframe>, <object>, onX attributes, javascript: URLs, data: URLs
 * - Preserves: standard article formatting tags
 */
export declare function sanitizeHtml(html: string): string;
/**
 * Sanitize plain text fields (title, excerpt, seoTitle, seoDesc)
 * Strips ALL HTML — these fields should never contain markup
 */
export declare function sanitizeText(text: string): string;
//# sourceMappingURL=sanitize.d.ts.map