import type { CreateFeedData } from './types';

interface FeedRowFormProps {
    index: number;
    feed: CreateFeedData;
    showRemove: boolean;
    categories: Array<{ id: string; name: string }>;
    onUpdate: (index: number, field: keyof CreateFeedData, value: CreateFeedData[keyof CreateFeedData]) => void;
    onRemove: (index: number) => void;
}

export function FeedRowForm({ index, feed, showRemove, categories, onUpdate, onRemove }: FeedRowFormProps) {
    return (
        <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">رابط {index + 1}</span>
                {showRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="إزالة الرابط"
                    >
                        <i className="ri-close-line" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                    type="url"
                    value={feed.feedUrl}
                    onChange={(e) => onUpdate(index, 'feedUrl', e.target.value)}
                    placeholder="رابط RSS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    dir="ltr"
                    required
                />
                <select
                    value={feed.categoryId}
                    onChange={(e) => onUpdate(index, 'categoryId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    required
                >
                    <option value="">اختر التصنيف</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <span className="text-gray-600">التحديث كل</span>
                    <input
                        type="number"
                        value={feed.fetchInterval}
                        onChange={(e) => onUpdate(index, 'fetchInterval', Number(e.target.value))}
                        min={5}
                        max={1440}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                    <span className="text-gray-600">دقيقة</span>
                </label>
            </div>
        </div>
    );
}
