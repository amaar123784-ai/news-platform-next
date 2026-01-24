import { LoginContent } from "./LoginContent";
import { Header, Footer } from "@/components/organisms";
import { Container } from "@/components/atoms";
import Link from "next/link";

export const metadata = {
    title: "تسجيل الدخول | صوت تهامة",
    description: "تسجيل الدخول إلى حسابك",
};

export default function LoginPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 py-12 flex items-center">
                <Container>
                    <LoginContent />
                </Container>
            </main>
            <Footer />
        </>
    );
}
