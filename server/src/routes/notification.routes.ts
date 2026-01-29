/**
 * Notification Routes
 * API endpoints for system notifications
 */

import { Router } from 'express';
import { notificationService } from '../services/notification.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/notifications - List all notifications
 */
router.get('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20));
        const unreadOnly = req.query.unreadOnly === 'true';

        const result = await notificationService.getNotifications({ page, perPage, unreadOnly });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications/count - Get unread count
 */
router.get('/count', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        const count = await notificationService.getUnreadCount();

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/:id/read - Mark as read
 */
router.patch('/:id/read', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        await notificationService.markAsRead(req.params.id);

        res.json({
            success: true,
            message: 'تم تحديد الإشعار كمقروء'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/read-all - Mark all as read
 */
router.patch('/read-all', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res, next) => {
    try {
        await notificationService.markAllAsRead();

        res.json({
            success: true,
            message: 'تم تحديد جميع الإشعارات كمقروءة'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notifications/:id - Delete notification
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
    try {
        await notificationService.deleteNotification(req.params.id);

        res.json({
            success: true,
            message: 'تم حذف الإشعار'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
