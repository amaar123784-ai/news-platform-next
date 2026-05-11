/**
 * Article Service
 *
 * Business logic for article CRUD, publishing, caching, and social distribution.
 * Extracted from article.routes.ts to follow Single Responsibility Principle.
 */
interface ArticleQuery {
    page: number;
    perPage: number;
    category?: string;
    tag?: string;
    status?: string;
    authorId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
}
interface ArticleUser {
    userId: string;
    role: string;
}
interface CreateArticleData {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status?: string;
    imageUrl?: string | null;
    tags?: string[];
    seoTitle?: string;
    seoDesc?: string;
    isBreaking?: boolean;
}
interface UpdateArticleData {
    title?: string;
    excerpt?: string;
    content?: string;
    categoryId?: string;
    tags?: string[];
    status?: string;
    imageUrl?: string | null;
    seoTitle?: string;
    seoDesc?: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
    [key: string]: any;
}
/**
 * Generate a URL-friendly slug from a title (supports Arabic)
 */
export declare function generateSlug(title: string): string;
/**
 * List articles with filtering, pagination, and search
 */
export declare function listArticles(query: ArticleQuery, user?: ArticleUser | null): Promise<{
    data: ({
        category: {
            name: string;
            id: string;
            slug: string;
            color: string;
        };
        _count: {
            comments: number;
        };
        author: {
            name: string;
            id: string;
            avatar: string | null;
        };
        tags: ({
            tag: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            articleId: string;
            tagId: string;
        })[];
    } & {
        status: import(".prisma/client").$Enums.ArticleStatus;
        title: string;
        content: string;
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        excerpt: string;
        imageUrl: string | null;
        publishedAt: Date | null;
        deletedAt: Date | null;
        views: number;
        readTime: number;
        seoTitle: string | null;
        seoDesc: string | null;
        isBreaking: boolean;
        isFeatured: boolean;
        authorId: string;
    })[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}>;
/**
 * Get featured articles with caching
 */
export declare function getFeaturedArticles(limit: number): Promise<{}>;
/**
 * Get breaking news articles with caching
 */
export declare function getBreakingNews(limit: number): Promise<{}>;
/**
 * Get articles related to a given article (same category)
 */
export declare function getRelatedArticles(idOrSlug: string, limit: number): Promise<({
    category: {
        name: string;
        id: string;
        slug: string;
        color: string;
    };
    author: {
        name: string;
        id: string;
        avatar: string | null;
    };
} & {
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
})[]>;
/**
 * Increment view count for an article with deduplication logic
 */
export declare function incrementArticleViews(idOrSlug: string): Promise<{
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
/**
 * Get a single article by ID or slug, with access control and view tracking
 */
export declare function getArticleByIdOrSlug(idOrSlug: string, user?: ArticleUser | null): Promise<{
    category: {
        name: string;
        id: string;
        slug: string;
        color: string;
    };
    comments: ({
        author: {
            name: string;
            id: string;
            avatar: string | null;
        };
        replies: ({
            author: {
                name: string;
                id: string;
                avatar: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.CommentStatus;
            content: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            articleId: string;
            authorId: string;
            parentId: string | null;
            likes: number;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CommentStatus;
        content: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        articleId: string;
        authorId: string;
        parentId: string | null;
        likes: number;
    })[];
    author: {
        name: string;
        id: string;
        avatar: string | null;
        bio: string | null;
    };
    tags: ({
        tag: {
            name: string;
            id: string;
            slug: string;
        };
    } & {
        articleId: string;
        tagId: string;
    })[];
} & {
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
/**
 * Create a new article with sanitization, slug generation, and image processing
 */
export declare function createArticle(data: CreateArticleData, userId: string): Promise<any>;
/**
 * Update an existing article with ownership checks and cache invalidation
 */
export declare function updateArticle(id: string, data: UpdateArticleData, user: ArticleUser): Promise<{
    category: {
        name: string;
        id: string;
        slug: string;
    };
    author: {
        name: string;
        id: string;
    };
} & {
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
/**
 * Soft-delete an article
 */
export declare function deleteArticle(id: string, userId: string): Promise<void>;
/**
 * Restore a soft-deleted article
 */
export declare function restoreArticle(id: string, userId: string): Promise<{
    category: {
        name: string;
        id: string;
        slug: string;
    };
    author: {
        name: string;
        id: string;
    };
} & {
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
/**
 * Publish an article and trigger social distribution
 */
export declare function publishArticle(id: string, userId: string): Promise<{
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
/**
 * Archive an article
 */
export declare function archiveArticle(id: string, userId: string): Promise<{
    status: import(".prisma/client").$Enums.ArticleStatus;
    title: string;
    content: string;
    id: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    excerpt: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    deletedAt: Date | null;
    views: number;
    readTime: number;
    seoTitle: string | null;
    seoDesc: string | null;
    isBreaking: boolean;
    isFeatured: boolean;
    authorId: string;
}>;
export {};
//# sourceMappingURL=article.service.d.ts.map