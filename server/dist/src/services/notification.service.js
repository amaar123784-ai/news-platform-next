/**
 * Notification Service
 * Handles system notifications for admin dashboard
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class NotificationService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    /**
     * Create a new system notification
     */
    async createNotification(type, title, message, data) {
        try {
            await prisma.systemNotification.create({
                data: {
                    type,
                    title,
                    message,
                    data: data ?? undefined,
                }
            });
            console.log(`[Notification] Created: ${type} - ${title}`);
        }
        catch (error) {
            console.error(`[Notification] Failed to create:`, error.message);
        }
    }
    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        return prisma.systemNotification.count({
            where: { isRead: false }
        });
    }
    /**
     * Get all notifications (paginated)
     */
    async getNotifications(options = {}) {
        const { page = 1, perPage = 20, unreadOnly = false } = options;
        const where = unreadOnly ? { isRead: false } : {};
        const [notifications, total] = await Promise.all([
            prisma.systemNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * perPage,
                take: perPage
            }),
            prisma.systemNotification.count({ where })
        ]);
        return {
            data: notifications,
            meta: {
                currentPage: page,
                totalPages: Math.ceil(total / perPage),
                totalItems: total,
                perPage
            }
        };
    }
    /**
     * Mark notification as read
     */
    async markAsRead(id) {
        await prisma.systemNotification.update({
            where: { id },
            data: { isRead: true }
        });
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        await prisma.systemNotification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
    }
    /**
     * Delete a notification
     */
    async deleteNotification(id) {
        await prisma.systemNotification.delete({
            where: { id }
        });
    }
    /**
     * Delete old notifications (cleanup)
     */
    async cleanupOldNotifications(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const result = await prisma.systemNotification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                isRead: true
            }
        });
        return result.count;
    }
}
export const notificationService = NotificationService.getInstance();
//# sourceMappingURL=notification.service.js.map