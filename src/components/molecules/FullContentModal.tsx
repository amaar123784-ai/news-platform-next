"use client";

import React from 'react';
import { Icon, Button } from '@/components/atoms';

interface FullContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    article: {
        title: string;
        fullContent?: string | null;
        sourceUrl: string;
    } | null;
}

export const FullContentModal = ({ isOpen, onClose, article }: FullContentModalProps) => {
    if (!isOpen || !article) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {article.title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <Icon name="ri-close-line" size="lg" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm max-w-none text-right" dir="rtl">
                        {article.fullContent ? (
                            article.fullContent.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">
                                لا يوجد محتوى كامل لهذا المقال.
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
                    <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Icon name="ri-external-link-line" />
                        عرض المصدر الأصلي
                    </a>
                    <Button variant="primary" onClick={onClose}>
                        إغلاق
                    </Button>
                </div>
            </div>
        </div>
    );
};
