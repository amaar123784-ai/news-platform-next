/**
 * Zod Validation Schemas
 */
import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    passwordConfirmation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}, {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}>, {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}, {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const createArticleSchema: z.ZodObject<{
    title: z.ZodString;
    excerpt: z.ZodString;
    content: z.ZodString;
    categoryId: z.ZodString;
    status: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string | null, string>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDesc: z.ZodOptional<z.ZodString>;
    isBreaking: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isFeatured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    categoryId: string;
    excerpt: string;
    content: string;
    isBreaking: boolean;
    isFeatured: boolean;
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
}, {
    title: string;
    categoryId: string;
    excerpt: string;
    content: string;
    status?: string | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
    isBreaking?: boolean | undefined;
    isFeatured?: boolean | undefined;
}>;
export declare const updateArticleSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string | null, string>>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    seoTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoDesc: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isBreaking: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    isFeatured: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    title?: string | undefined;
    imageUrl?: string | null | undefined;
    categoryId?: string | undefined;
    excerpt?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
    isBreaking?: boolean | undefined;
    isFeatured?: boolean | undefined;
}, {
    status?: string | undefined;
    title?: string | undefined;
    imageUrl?: string | null | undefined;
    categoryId?: string | undefined;
    excerpt?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
    isBreaking?: boolean | undefined;
    isFeatured?: boolean | undefined;
}>;
export declare const articleQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>>;
    authorId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "views", "title", "publishedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    page: number;
    perPage: number;
    sortBy: "title" | "createdAt" | "publishedAt" | "views";
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    category?: string | undefined;
    search?: string | undefined;
    authorId?: string | undefined;
}, {
    status?: string | undefined;
    category?: string | undefined;
    search?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    page?: number | undefined;
    perPage?: number | undefined;
    authorId?: string | undefined;
    sortBy?: "title" | "createdAt" | "publishedAt" | "views" | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["ADMIN", "EDITOR", "JOURNALIST", "READER"]>>;
    avatar: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bio: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "EDITOR" | "JOURNALIST" | "READER";
    avatar?: string | null | undefined;
    bio?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "EDITOR" | "JOURNALIST" | "READER" | undefined;
    avatar?: string | null | undefined;
    bio?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ADMIN", "EDITOR", "JOURNALIST", "READER"]>>>;
    avatar: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "password">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    role?: "ADMIN" | "EDITOR" | "JOURNALIST" | "READER" | undefined;
    avatar?: string | null | undefined;
    bio?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    role?: "ADMIN" | "EDITOR" | "JOURNALIST" | "READER" | undefined;
    avatar?: string | null | undefined;
    bio?: string | undefined;
}>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    slug: string;
    color: string;
    description?: string | undefined;
    icon?: string | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
    color?: string | undefined;
    icon?: string | undefined;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    slug?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
}>;
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    articleId: z.ZodString;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    articleId: string;
    parentId?: string | null | undefined;
}, {
    content: string;
    articleId: string;
    parentId?: string | null | undefined;
}>;
export declare const moderateCommentSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "REJECTED" | "APPROVED";
}, {
    status: "REJECTED" | "APPROVED";
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    perPage: number;
}, {
    page?: number | undefined;
    perPage?: number | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map