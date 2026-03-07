import React from 'react';
import { Button } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { SourceForm } from './SourceForm';
import type { SourceFormValues } from './types';

interface EditSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: SourceFormValues;
    isPending: boolean;
    onChangeForm: (patch: Partial<SourceFormValues>) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function EditSourceModal({
    isOpen,
    onClose,
    formData,
    isPending,
    onChangeForm,
    onSubmit,
}: EditSourceModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تعديل المصدر" width="max-w-xl">
            <form onSubmit={onSubmit} className="space-y-4">
                <SourceForm formData={formData} onChange={onChangeForm} />

                <p className="text-sm text-gray-500">
                    لإدارة روابط RSS، استخدم زر &quot;إدارة الروابط&quot; من القائمة.
                </p>

                <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" disabled={isPending} className="flex-1">
                        {isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
