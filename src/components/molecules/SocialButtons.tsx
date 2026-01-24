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
    const handleGoogleLogin = async () => {
        // Implementation note: In a real environment, you would use @react-oauth/google 
        // or the native window.google.accounts.id.initialize load.
        // For now, we simulate the token retrieval or provide instructions.

        showError('يرجى تهيئة مفاتيح Google Client ID أولاً في الإعدادات');
        console.warn('[SocialAuth] Google login triggered. Requires Client ID.');
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
