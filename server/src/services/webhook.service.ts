import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebhookService {
  private static instance: WebhookService;
  private readonly n8nWebhookUrl: string;

  private constructor() {
    // Default to the new self-hosted n8n instance or env var
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.voiceoftihama.com/webhook/new-article';
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Send article data to n8n webhook
   * This is a fire-and-forget operation to not block the main execution flow
   */
  public async notifyNewArticle(articleId: string): Promise<void> {
    try {
      // Fetch full article details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          category: true,
        },
      });

      if (!article) {
        console.error(`[Webhook] Article not found for ID: ${articleId}`);
        return;
      }

      // Check if it's actually published
      if (article.status !== 'PUBLISHED') {
        return;
      }

      const payload = {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content, // Useful for AI summarization
        imageUrl: article.imageUrl,
        category: article.category?.name || 'news',
        publishedAt: article.publishedAt,
        sourceUrl: `https://voiceoftihama.com/article/${article.slug}`,
        isBreaking: article.isBreaking,
      };

      console.log(`[Webhook] Triggering n8n for: "${article.title}"`);

      // Fire payload to n8n
      await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'voiceoftihama-backend',
        },
        timeout: 5000, // 5s timeout safety
      });

      console.log('[Webhook] Successfully delivered to n8n');
    } catch (error: any) {
      // Silent fail to not disrupt the app flow, just log it
      console.error('[Webhook] Failed delivery:', error.message);
    }
  }
}

export const webhookService = WebhookService.getInstance();
