"use client";

import React from 'react';
import { Icon } from '@/components/atoms/Icon';

export const SubscribeCTA: React.FC = () => {
    // These would ideally come from a site config file
    const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "https://chat.whatsapp.com/Jtk05k0G8O81d861NJhSHU?mode=gi_t";
    const telegramLink = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL || "https://t.me/voiceoftihama6";

    return (
        <div className="my-10 p-6 md:p-8 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
            {/* Decorative background icon */}
            <div className="absolute -bottom-6 -left-6 opacity-5 pointer-events-none transform -rotate-12">
                <Icon name="ri-notification-3-line" size="xl" className="text-primary !text-9xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-white rounded-full shadow-sm text-primary">
                    <Icon name="ri-megaphone-line" size="lg" />
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 font-arabic">
                    كن أول من يعلم!
                </h3>
                
                <p className="text-gray-600 mb-8 max-w-lg leading-relaxed font-arabic">
                    اشترك في قنواتنا على وسائل التواصل الاجتماعي لتصلك أهم وأحدث أخبار تهامة واليمن العاجلة فور حدوثها.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-sm"
                    >
                        <Icon name="ri-whatsapp-line" />
                        <span>قناة واتساب</span>
                    </a>

                    <a
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-sm"
                    >
                        <Icon name="ri-telegram-line" />
                        <span>قناة تيليجرام</span>
                    </a>
                </div>
            </div>
        </div>
    );
};
