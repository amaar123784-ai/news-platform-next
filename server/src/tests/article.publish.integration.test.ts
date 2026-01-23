/**
 * Article Publishing Integration Tests
 * 
 * End-to-end tests for the article publishing workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock Prisma
const mockPrisma = {
    article: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    category: {
        findUnique: vi.fn(),
    },
    activityLog: {
        create: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
};

vi.mock('../index.js', () => ({
    prisma: mockPrisma,
}));

vi.mock('../config/env.js', () => ({
    env: {
        JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
        JWT_REFRESH_SECRET: 'test-refresh-secret-key-minimum-32-characters',
        JWT_EXPIRES_IN: '1d',
        JWT_REFRESH_EXPIRES_IN: '7d',
        NODE_ENV: 'test',
        FRONTEND_URL: 'http://localhost:5173',
    },
}));

import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

describe('Article Publishing Integration Tests', () => {
    let app: Express;
    let adminToken: string;
    let journalistToken: string;
    let readerToken: string;

    // Test data
    const mockCategory = {
        id: 'cat-123',
        name: 'سياسة',
        slug: 'politics',
        color: '#FF0000',
    };

    const mockAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
    };

    const mockJournalist = {
        id: 'journalist-123',
        email: 'journalist@example.com',
        name: 'Journalist User',
        role: 'JOURNALIST',
        isActive: true,
    };

    const mockReader = {
        id: 'reader-123',
        email: 'reader@example.com',
        name: 'Reader User',
        role: 'READER',
        isActive: true,
    };

    beforeAll(() => {
        // Generate test tokens
        const secret = 'test-secret-key-minimum-32-characters-long';
        adminToken = jwt.sign(
            { userId: mockAdmin.id, email: mockAdmin.email, role: mockAdmin.role },
            secret,
            { expiresIn: '1h' }
        );
        journalistToken = jwt.sign(
            { userId: mockJournalist.id, email: mockJournalist.email, role: mockJournalist.role },
            secret,
            { expiresIn: '1h' }
        );
        readerToken = jwt.sign(
            { userId: mockReader.id, email: mockReader.email, role: mockReader.role },
            secret,
            { expiresIn: '1h' }
        );
    });

    beforeEach(() => {
        app = createApp();
        vi.clearAllMocks();

        // Setup default mocks
        mockPrisma.user.findUnique.mockImplementation(({ where }) => {
            if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
            if (where.id === mockJournalist.id) return Promise.resolve(mockJournalist);
            if (where.id === mockReader.id) return Promise.resolve(mockReader);
            return Promise.resolve(null);
        });

        mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
        mockPrisma.activityLog.create.mockResolvedValue({ id: 'log-123' });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============= Article Creation Tests =============

    describe('POST /api/articles - Create Article', () => {
        const validArticleData = {
            title: 'عنوان المقال التجريبي',
            excerpt: 'مقتطف المقال التجريبي للاختبار',
            content: 'محتوى المقال التجريبي الكامل يجب أن يكون أطول من خمسين حرفاً لاجتياز التحقق من الصحة',
            categoryId: 'cat-123',
            status: 'DRAFT',
        };

        it('should reject unauthenticated requests', async () => {
            const response = await request(app)
                .post('/api/articles')
                .send(validArticleData);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('UNAUTHORIZED');
        });

        it('should reject readers from creating articles', async () => {
            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${readerToken}`)
                .send(validArticleData);

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
        });

        it('should allow journalist to create draft article', async () => {
            const createdArticle = {
                id: 'article-123',
                ...validArticleData,
                slug: 'عنوان-المقال-التجريبي',
                authorId: mockJournalist.id,
                readTime: 1,
                author: { id: mockJournalist.id, name: mockJournalist.name },
                category: mockCategory,
            };

            mockPrisma.article.findUnique.mockResolvedValue(null); // No duplicate slug
            mockPrisma.article.create.mockResolvedValue(createdArticle);

            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${journalistToken}`)
                .send(validArticleData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(validArticleData.title);
            expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'CREATE',
                        targetType: 'article',
                    }),
                })
            );
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${journalistToken}`)
                .send({ title: 'Short' }); // Missing required fields

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });

        it('should handle duplicate slug by appending timestamp', async () => {
            const existingArticle = { id: 'existing-123', slug: 'test-slug' };
            mockPrisma.article.findUnique.mockResolvedValueOnce(existingArticle);
            mockPrisma.article.create.mockResolvedValue({
                id: 'article-new',
                ...validArticleData,
                slug: 'test-slug-1737484800000',
                author: { id: mockJournalist.id, name: mockJournalist.name },
                category: mockCategory,
            });

            const response = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${journalistToken}`)
                .send(validArticleData);

            expect(response.status).toBe(201);
            expect(response.body.data.slug).toMatch(/.*-\d+$/);
        });
    });

    // ============= Article Publishing Tests =============

    describe('POST /api/articles/:id/publish - Publish Article', () => {
        const draftArticle = {
            id: 'article-123',
            title: 'مقال للنشر',
            status: 'DRAFT',
            authorId: mockJournalist.id,
        };

        it('should reject unauthenticated publish request', async () => {
            const response = await request(app)
                .post('/api/articles/article-123/publish');

            expect(response.status).toBe(401);
        });

        it('should reject journalist from publishing (only ADMIN/EDITOR)', async () => {
            mockPrisma.article.findUnique.mockResolvedValue(draftArticle);

            const response = await request(app)
                .post('/api/articles/article-123/publish')
                .set('Authorization', `Bearer ${journalistToken}`);

            expect(response.status).toBe(403);
        });

        it('should allow admin to publish article', async () => {
            const publishedArticle = {
                ...draftArticle,
                status: 'PUBLISHED',
                publishedAt: new Date(),
            };

            mockPrisma.article.update.mockResolvedValue(publishedArticle);

            const response = await request(app)
                .post('/api/articles/article-123/publish')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('PUBLISHED');
            expect(mockPrisma.article.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'article-123' },
                    data: expect.objectContaining({
                        status: 'PUBLISHED',
                        publishedAt: expect.any(Date),
                    }),
                })
            );
        });

        it('should log publish activity', async () => {
            mockPrisma.article.update.mockResolvedValue({
                ...draftArticle,
                status: 'PUBLISHED',
            });

            await request(app)
                .post('/api/articles/article-123/publish')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(mockPrisma.activityLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'PUBLISH',
                        targetType: 'article',
                        targetId: 'article-123',
                    }),
                })
            );
        });
    });

    // ============= Article Lifecycle Tests =============

    describe('Complete Article Lifecycle', () => {
        it('should handle full workflow: create → update → publish → archive', async () => {
            const articleId = 'lifecycle-article';

            // Step 1: Create draft
            const draft = {
                id: articleId,
                title: 'مقال دورة الحياة',
                status: 'DRAFT',
                authorId: mockJournalist.id,
                author: { id: mockJournalist.id, name: mockJournalist.name },
                category: mockCategory,
            };
            mockPrisma.article.findUnique.mockResolvedValue(null);
            mockPrisma.article.create.mockResolvedValue(draft);

            const createResponse = await request(app)
                .post('/api/articles')
                .set('Authorization', `Bearer ${journalistToken}`)
                .send({
                    title: 'مقال دورة الحياة',
                    excerpt: 'مقتطف المقال للاختبار الشامل',
                    content: 'محتوى المقال الكامل يجب أن يكون طويلاً بما يكفي لاجتياز التحقق من الخمسين حرفاً المطلوبة',
                    categoryId: 'cat-123',
                });

            expect(createResponse.status).toBe(201);

            // Step 2: Update article
            const updated = { ...draft, title: 'عنوان محدث' };
            mockPrisma.article.findUnique.mockResolvedValue(draft);
            mockPrisma.article.update.mockResolvedValue(updated);

            const updateResponse = await request(app)
                .patch(`/api/articles/${articleId}`)
                .set('Authorization', `Bearer ${journalistToken}`)
                .send({ title: 'عنوان محدث' });

            expect(updateResponse.status).toBe(200);

            // Step 3: Publish (admin only)
            const published = { ...updated, status: 'PUBLISHED' };
            mockPrisma.article.update.mockResolvedValue(published);

            const publishResponse = await request(app)
                .post(`/api/articles/${articleId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(publishResponse.status).toBe(200);
            expect(publishResponse.body.data.status).toBe('PUBLISHED');

            // Step 4: Archive
            const archived = { ...published, status: 'ARCHIVED' };
            mockPrisma.article.update.mockResolvedValue(archived);

            const archiveResponse = await request(app)
                .post(`/api/articles/${articleId}/archive`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(archiveResponse.status).toBe(200);
            expect(archiveResponse.body.data.status).toBe('ARCHIVED');
        });
    });

    // ============= Error Handling Tests =============

    describe('Error Handling', () => {
        it('should handle non-existent article gracefully', async () => {
            mockPrisma.article.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .patch('/api/articles/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'New Title' });

            expect(response.status).toBe(404);
            expect(response.body.code).toBe('ARTICLE_NOT_FOUND');
        });

        it('should prevent journalist from editing others\' articles', async () => {
            const otherArticle = {
                id: 'other-article',
                authorId: 'other-journalist',
                status: 'DRAFT',
            };
            mockPrisma.article.findUnique.mockResolvedValue(otherArticle);

            const response = await request(app)
                .patch('/api/articles/other-article')
                .set('Authorization', `Bearer ${journalistToken}`)
                .send({ title: 'Trying to edit' });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('FORBIDDEN');
        });
    });
});
