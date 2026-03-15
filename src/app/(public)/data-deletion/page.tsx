import type { Metadata } from 'next';
import { Container, Icon } from "@/components/atoms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "حذف البيانات | صوت تهامة",
    description: "إرشادات حول كيفية طلب حذف بياناتك الشخصية من منصة صوت تهامة.",
    alternates: { canonical: `${siteUrl}/data-deletion` },
};

export default function DataDeletionPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Page Title */}
            <div className="bg-gray-50 border-b border-gray-100 py-12">
                <Container>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                        <span className="w-2 h-8 bg-red-500 rounded-full"></span>
                        تعليمات حذف البيانات
                    </h1>
                </Container>
            </div>

            <Container className="py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg max-w-none text-gray-700 space-y-12">

                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
                            <p className="lead text-lg font-medium text-gray-800 m-0">
                                وفقاً لقواعد الخصوصية وحماية البيانات، يحق لمستخدمي منصة "صوت تهامة" (بما في ذلك المستخدمين عبر تطبيقينا على فيسبوك والمنصات الأخرى) طلب حذف بياناتهم الشخصية في أي وقت.
                            </p>
                        </div>

                        <section>
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6 group">
                                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold">1</span>
                                كيفية طلب حذف البيانات
                            </h2>
                            <p className="mb-4">إذا كنت ترغب في حذف بياناتك الشخصية المرتبطة بحسابك أو نشاطك على موقعنا أو تطبيقاتنا، يرجى اتباع الخطوات التالية:</p>
                            
                            <ol className="list-decimal pl-5 space-y-3 text-gray-700 font-medium" dir="rtl">
                                <li>قم بإرسال بريد إلكتروني إلى: <strong>privacy@voiceoftihama.com</strong> (أو تواصل معنا عبر <a href="/contact" className="text-primary hover:underline">صفحة اتصل بنا</a>).</li>
                                <li>اكتب في عنوان الرسالة: <strong>"طلب حذف بيانات شخصية"</strong>.</li>
                                <li>قم بتضمين المعلومات التي تساعدنا في التعرف على حسابك (مثل البريد الإلكتروني المستخدم، أو رابط حسابك على فيسبوك إذا كنت قد سجلت الدخول به).</li>
                                <li>بمجرد استلام طلبك، سنقوم بمعالجته وحذف بياناتك من خوادمنا بشكل دائم خلال فترة لا تتجاوز 7 أيام عمل.</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 mb-6 group">
                                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold">2</span>
                                كيفية إزالة وصول تطبيقنا من حسابك على فيسبوك
                            </h2>
                            <p className="mb-4">إذا قمت بربط حسابك على فيسبوك بتطبيقنا وترغب الآن في إزالة هذا الربط، يمكنك القيام بذلك بسهولة من خلال إعدادات فيسبوك الخاصة بك:</p>
                            
                            <ul className="list-disc pl-5 space-y-3 text-gray-700" dir="rtl">
                                <li>انتقل إلى حسابك على فيسبوك وانقر على صورتك الشخصية في أعلى اليسار لعرض القائمة.</li>
                                <li>اختر <strong>"الإعدادات والخصوصية" (Settings & Privacy)</strong> ثم انقر على <strong>"الإعدادات" (Settings)</strong>.</li>
                                <li>في القائمة الجانبية، مرر لأسفل وانقر على <strong>"التطبيقات ومواقع الويب" (Apps and Websites)</strong>.</li>
                                <li>ابحث عن تطبيقنا ("صوت تهامة") في القائمة وانقر على <strong>"إزالة" (Remove)</strong> بجانبه.</li>
                                <li>اتبع التعليمات التي تظهر على الشاشة لتأكيد الإزالة.</li>
                            </ul>
                        </section>

                        <hr className="border-gray-100 my-12" />

                        <div className="text-center text-gray-500 text-sm">
                            <p>لمزيد من المعلومات حول كيفية تعاملنا مع بياناتك، يرجى مراجعة <a href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</a> الخاصة بنا.</p>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
