/**
 * Notification Service
 * Handles system notifications for admin dashboard
 */
export declare class NotificationService {
    private static instance;
    private constructor();
    static getInstance(): NotificationService;
    /**
     * Create a new system notification
     */
    createNotification(type: string, title: string, message: string, data?: Record<string, any>): Promise<void>;
    /**
     * Get unread notification count
     */
    getUnreadCount(): Promise<number>;
    /**
     * Get all notifications (paginated)
     */
    getNotifications(options?: {
        page?: number;
        perPage?: number;
        unreadOnly?: boolean;
    }): Promise<{
        data: any;
        meta: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
            perPage: number;
        };
    }>;
    /**
     * Mark notification as read
     */
    markAsRead(id: string): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Promise<void>;
    /**
     * Delete a notification
     */
    deleteNotification(id: string): Promise<void>;
    /**
     * Delete old notifications (cleanup)
     */
    cleanupOldNotifications(daysOld?: number): Promise<number>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map