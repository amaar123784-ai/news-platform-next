/**
 * API Types
 * 
 * TypeScript types for API requests and responses.
 */

// Base API Response wrapper
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
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

// Error response
export interface ApiError {
    message: string;
    code: string;
    status: number;
    details?: Record<string, string[]>;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    refreshToken?: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}

// User types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'journalist' | 'reader';
    avatar?: string;
    bio?: string;
    googleId?: string;
    facebookId?: string;
    createdAt: string;
    updatedAt: string;
    isActive?: boolean;
}

export interface SocialLoginRequest {
    token: string;
}

// Article types
export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: Category;
    author: User;
    status: 'draft' | 'review' | 'published' | 'archived';
    imageUrl?: string;
    tags: string[];
    views: number;
    readTime: number;
    isBreaking: boolean;
    isFeatured: boolean;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateArticleRequest {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status: Article['status'];
    imageUrl?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
    id: string;
}

// Category types
export interface Category {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon?: string;
    description?: string;
    articleCount: number;
    isActive: boolean;
}

// Comment types
export interface Comment {
    id: string;
    content: string;
    author: User;
    article?: { id: string; title: string; slug: string };
    articleId: string;
    parentId?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    likes: number;
    createdAt: string;
}

// Analytics types
export interface AnalyticsStats {
    views: number;
    viewsTrend: number;
    articles: number;
    articlesTrend: number;
    users: number;
    usersTrend: number;
    comments: number;
    commentsTrend: number;
}

export interface ViewsData {
    name: string;
    views: number;
    visitors: number;
}

export interface TrafficData {
    name: string;
    value: number;
}

export interface GrowthData {
    name: string;
    newUsers: number;
    returning: number;
}

// Activity Log types  
export interface ActivityLog {
    id: string;
    action: string;
    user: User;
    targetType: 'article' | 'user' | 'comment' | 'settings' | 'category';
    targetId: string;
    targetTitle: string;
    details?: string;
    createdAt: string;
}

export type StatusType = 'published' | 'draft' | 'review' | 'archived' | 'PENDING' | 'APPROVED' | 'REJECTED';
