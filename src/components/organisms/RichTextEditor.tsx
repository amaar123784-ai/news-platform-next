"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/atoms';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onImageRequest?: (callback: (url: string) => void) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
    onImageRequest,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync external value changes to internal contentEditable
    // Only if not focused to avoid cursor jumping
    useEffect(() => {
        if (contentRef.current && !isFocused && value !== contentRef.current.innerHTML) {
            contentRef.current.innerHTML = value;
        }
    }, [value, isFocused]);

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
            contentRef.current.focus();
        }
    };

    const handleInput = () => {
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
        }
    };

    const ToolbarButton = ({
        icon,
        command,
        arg,
        title,
        onClick
    }: {
        icon: string,
        command?: string,
        arg?: string,
        title: string,
        onClick?: () => void
    }) => (
        <button
            type="button"
            onClick={onClick ? onClick : () => command && execCommand(command, arg)}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-primary rounded-lg transition-colors"
            title={title}
        >
            <Icon name={icon} />
        </button>
    );

    const handleImageClick = () => {
        if (onImageRequest) {
            onImageRequest((url) => execCommand('insertImage', url));
        } else {
            const url = prompt('أدخل رابط الصورة:', 'https://');
            if (url) execCommand('insertImage', url);
        }
    };

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className} ${isFocused ? 'ring-2 ring-primary/20 border-primary' : ''}`}>
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
                <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                    <ToolbarButton icon="ri-bold" command="bold" title="غامق" />
                    <ToolbarButton icon="ri-italic" command="italic" title="مائل" />
                    <ToolbarButton icon="ri-underline" command="underline" title="تسطير" />
                    <ToolbarButton icon="ri-strikethrough" command="strikeThrough" title="يتوسطه خط" />
                </div>

                <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                    <ToolbarButton icon="ri-h-1" command="formatBlock" arg="<h1>" title="عنوان 1" />
                    <ToolbarButton icon="ri-h-2" command="formatBlock" arg="<h2>" title="عنوان 2" />
                    <ToolbarButton icon="ri-h-3" command="formatBlock" arg="<h3>" title="عنوان 3" />
                    <ToolbarButton icon="ri-paragraph" command="formatBlock" arg="<p>" title="فقرة" />
                </div>

                <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                    <ToolbarButton icon="ri-list-unordered" command="insertUnorderedList" title="قائمة نقطية" />
                    <ToolbarButton icon="ri-list-ordered" command="insertOrderedList" title="قائمة رقمية" />
                </div>

                <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                    <ToolbarButton icon="ri-double-quotes-l" command="formatBlock" arg="<blockquote>" title="اقتباس" />
                    <ToolbarButton
                        icon="ri-link"
                        onClick={() => {
                            const url = prompt('أدخل الرابط:', 'https://');
                            if (url) execCommand('createLink', url);
                        }}
                        title="رابط"
                    />
                    <ToolbarButton
                        icon="ri-image-add-line"
                        onClick={handleImageClick}
                        title="صورة"
                    />
                </div>

                <div className="flex gap-1 pr-2 mr-auto">
                    <ToolbarButton icon="ri-arrow-go-back-line" command="undo" title="تراجع" />
                    <ToolbarButton icon="ri-arrow-go-forward-line" command="redo" title="إعادة" />
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={contentRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="prose prose-lg max-w-none p-4 min-h-[400px] outline-none text-right font-body empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                dir="rtl"
                data-placeholder={placeholder}
            />
        </div>
    );
};
