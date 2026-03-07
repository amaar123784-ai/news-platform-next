import type { SourceFormValues } from './types';

interface SourceFormProps {
    formData: SourceFormValues;
    onChange: (patch: Partial<SourceFormValues>) => void;
}

/**
 * Shared controlled fields for source metadata.
 * Used by both AddSourceModal and EditSourceModal.
 */
export function SourceForm({ formData, onChange }: SourceFormProps) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">بيانات المصدر</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المصدر <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="مثال: الجزيرة"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رابط الموقع</label>
                    <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => onChange({ websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        dir="ltr"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                    <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => onChange({ logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.webp"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        dir="ltr"
                    />
                </div>
            </div>
        </div>
    );
}
