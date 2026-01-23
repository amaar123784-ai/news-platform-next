/**
 * AI Service - Ollama Integration (Local AI)
 * Handles article rewriting using local Ollama instance
 */

import { Ollama } from 'ollama';
import { env } from '../config/env.js';

// Initialize Ollama
// Defaults to localhost:11434 if not specified
const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
});

export interface RewriteResult {
    rewrittenTitle: string;
    rewrittenExcerpt: string;
}

/**
 * Rewrite article title and excerpt using Local Ollama AI
 */
export async function rewriteArticle(
    title: string,
    excerpt: string
): Promise<RewriteResult | null> {
    try {
        const model = process.env.OLLAMA_MODEL || 'gemma2';

        const prompt = `أنت محرر صحفي محترف. أعد صياغة هذا الخبر ليكون محايداً وجذاباً.

العنوان: ${title}
المقتطف: ${excerpt || 'لا يوجد مقتطف'}

القواعد:
1. ارجع النتيجة بصيغة JSON فقط.
2. الحقول المطلوبة: "title" (العنوان الجديد), "excerpt" (المقتطف الجديد).
3. اللغة: عربية فصحى سليمة.
4. لا تضف أي نص خارج الـ JSON.

Example Response:
{
  "title": "عنوان جديد هنا",
  "excerpt": "مقتطف جديد هنا"
}`;

        const response = await ollama.generate({
            model: model,
            prompt: prompt,
            format: 'json', // Helper to force JSON output if model supports it
            stream: false
        });

        const text = response.response;
        console.log('[AI] Ollama raw response:', text);

        let jsonResponse;
        try {
            // Try to find JSON block if mixed with text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            jsonResponse = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[AI] Failed to parse JSON from Ollama, trying manual parsing');
        }

        const rewrittenTitle = jsonResponse?.title || title;
        const rewrittenExcerpt = jsonResponse?.excerpt || excerpt;

        return {
            rewrittenTitle,
            rewrittenExcerpt
        };

    } catch (error: any) {
        console.error('[AI] Error rewriting with Ollama:', error.message);
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.error('[AI] ❌ Connection refused! Is Ollama running? Run "ollama serve"');
        }
        return null;
    }
}

/**
 * Check if AI rewriting is available (Ollama is assumed available if configured)
 */
export function isAIEnabled(): boolean {
    return true; // Always true for local AI, or check health endpoint
}
