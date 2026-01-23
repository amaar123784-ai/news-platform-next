/**
 * Server-Side API Functions
 * 
 * These functions run on the server and use Next.js fetch with caching.
 */

const API_URL = process.env.API_URL || "http://127.0.0.1:5000/api";

// Revalidation times (seconds)
export const REVALIDATE = {
    BREAKING: 30,
    FEATURED: 60,
    ARTICLE_LIST: 60,
    ARTICLE_DETAIL: 300,
    CATEGORIES: 600,
} as const;

// Types
export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl?: string;
    status: string;
    views: number;
    readTime: number;
    seoTitle?: string;
    seoDesc?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        bio?: string;
    };
    category: {
        id: string;
        name: string;
        slug: string;
        color: string;
    };
    tags?: Array<{ tag: { id: string; name: string } }>;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon?: string;
    description?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        perPage: number;
    };
}

// API Functions

export async function getArticles(params?: {
    category?: string;
    page?: number;
    perPage?: number;
    status?: string;
}): Promise<PaginatedResponse<Article>> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("perPage", String(params.perPage));
    if (params?.status) searchParams.set("status", params.status);

    const res = await fetch(`${API_URL}/articles?${searchParams}`, {
        next: { revalidate: REVALIDATE.ARTICLE_LIST },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch articles");
    }

    return res.json();
}

export async function getArticle(idOrSlug: string): Promise<Article | null> {
    try {
        const res = await fetch(`${API_URL}/articles/${idOrSlug}`, {
            next: { revalidate: REVALIDATE.ARTICLE_DETAIL },
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.data;
    } catch {
        return null;
    }
}

export async function getRelatedArticles(idOrSlug: string, limit = 3): Promise<Article[]> {
    try {
        const res = await fetch(`${API_URL}/articles/${idOrSlug}/related?limit=${limit}`, {
            next: { revalidate: REVALIDATE.ARTICLE_DETAIL },
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.data;
    } catch {
        return [];
    }
}

export async function getFeaturedArticles(limit = 5): Promise<Article[]> {
    try {
        const res = await fetch(`${API_URL}/articles/featured?limit=${limit}`, {
            next: { revalidate: REVALIDATE.FEATURED },
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.data;
    } catch {
        return [];
    }
}

export async function getBreakingNews(): Promise<Article[]> {
    try {
        const res = await fetch(`${API_URL}/articles/breaking`, {
            next: { revalidate: REVALIDATE.BREAKING },
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.data;
    } catch {
        return [];
    }
}

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            next: { revalidate: REVALIDATE.CATEGORIES },
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.data;
    } catch {
        return [];
    }
}

export async function getCategory(slug: string): Promise<Category | null> {
    try {
        const res = await fetch(`${API_URL}/categories/${slug}`, {
            next: { revalidate: REVALIDATE.CATEGORIES },
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.data;
    } catch {
        return null;
    }
}

// Helper function to get image URL
export function getImageUrl(path?: string): string {
    if (!path) return "/images/placeholder.jpg";

    let url = path;
    if (!path.startsWith("http")) {
        // Get base URL by removing /api suffix if present
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
        const baseUrl = apiUrl.replace(/\/api\/?$/, "");

        // Ensure path starts with /
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;

        url = `${baseUrl}${normalizedPath}`;
    }

    return url.replace("localhost", "127.0.0.1");
}

// Format date in Arabic
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("ar-YE", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// Format time ago in Arabic
export function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "منذ دقائق";
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
}
