/**
 * HTML & Text Sanitization Utilities
 * Prevents stored XSS by sanitizing user-provided HTML/text content
 * Uses DOMPurify + JSDOM for Node.js server-side rendering
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create a server-side DOMPurify instance from a JSDOM window
// The 'as any' cast bridges the jsdom Window type to DOMPurify's WindowLike interface
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Allowed HTML tags for article content (standard news article formatting)
 */
const ALLOWED_TAGS = [
    'p', 'br', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'a', 'img',
    'ul', 'ol', 'li',
    'blockquote', 'q', 'cite',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'code', 'pre',
    'figure', 'figcaption',
    'hr',
];

/**
 * Allowed HTML attributes (strips event handlers and dangerous attributes)
 */
const ALLOWED_ATTR = [
    'href', 'src', 'alt', 'title', 'class', 'id',
    'width', 'height', 'target', 'rel',
    'colspan', 'rowspan',
    'dir', 'lang',
];

/**
 * Sanitize HTML content (for article body)
 * - Strips: <script>, <iframe>, <object>, onX attributes, javascript: URLs, data: URLs
 * - Preserves: standard article formatting tags
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        FORCE_BODY: true,
        ALLOWED_URI_REGEXP: /^(?:https?|ftp|mailto|\/|#)(?:[^"']|$)/i,
    });
}

/**
 * Sanitize plain text fields (title, excerpt, seoTitle, seoDesc)
 * Strips ALL HTML — these fields should never contain markup
 */
export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
