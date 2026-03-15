import Image from 'next/image';
import { Button, Icon } from '@/components/atoms';
import { DataTable } from '@/components/organisms';
import { TableSkeleton } from '@/components/molecules';
import { getImageUrl } from '@/lib/api';
import type { RSSSource } from './types';

interface SourceTableProps {
    sources: RSSSource[];
    isLoading: boolean;
    isError: boolean;
    isFetchPending: boolean;
    onAdd: () => void;
    onOpenFeeds: (source: RSSSource) => void;
    onEdit: (source: RSSSource) => void;
    onDelete: (source: RSSSource) => void;
    onFetchSource: (id: string) => void;
}

export function SourceTable({
    sources,
    isLoading,
    isError,
    isFetchPending,
    onAdd,
    onOpenFeeds,
    onEdit,
    onDelete,
    onFetchSource,
}: SourceTableProps) {
    if (isLoading) {
        return <TableSkeleton rows={5} columns={5} />;
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-red-500">
                <Icon name="ri-error-warning-line" size="2xl" className="mb-2" />
                <p>حدث خطأ في تحميل المصادر</p>
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <div className="p-12 text-center">
                <Icon name="ri-rss-line" size="2xl" className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">لا توجد مصادر RSS</h3>
                <p className="text-gray-500 mt-1 mb-4">ابدأ بإضافة مصدر أخبار جديد</p>
                <Button variant="primary" onClick={onAdd}>
                    <Icon name="ri-add-line" className="ml-2" />
                    إضافة مصدر
                </Button>
            </div>
        );
    }

    return (
        <DataTable
            data={sources}
            columns={[
                {
                    key: 'name',
                    header: 'المصدر',
                    render: (source: RSSSource) => (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                {source.logoUrl ? (
                                    <Image
                                        src={getImageUrl(source.logoUrl)}
                                        alt={source.name}
                                        fill
                                        sizes="32px"
                                        className="object-contain"
                                    />
                                ) : (
                                    <Icon name="ri-rss-line" className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{source.name}</div>
                                <div className="text-xs text-gray-500">
                                    {source._count?.feeds || 0} رابط
                                </div>
                            </div>
                        </div>
                    ),
                },
                {
                    key: 'feeds',
                    header: 'الروابط والتصنيفات',
                    render: (source: RSSSource) => (
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {source.feeds?.slice(0, 3).map((feed) => (
                                <span
                                    key={feed.id}
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${feed.status === 'ERROR'
                                            ? 'bg-red-100 text-red-700'
                                            : feed.status === 'PAUSED'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : ''
                                        }`}
                                    style={
                                        feed.status === 'ACTIVE'
                                            ? {
                                                backgroundColor: `${feed.category?.color || '#2563EB'}20`,
                                                color: feed.category?.color || '#2563EB',
                                            }
                                            : {}
                                    }
                                    title={feed.feedUrl}
                                >
                                    {feed.category?.name}
                                </span>
                            ))}
                            {(source.feeds?.length || 0) > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    +{(source.feeds?.length || 0) - 3}
                                </span>
                            )}
                        </div>
                    ),
                },
                {
                    key: '_count',
                    header: 'المقالات',
                    render: (source: RSSSource) => (
                        <span className="text-gray-600">{source._count?.articles || 0}</span>
                    ),
                },
            ]}
            actions={(source: RSSSource) => (
                <div className="flex gap-1">
                    <button
                        onClick={() => onOpenFeeds(source)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="إدارة الروابط"
                    >
                        <Icon name="ri-links-line" />
                    </button>
                    <button
                        onClick={() => onFetchSource(source.id)}
                        disabled={isFetchPending}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="جلب الأخبار"
                    >
                        <Icon name="ri-download-line" />
                    </button>
                    <button
                        onClick={() => onEdit(source)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                    >
                        <Icon name="ri-edit-line" />
                    </button>
                    <button
                        onClick={() => onDelete(source)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                    >
                        <Icon name="ri-delete-bin-line" />
                    </button>
                </div>
            )}
        />
    );
}
