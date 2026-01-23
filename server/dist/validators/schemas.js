"use strict";
/**
 * Zod Validation Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.moderateCommentSchema = exports.createCommentSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.updateUserSchema = exports.createUserSchema = exports.articleQuerySchema = exports.updateArticleSchema = exports.createArticleSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ============= Auth Schemas =============
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
    email: zod_1.z.string().email('البريد الإلكتروني غير صالح'),
    password: zod_1.z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    passwordConfirmation: zod_1.z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: 'كلمات المرور غير متطابقة',
    path: ['passwordConfirmation'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('البريد الإلكتروني غير صالح'),
    password: zod_1.z.string().min(1, 'كلمة المرور مطلوبة'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: zod_1.z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
});
// ============= Article Schemas =============
exports.createArticleSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(255),
    excerpt: zod_1.z.string().min(10, 'المقتطف يجب أن يكون 10 أحرف على الأقل'),
    content: zod_1.z.string().min(50, 'المحتوى يجب أن يكون 50 حرفاً على الأقل'),
    categoryId: zod_1.z.string().uuid('معرف القسم غير صالح'),
    status: zod_1.z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
    imageUrl: zod_1.z.string().url().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    seoTitle: zod_1.z.string().max(70).optional(),
    seoDesc: zod_1.z.string().max(160).optional(),
});
exports.updateArticleSchema = exports.createArticleSchema.partial();
exports.articleQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    perPage: zod_1.z.coerce.number().min(1).max(50).default(10),
    category: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
    authorId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'views', 'title', 'publishedAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ============= User Schemas =============
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['ADMIN', 'EDITOR', 'JOURNALIST', 'READER']).default('READER'),
    avatar: zod_1.z.string().url().optional().nullable(),
    bio: zod_1.z.string().max(500).optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial().omit({ password: true });
// ============= Category Schemas =============
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    slug: zod_1.z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'اللون يجب أن يكون بصيغة HEX').default('#2563EB'),
    icon: zod_1.z.string().max(50).optional(),
    description: zod_1.z.string().max(500).optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
// ============= Comment Schemas =============
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(3, 'التعليق يجب أن يكون 3 أحرف على الأقل').max(1000),
    articleId: zod_1.z.string().uuid(),
    parentId: zod_1.z.string().uuid().optional(),
});
exports.moderateCommentSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED']),
});
// ============= Query Helpers =============
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    perPage: zod_1.z.coerce.number().min(1).max(100).default(20),
});
//# sourceMappingURL=schemas.js.map