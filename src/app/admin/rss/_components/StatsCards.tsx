import type { RSSSource } from './types';

interface StatsCardsProps {
    sources: RSSSource[];
}

export function StatsCards({ sources }: StatsCardsProps) {
    const totalFeeds = sources.reduce((sum, s) => sum + (s._count?.feeds || 0), 0);
    const totalArticles = sources.reduce((sum, s) => sum + (s._count?.articles || 0), 0);
    const activeFeeds = sources.reduce(
        (sum, s) => sum + (s.feeds?.filter(f => f.status === 'ACTIVE').length || 0),
        0,
    );
    const errorFeeds = sources.reduce(
        (sum, s) => sum + (s.feeds?.filter(f => f.status === 'ERROR').length || 0),
        0,
    );

    const stats = [
        { label: 'إجمالي المصادر', value: sources.length, className: 'text-gray-900' },
        { label: 'روابط نشطة', value: activeFeeds, className: 'text-green-600' },
        { label: 'بها أخطاء', value: errorFeeds, className: 'text-red-600' },
        { label: 'إجمالي المقالات', value: totalArticles, className: 'text-blue-600' },
    ];

    // Silence the unused var warning — totalFeeds is shown in the page header
    void totalFeeds;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, className }) => (
                <div key={label} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className={`text-2xl font-bold ${className}`}>{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                </div>
            ))}
        </div>
    );
}
