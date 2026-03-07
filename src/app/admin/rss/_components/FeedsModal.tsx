import React from 'react';
import { Button } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { FeedItem } from './FeedItem';
import type { RSSSource, RSSFeed, CreateFeedData } from './types';

interface FeedsModalProps {
    source: RSSSource | null;
    isOpen: boolean;
    onClose: () => void;
    feedFormData: CreateFeedData;
    categories: Array<{ id: string; name: string }>;
    isAddPending: boolean;
    isFetchFeedPending: boolean;
    onChangeFeedForm: (patch: Partial<CreateFeedData>) => void;
    onAddFeed: (e: React.FormEvent) => void;
    onFetchFeed: (id: string) => void;
    onEditFeed: (feed: RSSFeed) => void;
    onDeleteFeed: (feed: RSSFeed) => void;
}

export function FeedsModal({
    source,
    isOpen,
    onClose,
    feedFormData,
    categories,
    isAddPending,
    isFetchFeedPending,
    onChangeFeedForm,
    onAddFeed,
    onEditFeed,
    onFetchFeed,
    onDeleteFeed,
}: FeedsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`إدارة روابط "${source?.name || ''}"`}
            width="max-w-2xl"
        >
            <div className="space-y-4">
                {/* Existing feeds */}
                <div className="space-y-2">
                    {source?.feeds?.map((feed) => (
                        <FeedItem
                            key={feed.id}
                            feed={feed}
                            isFetchPending={isFetchFeedPending}
                            onFetch={onFetchFeed}
                            onEdit={onEditFeed}
                            onDelete={onDeleteFeed}
                        />
                    ))}
                    {(!source?.feeds || source.feeds.length === 0) && (
                        <div className="text-center py-4 text-gray-500">لا توجد روابط لهذا المصدر</div>
                    )}
                </div>

                {/* Add new feed inline form */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">إضافة رابط جديد</h4>
                    <form onSubmit={onAddFeed} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="url"
                                value={feedFormData.feedUrl}
                                onChange={(e) => onChangeFeedForm({ feedUrl: e.target.value })}
                                placeholder="رابط RSS"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                dir="ltr"
                                required
                            />
                            <select
                                value={feedFormData.categoryId}
                                onChange={(e) => onChangeFeedForm({ categoryId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                required
                            >
                                <option value="">اختر التصنيف</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button type="submit" variant="primary" size="sm" disabled={isAddPending}>
                                {isAddPending ? 'جاري الإضافة...' : 'إضافة'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
