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

import { Ollama } from 'ollama';

// Initialize Ollama
// Defaults to localhost:11434 if not specified
const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
});

export interface RewriteResult {
    rewrittenTitle: string;
    rewrittenExcerpt: string;
}

export interface FullRewriteResult {
    title: string;
    content: string;
    excerpt: string;
}

// ============= PROFESSIONAL PROMPTS =============

/**
 * System prompt for journalistic rewriting
 * Defines the AI's role and writing standards
 */
const JOURNALIST_SYSTEM_PROMPT = `أنت محرر صحفي محترف في منصة "صوت تهامة" الإخبارية اليمنية.
مهمتك إعادة صياغة الأخبار بأسلوب صحفي احترافي مع الالتزام بالمعايير التالية:

📌 معايير الكتابة:
• استخدم اللغة العربية الفصحى السليمة والواضحة
• اتبع أسلوب الهرم المقلوب (الأهم أولاً)
• اجعل العناوين جذابة ومختصرة (لا تتجاوز 80 حرفاً)
• اكتب مقدمة موجزة تجيب على: من؟ ماذا؟ متى؟ أين؟ لماذا؟

⚠️ قواعد صارمة:
• حافظ على جميع الحقائق والأرقام والتواريخ والأسماء كما هي
• لا تضف معلومات غير موجودة في النص الأصلي
• لا تبالغ أو تهول في الصياغة
• التزم بالحيادية والموضوعية التامة
• تجنب النسخ الحرفي - أعد الصياغة بأسلوبك الخاص
• احذف أي ذكر لاسم المصدر الأصلي أو الوكالة الإخبارية من النص
• لا تتضمن عبارات مثل "وفقاً لـ..." أو "نقلاً عن..." أو "أفادت وكالة..."

🎯 أسلوب الكتابة:
• استخدم جمل قصيرة ومباشرة
• تجنب الحشو والتكرار
• استخدم الفعل المبني للمعلوم قدر الإمكان
• اجعل النص سلساً وسهل القراءة`;

/**
 * Prompt template for title and excerpt rewriting
 */
const TITLE_EXCERPT_PROMPT = (title: string, excerpt: string) => `
أعد صياغة العنوان والمقتطف التاليين بأسلوب صحفي جذاب:

📰 العنوان الأصلي:
${title}

📝 المقتطف الأصلي:
${excerpt || 'لا يوجد مقتطف متاح'}

---
المطلوب:
1. عنوان جديد: جذاب ومختصر (50-80 حرف)
2. مقتطف جديد: ملخص شيق (100-150 حرف)

أرجع النتيجة بصيغة JSON فقط:
{
  "title": "العنوان الجديد",
  "excerpt": "المقتطف الجديد"
}`;

/**
 * Prompt template for full article rewriting
 */
const FULL_ARTICLE_PROMPT = (title: string, content: string, category: string) => `
أعد صياغة الخبر التالي بالكامل بأسلوب صحفي احترافي:

📰 العنوان الأصلي:
${title}

📂 التصنيف:
${category}

📄 المحتوى الأصلي:
${content}

---
المطلوب:
1. عنوان جديد: جذاب ويعكس جوهر الخبر (50-80 حرف)
2. محتوى جديد: مُعاد صياغته بالكامل مع:
   - مقدمة قوية (فقرة واحدة)
   - جسم الخبر (2-4 فقرات)
   - خاتمة أو تفاصيل إضافية (فقرة واحدة)
3. مقتطف: ملخص جذاب (100-150 حرف)

⚠️ تذكر:
- حافظ على جميع الحقائق والأرقام
- لا تضف معلومات جديدة
- اجعل النص فريداً وغير منسوخ

أرجع النتيجة بصيغة JSON فقط:
{
  "title": "العنوان الجديد",
  "content": "المحتوى الجديد بتنسيق HTML مع <p> للفقرات",
  "excerpt": "المقتطف الجديد"
}`;

// ============= REWRITE FUNCTIONS =============

/**
 * Rewrite article title and excerpt using Local Ollama AI
 */
export async function rewriteArticle(
    title: string,
    excerpt: string
): Promise<RewriteResult | null> {
    try {
        const model = process.env.OLLAMA_MODEL || 'gemma2';

        const response = await ollama.generate({
            model: model,
            system: JOURNALIST_SYSTEM_PROMPT,
            prompt: TITLE_EXCERPT_PROMPT(title, excerpt),
            format: 'json',
            stream: false,
            options: {
                temperature: 0.7,  // Balanced creativity
                top_p: 0.9,
                num_predict: 500   // Limit response length
            }
        });

        const text = response.response;
        console.log('[AI] Ollama raw response:', text);

        let jsonResponse;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            jsonResponse = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[AI] Failed to parse JSON from Ollama');
            return null;
        }

        // Validate response has required fields
        if (!jsonResponse?.title || !jsonResponse?.excerpt) {
            console.warn('[AI] Response missing required fields');
            return null;
        }

        return {
            rewrittenTitle: jsonResponse.title,
            rewrittenExcerpt: jsonResponse.excerpt
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
 * Rewrite full article as a professional journalist
 * Used by the automation pipeline for complete content transformation
 */
export async function rewriteAsJournalist(article: {
    title: string;
    content: string;
    category: string;
}): Promise<FullRewriteResult | null> {
    try {
        const model = process.env.OLLAMA_MODEL || 'gemma2';

        const response = await ollama.generate({
            model: model,
            system: JOURNALIST_SYSTEM_PROMPT,
            prompt: FULL_ARTICLE_PROMPT(article.title, article.content, article.category),
            format: 'json',
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                num_predict: 2000  // Allow longer content
            }
        });

        const text = response.response;
        console.log('[AI] Full rewrite response length:', text.length);

        let jsonResponse;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            jsonResponse = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[AI] Failed to parse full rewrite JSON');
            return null;
        }

        // Validate all required fields
        if (!jsonResponse?.title || !jsonResponse?.content || !jsonResponse?.excerpt) {
            console.warn('[AI] Full rewrite response missing required fields');
            return null;
        }

        // Ensure content has proper HTML formatting
        let formattedContent = jsonResponse.content;
        if (!formattedContent.includes('<p>')) {
            // Wrap paragraphs if not already formatted
            formattedContent = formattedContent
                .split('\n\n')
                .filter((p: string) => p.trim())
                .map((p: string) => `<p>${p.trim()}</p>`)
                .join('\n');
        }

        return {
            title: jsonResponse.title,
            content: formattedContent,
            excerpt: jsonResponse.excerpt
        };

    } catch (error: any) {
        console.error('[AI] Error in full rewrite:', error.message);
        return null;
    }
}

/**
 * Check if AI rewriting is available
 */
export function isAIEnabled(): boolean {
    return true;
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<boolean> {
    try {
        await ollama.list();
        return true;
    } catch {
        return false;
    }
}
