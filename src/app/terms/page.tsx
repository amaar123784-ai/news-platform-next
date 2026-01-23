import { Header, Footer } from "@/components/organisms";
import { Container, Icon } from "@/components/atoms";

export const metadata = {
    title: "الشروط والأحكام | صوت تهامة",
    description: "شروط الاستخدام والسياسات القانونية لمنصة صوت تهامة.",
};

export default function TermsPage() {
    const lastUpdated = "22 يناير 2026";

    return (
        <>
            <Header />
            <main className="min-h-screen bg-white">
                {/* Page Title */}
                <div className="bg-gray-50 border-b border-gray-100 py-12">
                    <Container>
                        <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-secondary rounded-full"></span>
                            الشروط والأحكام
                        </h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            <Icon name="ri-file-list-3-line" />
                            <span>آخر تحديث: {lastUpdated}</span>
                        </p>
                    </Container>
                </div>

                <Container className="py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none text-gray-700 space-y-12">

                            {/* Intro */}
                            <div className="bg-gray-50 border-r-4 border-secondary rounded-l-xl p-6">
                                <p className="text-lg font-medium text-gray-800 m-0 leading-relaxed">
                                    أهلاً بك في منصة "صوت تهامة". يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام الموقع. استخدامك للموقع يعني موافقتك الكاملة على هذه الشروط.
                                </p>
                            </div>

                            {/* Terms Sections using Grid for better readability */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 font-bold text-lg">1</div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">قبول الشروط</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        يعد وصولك واستخدامك للموقع إقراراً منك بالموافقة على جميع الشروط الواردة هنا. إذا كنت لا توافق على أي جزء، يرجى التوقف عن استخدام الموقع فوراً.
                                    </p>
                                </section>

                                <section className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary mb-4 font-bold text-lg">2</div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">حقوق الملكية الفكرية</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        جميع المحتويات (نصوص، صور، فيديو، شعارات) هي ملك لمنصة "صوت تهامة" ومحمية بموجب قوانين الملكية الفكرية. يمنع نسخ أو إعادة نشر المحتوى دون إذن كتابي.
                                    </p>
                                </section>

                                <section className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 mb-4 font-bold text-lg">3</div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">السلوك المحظور</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        يمنع استخدام الموقع لأي غرض غير قانوني، أو نشر تعليقات مسيئة، أو محاولة اختراق الموقع، أو انتحال شخصيات الآخرين.
                                    </p>
                                </section>

                                <section className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 font-bold text-lg">4</div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">إخلاء المسؤولية</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        في حين نسعى للدقة، لا تضمن المنصة خلو المحتوى من الأخطاء العرضية، ولا نتحمل مسؤولية أي قرارات تتخذ بناءً على المعلومات الواردة.
                                    </p>
                                </section>
                            </div>

                            {/* Footer/Contact Note */}
                            <div className="bg-gray-900 text-white rounded-2xl p-8 text-center mt-12">
                                <h3 className="text-xl font-bold mb-2">هل لديك استفسار قانوني؟</h3>
                                <p className="text-gray-400 mb-6">فريقنا القانوني جاهز للرد على استفساراتك حول شروط الاستخدام.</p>
                                <a
                                    href="/contact"
                                    className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                                >
                                    <Icon name="ri-mail-line" />
                                    تواصل معنا
                                </a>
                            </div>

                        </div>
                    </div>
                </Container>
            </main>
            <Footer />
        </>
    );
}
