"use client";

/**
 * SocialButtons Component
 * 
 * Provides Google and Facebook login integration.
 */

import React from 'react';
import { Icon } from '@/components/atoms';
import { useToast } from '@/components/organisms/Toast';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

export interface SocialButtonsProps {
    onSuccess?: () => void;
    isLoading?: boolean;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ onSuccess, isLoading: parentLoading }) => {
    const { success, error: showError } = useToast();
    const router = useRouter();
    const [localLoading, setLocalLoading] = React.useState<string | null>(null);

    const isLoading = !!localLoading || parentLoading;

    /**
     * Handle Google Login flow
     * This typically triggers the Google Identity Services popup
     */
    const handleGoogleLogin = () => {
        // Load Google Identity Services script dynamically
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: "586909783605-njeiscdsa6kf303nu4ll3art3so3293l.apps.googleusercontent.com",
                callback: handleGoogleCallback,
                ux_mode: 'popup',
            });
            // @ts-ignore
            window.google.accounts.id.prompt(); // Show One Tap if possible
        };
        document.head.appendChild(script);
    };

    /**
     * Handle Google Credential Callback
     */
    const handleGoogleCallback = async (response: any) => {
        setLocalLoading('google');
        try {
            const loginRes = await authService.loginWithGoogle(response.credential);
            success(`مرحباً بك مجدداً، ${loginRes.user.name}`);
            onSuccess?.();
            router.push('/');
        } catch (err: any) {
            showError(err.message || 'فشل تسجيل الدخول عبر جوجل');
        } finally {
            setLocalLoading(null);
        }
    };

    /**
     * Handle Facebook Login flow
     */
    const handleFacebookLogin = async () => {
        showError('يرجى تهيئة مفاتيح Facebook App ID أولاً في الإعدادات');
        console.warn('[SocialAuth] Facebook login triggered. Requires App ID.');
    };

    return (
        <div className="space-y-4 w-full">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">أو المتابعة باستخدام</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Google Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <Icon name="ri-google-fill" className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">جوجل</span>
                </button>

                {/* Facebook Button */}
                <button
                    type="button"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <Icon name="ri-facebook-box-fill" className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">فيسبوك</span>
                </button>
            </div>
        </div>
    );
};

export default SocialButtons;
