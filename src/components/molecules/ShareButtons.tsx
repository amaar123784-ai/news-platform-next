"use client";

import { Icon } from "@/components/atoms";

import { useState, useEffect } from "react";

export interface ShareButtonsProps {
    title?: string;
    excerpt?: string;
    className?: string;
}

export function ShareButtons({ title, excerpt, className = "" }: ShareButtonsProps) {
    const [currentUrl, setCurrentUrl] = useState("");

    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || document.title,
                    text: excerpt,
                    url: currentUrl,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(currentUrl);
            alert("تم نسخ الرابط");
        }
    };

    if (!currentUrl) return null;

    // Sharing templates
    const twitterText = `${title || ""} #اليمن #صوت_تهامة`;
    const whatsappText = `*${title || ""}*\n\n${excerpt || ""}\n\nاقرأ المزيد على منصة صوت تهامة:\n${currentUrl}`;

    return (
        <div className={`flex gap-3 ${className}`}>
            <button
                onClick={handleShare}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                title="نسخ الرابط"
            >
                <Icon name="ri-link" size="lg" />
            </button>
            <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(twitterText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition"
                title="مشاركة على منصة X"
            >
                <Icon name="ri-twitter-x-line" size="lg" />
            </a>
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-[#1877F2] text-white rounded-full hover:bg-blue-700 transition"
                title="مشاركة على فيسبوك"
            >
                <Icon name="ri-facebook-fill" size="lg" />
            </a>
            <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-[#25D366] text-white rounded-full hover:bg-green-600 transition"
                title="مشاركة على واتساب"
            >
                <Icon name="ri-whatsapp-line" size="lg" />
            </a>
        </div>
    );
}
