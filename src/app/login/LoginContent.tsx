"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/organisms/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services";
import { useToast } from "@/components/organisms/Toast";

export function LoginContent() {
    const router = useRouter();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const { success, error: showError } = useToast();

    const handleLogin = async (email: string, password: string, remember: boolean) => {
        setIsLoading(true);
        try {
            const response = await authService.login({ email, password });
            login(response.user);
            success('تم تسجيل الدخول بنجاح');

            // Check role to redirect appropriately
            if (['admin', 'editor', 'journalist'].includes(response.user.role)) {
                router.push("/admin");
            } else {
                router.push("/");
            }
        } catch (err: any) {
            console.error(err);
            showError(err.message || 'فشل تسجيل الدخول Check your credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        console.log("Social login with:", provider);
    };

    const handleForgotPassword = () => {
        router.push("/forgot-password");
    };

    const handleCreateAccount = () => {
        router.push("/register");
    };

    return (
        <LoginForm
            onSubmit={handleLogin}
            onSocialLogin={handleSocialLogin}
            onForgotPassword={handleForgotPassword}
            onCreateAccount={handleCreateAccount}
            isLoading={isLoading}
        />
    );
}
