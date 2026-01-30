import type { Metadata } from 'next';

import { Container, Icon } from "@/components/atoms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "سياسة الخصوصية | صوت تهامة",
    description: "سياسة الخصوصية وشروط الاستخدام لمنصة صوت تهامة.",
    alternates: { canonical: `${siteUrl}/privacy` },
    openGraph: {
        title: "سياسة الخصوصية | صوت تهامة",
        description: "سياسة الخصوصية وشروط الاستخدام لمنصة صوت تهامة.",
        url: `${siteUrl}/privacy`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
};

export default function PrivacyPage() {
    const lastUpdated = "22 يناير 2026";

    return (
        <>

            <main className="min-h-screen bg-white">
                {/* Page Title */}
                <div className="bg-gray-50 border-b border-gray-100 py-12">
                    <Container>
                        <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-secondary rounded-full"></span>
                            سياسة الخصوصية
                        </h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            <Icon name="ri-time-line" />
                            <span>آخر تحديث: {lastUpdated}</span>
                        </p>
                    </Container>
                </div>

                <Container className="py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none text-gray-700 space-y-12">

                            {/* Intro */}
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                                <p className="lead text-lg font-medium text-gray-800 m-0">
                                    ندرك في منصة "صوت تهامة" أهمية خصوصية بياناتك. تم إعداد هذه السياسة لمساعدتك على فهم طبيعة البيانات التي نقوم بجمعها منك عند زيارتك لموقعنا وكيفية تعاملنا مع هذه البيانات الشخصية.
                                </p>
                            </div>

                            {/* Section 1 */}
                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6 group">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold">1</span>
                                    البيانات التي نجمعها
                                </h2>
                                <p className="mb-4">عند زيارتك للموقع، قد نقوم بجمع المعلومات التالية:</p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
                                    {[
                                        'المعلومات التي تقدمها طوعاً (مثل الاسم والبريد).',
                                        'بيانات التصفح التقنية (عنوان IP، نوع المتصفح).',
                                        'تفاعلاتك مع المحتوى (القراءة، التعليقات).',
                                        'تفضيلاتك الشخصية في إعدادات الموقع.',
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <Icon name="ri-checkbox-circle-line" className="text-secondary shrink-0" />
                                            <span className="text-sm font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6 group">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold">2</span>
                                    كيف نستخدم معلوماتك
                                </h2>
                                <p className="mb-6">نستخدم البيانات التي نجمعها للأغراض التالية:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-center group">
                                        <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Icon name="ri-magic-line" size="lg" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">تحسين التجربة</h3>
                                        <p className="text-sm text-gray-600">فهم احتياجاتك وتقديم محتوى يناسب اهتماماتك.</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-center group">
                                        <div className="w-12 h-12 bg-green-50 text-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Icon name="ri-mail-send-line" size="lg" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">التواصل الفعال</h3>
                                        <p className="text-sm text-gray-600">إرسال النشرات البريدية أو الرد على استفساراتك.</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-center group">
                                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Icon name="ri-shield-keyh-line" size="lg" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">الأمان والحماية</h3>
                                        <p className="text-sm text-gray-600">حماية الموقع من المحاولات الضارة والاحتيال.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6 group">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold">3</span>
                                    ملفات الارتباط (Cookies)
                                </h2>
                                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                    <div className="flex gap-4">
                                        <Icon name="ri-information-line" className="text-orange-500 text-xl mt-1 shrink-0" />
                                        <p className="text-gray-700 mb-0">
                                            نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل وتطوير الموقع. يمكنك تعديل إعدادات المتصفح لرفض ملفات تعريف الارتباط،
                                            ولكن قد يؤثر ذلك على عمل بعض ميزات الموقع.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-gray-100 my-12" />

                            <div className="text-center text-gray-500 text-sm">
                                <p>لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر <a href="/contact" className="text-primary hover:underline">صفحة اتصل بنا</a>.</p>
                            </div>
                        </div>
                    </div>
                </Container>
            </main>

        </>
    );
}
