"use client";

/**
 * Footer Component
 * 
 * Site footer with links, social icons, and copyright.
 * 
 * @see components.footer in design-system.json
 * 
 * @example
 * <Footer />
 */

import React from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Container, Icon } from '@/components/atoms';
import { settingsService } from '@/services/settings.service';

export interface FooterProps {
    /** Whether to show "Politics" section specific links */
    variant?: 'default' | 'politics' | 'dashboard';
}

const mainSections = [
    { path: '/', label: 'الرئيسية' },
    { path: '/category/politics', label: 'سياسة' },
    { path: '/category/economy', label: 'اقتصاد' },
    { path: '/category/sports', label: 'رياضة' },
    { path: '/category/culture', label: 'ثقافة' },
    { path: '/category/technology', label: 'تكنولوجيا' },
].map(link => ({ label: link.label, href: link.path }));

const services = [
    { label: 'من نحن', href: '/about' },
    { label: 'اتصل بنا', href: '/contact' },
    { label: 'سياسة الخصوصية', href: '/privacy' },
    { label: 'الشروط والأحكام', href: '/terms' },
    { label: 'الأخبار العاجلة', href: '/breaking' },
];

export const Footer: React.FC<FooterProps> = ({
    variant = 'default',
}) => {
    const { data: settings } = useQuery({
        queryKey: ['public-settings'],
        queryFn: () => settingsService.getPublicSettings(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const siteName = settings?.general?.siteName || 'صوت تهامة';
    const footerDesc = settings?.general?.footerDescription || 'منصة "صوت تهامة" الإخبارية، نقدم لكم آخر الأخبار والتطورات من تهامة واليمن والعالم بمصداقية عالية.';
    const email = settings?.general?.officialEmail || 'info@yemennews.com';
    const phone = settings?.general?.phoneNumber || '+967 1 234567';

    const socialLinks = [
        { icon: 'ri-facebook-fill', href: settings?.social?.facebook || '#', label: 'Facebook' },
        { icon: 'ri-twitter-x-fill', href: settings?.social?.twitter || '#', label: 'Twitter' },
        { icon: 'ri-youtube-fill', href: settings?.social?.youtube || '#', label: 'YouTube' },
        { icon: 'ri-telegram-fill', href: settings?.social?.telegram || '#', label: 'Telegram' },
        { icon: 'ri-whatsapp-fill', href: settings?.social?.whatsapp ? `https://wa.me/${settings.social.whatsapp.replace(/\s+/g, '')}` : '#', label: 'WhatsApp' },
    ].filter(link => link.href !== '#');

    return (
        <footer className="bg-gray-900 border-t-4 border-secondary text-white mt-12">
            <Container className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 group">
                            <Image
                                src="/images/logo.webp"
                                alt={siteName}
                                width={64}
                                height={64}
                                className="h-16 w-auto group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-white tracking-tight leading-none">{siteName}</span>
                                <span className="text-[10px] font-medium text-secondary tracking-widest mt-1">VOICE OF TIHAMA</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {footerDesc}
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.icon}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-800 text-primary hover:bg-primary hover:text-white rounded-full transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-primary/50"
                                >
                                    <Icon name={social.icon} size="md" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Main Sections */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 relative inline-block">
                            الأقسام الرئيسية
                            <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-primary rounded-full"></span>
                        </h4>
                        <ul className="space-y-3 text-sm">
                            {mainSections.map((section) => (
                                <li key={section.href}>
                                    <a href={section.href} className="text-gray-400 hover:text-primary transition-all duration-300 flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary transition-colors"></span>
                                        <span className="group-hover:translate-x-[-4px] transition-transform">{section.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 relative inline-block">
                            روابط هامة
                            <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-secondary rounded-full"></span>
                        </h4>
                        <ul className="space-y-3 text-sm">
                            {services.map((service) => (
                                <li key={service.href}>
                                    <a href={service.href} className="text-gray-400 hover:text-secondary transition-all duration-300 flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-secondary transition-colors"></span>
                                        <span className="group-hover:translate-x-[-4px] transition-transform">{service.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 relative inline-block">
                            تواصل معنا
                            <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-primary rounded-full"></span>
                        </h4>
                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                                    <Icon name="ri-mail-line" size="sm" />
                                </div>
                                <a href={`mailto:${email}`} className="group-hover:text-white transition-colors">{email}</a>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                                    <Icon name="ri-phone-line" size="sm" />
                                </div>
                                <a href={`tel:${phone.replace(/\s+/g, '')}`} dir="ltr" className="group-hover:text-white transition-colors">{phone}</a>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                                    <Icon name="ri-map-pin-line" size="sm" />
                                </div>
                                <span className="group-hover:text-white transition-colors">الحديدة، الجمهورية اليمنية</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-4 pt-3 text-center text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.</p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
