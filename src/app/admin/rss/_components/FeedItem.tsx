import { Icon } from '@/components/atoms';
import type { RSSFeed } from './types';

const statusLabels: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'متوقف', color: 'bg-yellow-100 text-yellow-700' },
    ERROR: { label: 'خطأ', color: 'bg-red-100 text-red-700' },
};

interface FeedItemProps {
    feed: RSSFeed;
    isFetchPending: boolean;
    onFetch: (id: string) => void;
    onEdit: (feed: RSSFeed) => void;
    onDelete: (feed: RSSFeed) => void;
}

export function FeedItem({ feed, isFetchPending, onFetch, onEdit, onDelete }: FeedItemProps) {
    const status = statusLabels[feed.status] ?? { label: feed.status, color: 'bg-gray-100 text-gray-700' };

    return (
        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                    </span>
                    <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${feed.category?.color || '#2563EB'}20`,
                            color: feed.category?.color || '#2563EB',
                        }}
                    >
                        {feed.category?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                        ({feed._count?.articles || 0} مقال)
                    </span>
                </div>
                <div className="text-xs text-gray-500 truncate mt-1" dir="ltr">
                    {feed.feedUrl}
                </div>
            </div>

            <div className="flex gap-1 mr-2">
                <button
                    onClick={() => onFetch(feed.id)}
                    disabled={isFetchPending}
                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="جلب الأخبار"
                >
                    <Icon name="ri-download-line" size="sm" />
                </button>
                <button
                    onClick={() => onEdit(feed)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="تعديل"
                >
                    <Icon name="ri-edit-line" size="sm" />
                </button>
                <button
                    onClick={() => onDelete(feed)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="حذف"
                >
                    <Icon name="ri-delete-bin-line" size="sm" />
                </button>
            </div>
        </div>
    );
}
