"use client";

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Icon } from '@/components/atoms';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    onImageRequest?: (callback: (url: string) => void) => void;
}

const MenuBar = ({ editor, onImageRequest }: { editor: any, onImageRequest?: (callback: (url: string) => void) => void }) => {
    if (!editor) {
        return null;
    }

    const handleImageClick = () => {
        if (onImageRequest) {
            onImageRequest((url) => {
                editor.chain().focus().setImage({ src: url }).run();
            });
        }
    };

    const handleLinkClick = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('أدخل الرابط:', previousUrl);
        
        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const ToolbarButton = ({ icon, isActive, onClick, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-primary'
            }`}
        >
            <Icon name={icon} />
        </button>
    );

    return (
        <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
            <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                <ToolbarButton icon="ri-bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="غامق" />
                <ToolbarButton icon="ri-italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="مائل" />
                <ToolbarButton icon="ri-strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="يتوسطه خط" />
            </div>

            <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                <ToolbarButton icon="ri-h-1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="عنوان 1" />
                <ToolbarButton icon="ri-h-2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="عنوان 2" />
                <ToolbarButton icon="ri-h-3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="عنوان 3" />
                <ToolbarButton icon="ri-paragraph" onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="فقرة" />
            </div>

            <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                <ToolbarButton icon="ri-list-unordered" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="قائمة نقطية" />
                <ToolbarButton icon="ri-list-ordered" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="قائمة رقمية" />
            </div>

            <div className="flex gap-1 border-l pl-2 ml-2 border-gray-300">
                <ToolbarButton icon="ri-double-quotes-l" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="اقتباس" />
                <ToolbarButton icon="ri-link" onClick={handleLinkClick} isActive={editor.isActive('link')} title="رابط" />
                <ToolbarButton icon="ri-image-add-line" onClick={handleImageClick} title="صورة" />
            </div>

            <div className="flex gap-1 pr-2 mr-auto">
                <ToolbarButton icon="ri-arrow-go-back-line" onClick={() => editor.chain().focus().undo().run()} title="تراجع" />
                <ToolbarButton icon="ri-arrow-go-forward-line" onClick={() => editor.chain().focus().redo().run()} title="إعادة" />
            </div>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
    onImageRequest,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full my-4 shadow-sm',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none p-4 min-h-[400px] outline-none text-right font-body',
                dir: 'rtl',
            },
        },
    });

    // Sync external value changes (like when loading initial data)
    useEffect(() => {
        if (editor && value && editor.getHTML() !== value) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className} ${isFocused ? 'ring-2 ring-primary/20 border-primary' : ''}`}>
            <MenuBar editor={editor} onImageRequest={onImageRequest} />
            <EditorContent editor={editor} />
        </div>
    );
};
