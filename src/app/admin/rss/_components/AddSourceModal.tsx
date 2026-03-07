import React from 'react';
import { Button, Icon } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { SourceForm } from './SourceForm';
import { FeedRowForm } from './FeedRowForm';
import type { SourceFormValues, CreateFeedData } from './types';

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: SourceFormValues;
    newFeeds: CreateFeedData[];
    categories: Array<{ id: string; name: string }>;
    isPending: boolean;
    onChangeForm: (patch: Partial<SourceFormValues>) => void;
    onAddFeedRow: () => void;
    onUpdateFeedRow: (index: number, field: keyof CreateFeedData, value: CreateFeedData[keyof CreateFeedData]) => void;
    onRemoveFeedRow: (index: number) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function AddSourceModal({
    isOpen,
    onClose,
    formData,
    newFeeds,
    categories,
    isPending,
    onChangeForm,
    onAddFeedRow,
    onUpdateFeedRow,
    onRemoveFeedRow,
    onSubmit,
}: AddSourceModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إضافة مصدر جديد" width="max-w-2xl">
            <form onSubmit={onSubmit} className="space-y-4">
                <SourceForm formData={formData} onChange={onChangeForm} />

                {/* RSS Feeds list */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">روابط RSS</h3>
                        <Button type="button" variant="secondary" size="sm" onClick={onAddFeedRow}>
                            <Icon name="ri-add-line" className="ml-1" />
                            إضافة رابط
                        </Button>
                    </div>

                    {newFeeds.map((feed, index) => (
                        <FeedRowForm
                            key={index}
                            index={index}
                            feed={feed}
                            showRemove={newFeeds.length > 1}
                            categories={categories}
                            onUpdate={onUpdateFeedRow}
                            onRemove={onRemoveFeedRow}
                        />
                    ))}
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" disabled={isPending} className="flex-1">
                        {isPending ? 'جاري الحفظ...' : 'حفظ المصدر'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
