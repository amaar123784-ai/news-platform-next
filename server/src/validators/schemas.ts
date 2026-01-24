/**
 * Zod Validation Schemas
 */

import { z } from 'zod';

// ============= Auth Schemas =============

export const registerSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: 'كلمات المرور غير متطابقة',
    path: ['passwordConfirmation'],
});

export const loginSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
});

// ============= Article Schemas =============

export const createArticleSchema = z.object({
    title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(255),
    excerpt: z.string().min(10, 'المقتطف يجب أن يكون 10 أحرف على الأقل'),
    content: z.string().min(50, 'المحتوى يجب أن يكون 50 حرفاً على الأقل'),
    categoryId: z.string().uuid('معرف القسم غير صالح'),
    status: z.string().transform(v => v?.toUpperCase()).pipe(z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])).optional(),
    imageUrl: z.string().transform(v => v === '' ? null : v).nullable().optional(),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().max(70).optional(),
    seoDesc: z.string().max(160).optional(),
    isBreaking: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    perPage: z.coerce.number().min(1).max(50).default(10),
    category: z.string().optional(),
    status: z.string().transform(v => v?.toUpperCase()).pipe(z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])).optional(),
    authorId: z.string().uuid().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'views', 'title', 'publishedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============= User Schemas =============

export const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['ADMIN', 'EDITOR', 'JOURNALIST', 'READER']).default('READER'),
    avatar: z.string().url().optional().nullable(),
    bio: z.string().max(500).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// ============= Category Schemas =============

export const createCategorySchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
    color: z.string().default('#2563EB'),
    icon: z.string().max(50).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============= Comment Schemas =============

export const createCommentSchema = z.object({
    content: z.string().min(3, 'التعليق يجب أن يكون 3 أحرف على الأقل').max(1000),
    articleId: z.string().uuid(),
    parentId: z.string().uuid().optional().nullable(),
});

export const moderateCommentSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
});

// ============= Query Helpers =============

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    perPage: z.coerce.number().min(1).max(100).default(20),
});
