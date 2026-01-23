/**
 * ConfirmModal Molecule
 * 
 * Pre-styled modal for destructive actions (Delete, etc).
 */

import React from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Button, Icon } from '@/components/atoms';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmText?: string; // Alias for confirmLabel
    cancelLabel?: string;
    isDestructive?: boolean;
    confirmVariant?: 'primary' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'تأكيد',
    confirmText,
    cancelLabel = 'إلغاء',
    isDestructive = false,
    confirmVariant,
}) => {
    const isDanger = confirmVariant === 'danger' || isDestructive;
    const buttonText = confirmText || confirmLabel;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-md">
            <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Icon name={isDanger ? 'ri-error-warning-line' : 'ri-question-mark'} size="2xl" />
                </div>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={onClose} className="w-full justify-center">
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="primary"
                        className={`w-full justify-center ${isDanger ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
