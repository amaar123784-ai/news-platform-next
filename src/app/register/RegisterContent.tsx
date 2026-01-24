"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/organisms/RegisterForm";

export function RegisterContent() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push("/login");
    };

    const handleCancel = () => {
        router.push("/");
    };

    return (
        <RegisterForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
