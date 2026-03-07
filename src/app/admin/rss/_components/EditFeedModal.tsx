import React from 'react';
import { Button } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import type { CreateFeedData } from './types';

interface EditFeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedFormData: CreateFeedData;
    categories: Array<{ id: string; name: string }>;
    isPending: boolean;
    onChangeFeedForm: (patch: Partial<CreateFeedData>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function EditFeedModal({
    isOpen,
    onClose,
    feedFormData,
    categories,
    isPending,
    onChangeFeedForm,
    onSubmit,
}: EditFeedModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تعديل الرابط" width="max-w-md">
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رابط RSS</label>
                    <input
                        type="url"
                        value={feedFormData.feedUrl}
                        onChange={(e) => onChangeFeedForm({ feedUrl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        dir="ltr"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                    <select
                        value={feedFormData.categoryId}
                        onChange={(e) => onChangeFeedForm({ categoryId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    >
                        <option value="">اختر التصنيف</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">فترة التحديث (دقائق)</label>
                    <input
                        type="number"
                        value={feedFormData.fetchInterval}
                        onChange={(e) => onChangeFeedForm({ fetchInterval: Number(e.target.value) })}
                        min={5}
                        max={1440}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                        {isPending ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
