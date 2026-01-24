import { Header, Footer } from "@/components/organisms";
import { Container, Button, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import Link from "next/link";

export const metadata = {
    title: "استعادة كلمة المرور | صوت تهامة",
    description: "استعادة كلمة المرور الخاصة بحسابك",
};

export default function ForgotPasswordPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 py-12 flex items-center">
                <Container>
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2">نسيت كلمة المرور؟</h1>
                            <p className="text-gray-600">
                                لا تقلق، أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة تعيين كلمة المرور.
                            </p>
                        </div>

                        <form className="space-y-6">
                            <FormField
                                label="البريد الإلكتروني"
                                type="email"
                                icon="ri-mail-line"
                                placeholder="name@example.com"
                                required
                            />

                            <Button variant="primary" className="w-full py-3">
                                إرسال رابط الاستعادة
                            </Button>

                            <div className="text-center">
                                <Link href="/login" className="text-sm text-gray-500 hover:text-primary">
                                    العودة لتسجيل الدخول
                                </Link>
                            </div>
                        </form>
                    </div>
                </Container>
            </main>
            <Footer />
        </>
    );
}
