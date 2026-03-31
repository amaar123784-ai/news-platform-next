// src/actions/article.actions.ts
'use server';

import { articleService } from '@/services/article.service';
import { CreateArticleRequest } from '@/types/api.types';
import { revalidateTag } from 'next/cache';

export async function createArticleAction(data: CreateArticleRequest, idempotencyKey: string) {
    try {
        const article = await articleService.createArticle(data, idempotencyKey);
        // @ts-ignore - Next.js 16 type signature mismatch
        revalidateTag('articles');
        return { success: true, data: article };
    } catch (error: any) {
        return { success: false, error: error.message || 'فشل إنشاء المقال' };
    }
}
