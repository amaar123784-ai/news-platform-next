"use strict";
/**
 * Analytics Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../index.js");
const auth_js_1 = require("../middleware/auth.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
// All routes require admin/editor
router.use(auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN', 'EDITOR'));
/**
 * GET /api/analytics/stats - Dashboard overview
 */
router.get('/stats', async (req, res, next) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prevMonth = new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Current period counts
        const [totalViews, totalArticles, totalUsers, totalComments, lastMonthArticles, prevMonthArticles, lastMonthUsers, prevMonthUsers,] = await Promise.all([
            index_js_1.prisma.article.aggregate({ _sum: { views: true } }),
            index_js_1.prisma.article.count({ where: { status: 'PUBLISHED' } }),
            index_js_1.prisma.user.count(),
            index_js_1.prisma.comment.count({ where: { status: 'APPROVED' } }),
            index_js_1.prisma.article.count({ where: { createdAt: { gte: lastMonth } } }),
            index_js_1.prisma.article.count({ where: { createdAt: { gte: prevMonth, lt: lastMonth } } }),
            index_js_1.prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
            index_js_1.prisma.user.count({ where: { createdAt: { gte: prevMonth, lt: lastMonth } } }),
        ]);
        // Calculate trends
        const articlesTrend = prevMonthArticles > 0
            ? Math.round(((lastMonthArticles - prevMonthArticles) / prevMonthArticles) * 100)
            : 100;
        const usersTrend = prevMonthUsers > 0
            ? Math.round(((lastMonthUsers - prevMonthUsers) / prevMonthUsers) * 100)
            : 100;
        res.json({
            success: true,
            data: {
                views: totalViews._sum.views || 0,
                viewsTrend: 12, // Would need view tracking over time
                articles: totalArticles,
                articlesTrend,
                users: totalUsers,
                usersTrend,
                comments: totalComments,
                commentsTrend: 5, // Would need comment tracking
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/views - Views chart data
 */
router.get('/views', async (req, res, next) => {
    try {
        // For demo, return last 7 months of aggregated data
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
        // In production, this would query actual view logs
        const data = months.map((name, i) => ({
            name,
            views: Math.floor(4000 + i * 1500 + Math.random() * 500),
            visitors: Math.floor(2400 + i * 800 + Math.random() * 300),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/traffic - Traffic sources
 */
router.get('/traffic', async (req, res, next) => {
    try {
        // In production, this would come from analytics service
        const data = [
            { name: 'بحث Google', value: 4500 },
            { name: 'مباشر', value: 3200 },
            { name: 'وسائل التواصل', value: 2800 },
            { name: 'الإحالات', value: 1500 },
            { name: 'أخرى', value: 800 },
        ];
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/growth - User growth
 */
router.get('/growth', async (req, res, next) => {
    try {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'];
        const data = months.map((name, i) => ({
            name,
            newUsers: Math.floor(120 + i * 40 + Math.random() * 30),
            returning: Math.floor(80 + i * 25 + Math.random() * 20),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/activity - Activity logs
 */
router.get('/activity', async (req, res, next) => {
    try {
        const { page, perPage } = schemas_js_1.paginationSchema.parse(req.query);
        const { userId, targetType, action } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (targetType)
            where.targetType = targetType;
        if (action)
            where.action = action;
        const [logs, total] = await Promise.all([
            index_js_1.prisma.activityLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, role: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            index_js_1.prisma.activityLog.count({ where }),
        ]);
        res.json({
            data: logs,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/top-articles
 */
router.get('/top-articles', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 50);
        const articles = await index_js_1.prisma.article.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map