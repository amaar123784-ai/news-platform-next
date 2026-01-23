"use client";

import { useRouter } from "next/navigation";
import { AddUserForm } from "@/components/organisms/AddUserForm";

export function RegisterContent() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push("/login");
    };

    const handleCancel = () => {
        router.push("/");
    };

    return (
        <AddUserForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
