/**
 * AuthLayout Template
 * 
 * Layout for authentication pages (login, register, password reset).
 * Centered content with minimal header and footer.
 * 
 * @see pageTemplates.authPage in design-system.json
 * 
 * @example
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 */

import React from 'react';
import { Header, Footer } from '@/components/organisms';

export interface AuthLayoutProps {
    /** Auth form content */
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {/* Header - without nav links */}
            <Header />

            {/* Centered Content */}
            <main
                className="flex-1 flex items-center justify-center py-12 px-4"
                style={{ minHeight: 'calc(100vh - 64px - 200px)' }}
            >
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default AuthLayout;
