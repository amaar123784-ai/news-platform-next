"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon, Button } from '@/components/atoms';
import { StatCard } from '@/components/molecules';
import { ViewsChart, TrafficChart, GrowthChart } from '@/components/organisms/analytics';
import { analyticsService } from '@/services';

export default function AdminDashboardPage() {
    // Fetch stats from API
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['analytics', 'stats'],
        queryFn: () => analyticsService.getStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch recent activity
    const { data: activityData } = useQuery({
        queryKey: ['analytics', 'activity'],
        queryFn: () => analyticsService.getActivityLogs({ perPage: 4 }),
    });

    // Fetch charts data
    const { data: viewsData } = useQuery({
        queryKey: ['analytics', 'views'],
        queryFn: () => analyticsService.getViewsData(),
    });

    const { data: trafficData } = useQuery({
        queryKey: ['analytics', 'traffic'],
        queryFn: () => analyticsService.getTrafficData(),
    });

    const { data: growthData } = useQuery({
        queryKey: ['analytics', 'growth'],
        queryFn: () => analyticsService.getGrowthData(),
    });

    const statCards = stats ? [
        { icon: 'ri-eye-line', label: 'المشاهدات', value: stats.views.toLocaleString(), trend: { value: stats.viewsTrend, direction: stats.viewsTrend >= 0 ? 'up' as const : 'down' as const }, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { icon: 'ri-article-line', label: 'المقالات', value: stats.articles.toLocaleString(), trend: { value: Math.abs(stats.articlesTrend), direction: stats.articlesTrend >= 0 ? 'up' as const : 'down' as const }, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
        { icon: 'ri-user-line', label: 'المستخدمين', value: stats.users.toLocaleString(), trend: { value: Math.abs(stats.usersTrend), direction: stats.usersTrend >= 0 ? 'up' as const : 'down' as const }, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
        { icon: 'ri-chat-1-line', label: 'التعليقات', value: stats.comments.toLocaleString(), trend: { value: Math.abs(stats.commentsTrend), direction: stats.commentsTrend >= 0 ? 'up' as const : 'down' as const }, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    ] : [];

    const recentActivities = activityData?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">لوحة القيادة</h1>
                    <p className="text-gray-500 text-sm mt-1">نظرة عامة على أداء المنصة</p>
                </div>
                <Link href="/admin/articles/create">
                    <Button variant="primary">
                        <Icon name="ri-add-line" className="ml-2" />
                        مقال جديد
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                    // Skeleton loading
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))
                ) : (
                    statCards.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))
                )}
            </div>

            {/* Charts Row 1: Views & Traffic */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViewsChart data={viewsData} />
                <TrafficChart data={trafficData} />
            </div>

            {/* Charts Row 2: Growth & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GrowthChart data={growthData} />

                {/* Recent Activity Feed */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 font-brand">النشاط الأخير</h3>
                        <Link href="/admin/activity" className="text-sm text-primary hover:underline">
                            عرض الكل
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentActivities.length > 0 ? recentActivities.map((activity: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    <Icon name={
                                        activity.action === 'CREATE' ? 'ri-add-line' :
                                            activity.action === 'UPDATE' ? 'ri-edit-line' :
                                                activity.action === 'DELETE' ? 'ri-delete-bin-line' :
                                                    activity.action === 'PUBLISH' ? 'ri-file-edit-line' :
                                                        'ri-history-line'
                                    } />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user?.name || 'مستخدم'}</span>
                                        {' '}{activity.action === 'CREATE' ? 'أنشأ' : activity.action === 'UPDATE' ? 'عدّل' : activity.action === 'DELETE' ? 'حذف' : activity.action}{' '}
                                        <span className="text-primary">{activity.targetTitle}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(activity.createdAt).toLocaleString('ar-YE')}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400">
                                <Icon name="ri-time-line" size="xl" className="mx-auto mb-2" />
                                <p>لا توجد نشاطات حديثة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
