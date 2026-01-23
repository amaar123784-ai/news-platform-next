/**
 * Analytics Routes
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { paginationSchema } from '../validators/schemas.js';

const router = Router();

// All routes require admin/editor
router.use(authenticate, requireRole('ADMIN', 'EDITOR'));

/**
 * GET /api/analytics/stats - Dashboard overview
 */
router.get('/stats', async (req, res, next) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prevMonth = new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Current period counts
        const [
            totalViews,
            totalArticles,
            totalUsers,
            totalComments,
            lastMonthArticles,
            prevMonthArticles,
            lastMonthUsers,
            prevMonthUsers,
            lastMonthComments,
            prevMonthComments,
        ] = await Promise.all([
            prisma.article.aggregate({ _sum: { views: true } }),
            prisma.article.count({ where: { status: 'PUBLISHED' } }),
            prisma.user.count(),
            prisma.comment.count({ where: { status: 'APPROVED' } }),
            prisma.article.count({ where: { createdAt: { gte: lastMonth } } }),
            prisma.article.count({ where: { createdAt: { gte: prevMonth, lt: lastMonth } } }),
            prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
            prisma.user.count({ where: { createdAt: { gte: prevMonth, lt: lastMonth } } }),
            prisma.comment.count({ where: { createdAt: { gte: lastMonth } } }),
            prisma.comment.count({ where: { createdAt: { gte: prevMonth, lt: lastMonth } } }),
        ]);

        // Calculate trends
        const articlesTrend = prevMonthArticles > 0
            ? Math.round(((lastMonthArticles - prevMonthArticles) / prevMonthArticles) * 100)
            : 100;
        const usersTrend = prevMonthUsers > 0
            ? Math.round(((lastMonthUsers - prevMonthUsers) / prevMonthUsers) * 100)
            : 100;
        const commentsTrend = prevMonthComments > 0
            ? Math.round(((lastMonthComments - prevMonthComments) / prevMonthComments) * 100)
            : 100;

        res.json({
            success: true,
            data: {
                views: totalViews._sum.views || 0,
                viewsTrend: 0,
                articles: totalArticles,
                articlesTrend,
                users: totalUsers,
                usersTrend,
                comments: totalComments,
                commentsTrend,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/views - Views chart data
 */
router.get('/views', async (req, res, next) => {
    try {
        // Since we don't have a view_logs table, we can group articles by month and show views per month of publication
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
        const now = new Date();

        const data = await Promise.all(months.map(async (name, i) => {
            const start = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
            const end = new Date(now.getFullYear(), now.getMonth() - (6 - i) + 1, 0);

            const stats = await prisma.article.aggregate({
                where: { createdAt: { gte: start, lte: end } },
                _sum: { views: true },
                _count: true
            });

            return {
                name,
                views: stats._sum.views || 0,
                visitors: Math.floor((stats._sum.views || 0) * 0.6), // Estimate visitors
            };
        }));

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/traffic - Traffic sources (Simulation based on categories for now)
 */
router.get('/traffic', async (req, res, next) => {
    try {
        const topCategories = await prisma.category.findMany({
            include: { _count: { select: { articles: true } } },
            orderBy: { articles: { _count: 'desc' } },
            take: 5
        });

        const data = topCategories.map(cat => ({
            name: cat.name,
            value: cat._count.articles * 10
        }));

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/growth - Growth (Real users vs estimated returning)
 */
router.get('/growth', async (req, res, next) => {
    try {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
        const now = new Date();

        const data = await Promise.all(months.map(async (name, i) => {
            const start = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
            const end = new Date(now.getFullYear(), now.getMonth() - (6 - i) + 1, 0);

            const newUsers = await prisma.user.count({
                where: { createdAt: { gte: start, lte: end } }
            });

            return {
                name,
                newUsers: newUsers,
                returning: Math.floor(newUsers * 0.4), // Simulated
            };
        }));

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/activity - Activity logs
 */
router.get('/activity', async (req, res, next) => {
    try {
        const { page, perPage } = paginationSchema.parse(req.query);
        const { userId, targetType, action } = req.query;

        const where: any = {};
        if (userId) where.userId = userId;
        if (targetType) where.targetType = targetType;
        if (action) where.action = action;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, role: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.activityLog.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                data: logs,
                meta: {
                    currentPage: page,
                    totalPages: Math.ceil(total / perPage),
                    totalItems: total,
                    perPage,
                },
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/top-articles
 */
router.get('/top-articles', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 50);

        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                id: true,
                title: true,
                slug: true,
                views: true,
                publishedAt: true,
                category: { select: { name: true, slug: true } },
            },
            orderBy: { views: 'desc' },
            take: limit,
        });

        res.json({ success: true, data: articles });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/analytics/activity - Clear old logs
 */
router.delete('/activity', async (req, res, next) => {
    try {
        const { olderThanDays } = req.body;

        if (!olderThanDays || typeof olderThanDays !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'olderThanDays is required and must be a number'
            });
        }

        const date = new Date();
        date.setDate(date.getDate() - olderThanDays);

        const result = await prisma.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: date
                }
            }
        });

        res.json({
            success: true,
            message: `Deleted ${result.count} activity logs`,
            count: result.count
        });
    } catch (error) {
        next(error);
    }
});

export default router;
