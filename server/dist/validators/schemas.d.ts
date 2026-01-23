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
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDesc: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
}, {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
}>;
export declare const updateArticleSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    seoTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoDesc: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    title?: string | undefined;
    excerpt?: string | undefined;
    content?: string | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
}, {
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    title?: string | undefined;
    excerpt?: string | undefined;
    content?: string | undefined;
    categoryId?: string | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
    seoTitle?: string | undefined;
    seoDesc?: string | undefined;
}>;
export declare const articleQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>>;
    authorId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "views", "title", "publishedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    perPage: number;
    sortBy: "title" | "createdAt" | "views" | "publishedAt";
    sortOrder: "asc" | "desc";
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    category?: string | undefined;
    authorId?: string | undefined;
    search?: string | undefined;
}, {
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" | undefined;
    page?: number | undefined;
    perPage?: number | undefined;
    category?: string | undefined;
    authorId?: string | undefined;
    search?: string | undefined;
    sortBy?: "title" | "createdAt" | "views" | "publishedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
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
    slug: string;
    color: string;
    isActive: boolean;
    icon?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    slug: string;
    color?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
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
    slug?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    articleId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    articleId: string;
    parentId?: string | undefined;
}, {
    content: string;
    articleId: string;
    parentId?: string | undefined;
}>;
export declare const moderateCommentSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
}, {
    status: "APPROVED" | "REJECTED";
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