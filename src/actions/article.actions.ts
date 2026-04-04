// src/actions/article.actions.ts
'use server';

import { articleService } from '@/services/article.service';
import { CreateArticleRequest } from '@/types/api.types';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

export async function createArticleAction(data: CreateArticleRequest, idempotencyKey: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        const article = await articleService.createArticle(data, idempotencyKey, {
            Cookie: `access_token=${token}`
        });
        
        // @ts-ignore - Next.js 16 type signature mismatch
        revalidateTag('articles');
        return { success: true, data: article };
    } catch (error: any) {
        return { success: false, error: error.message || 'فشل إنشاء المقال' };
    }
}
