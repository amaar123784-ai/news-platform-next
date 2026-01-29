/**
 * Notification Service
 * Handles system notifications for admin dashboard
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
    private static instance: NotificationService;

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Create a new system notification
     */
    public async createNotification(
        type: string,
        title: string,
        message: string,
        data?: Record<string, any>
    ): Promise<void> {
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
        } catch (error: any) {
            console.error(`[Notification] Failed to create:`, error.message);
        }
    }

    /**
     * Get unread notification count
     */
    public async getUnreadCount(): Promise<number> {
        return prisma.systemNotification.count({
            where: { isRead: false }
        });
    }

    /**
     * Get all notifications (paginated)
     */
    public async getNotifications(options: { page?: number; perPage?: number; unreadOnly?: boolean } = {}) {
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
    public async markAsRead(id: string): Promise<void> {
        await prisma.systemNotification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    /**
     * Mark all notifications as read
     */
    public async markAllAsRead(): Promise<void> {
        await prisma.systemNotification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });
    }

    /**
     * Delete a notification
     */
    public async deleteNotification(id: string): Promise<void> {
        await prisma.systemNotification.delete({
            where: { id }
        });
    }

    /**
     * Delete old notifications (cleanup)
     */
    public async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
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
