import { RegisterContent } from "./RegisterContent";
import { Header, Footer } from "@/components/organisms";
import { Container } from "@/components/atoms";

export const metadata = {
    title: "إنشاء حساب | أخبار اليمن",
    description: "انضم إلينا وأنشئ حسابك الجديد",
};

export default function RegisterPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 py-12">
                <Container>
                    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
                            <p className="text-gray-600">انضم إلى مجتمعنا وشارك في النقاش</p>
                        </div>
                        <RegisterContent />
                    </div>
                </Container>
            </main>
            <Footer />
        </>
    );
}
