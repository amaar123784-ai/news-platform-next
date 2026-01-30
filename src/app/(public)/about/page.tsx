import type { Metadata } from 'next';

import { Container, Icon } from "@/components/atoms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

export const metadata: Metadata = {
    title: "من نحن | صوت تهامة",
    description: "تعرف على منصة صوت تهامة، رسالتنا، رؤيتنا، وقيمنا في نقل الحقيقة.",
    alternates: { canonical: `${siteUrl}/about` },
    openGraph: {
        title: "من نحن | صوت تهامة",
        description: "تعرف على منصة صوت تهامة، رسالتنا، رؤيتنا، وقيمنا في نقل الحقيقة.",
        url: `${siteUrl}/about`,
        type: 'website',
        locale: 'ar_YE',
        siteName: 'صوت تهامة',
    },
};

export default function AboutPage() {
    return (
        <>

            <main className="min-h-screen bg-white">
                {/* Page Title */}
                <div className="bg-gray-50 border-b border-gray-100 py-12">
                    <Container>
                        <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-secondary rounded-full"></span>
                            من نحن
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            منصة إخبارية يمنية مستقلة، تنقل الحقيقة بمهنية ومصداقية لكل اليمنيين.
                        </p>
                    </Container>
                </div>

                <Container className="py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8">
                            <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">قصة التأسيس</h2>
                                    <p className="leading-loose">
                                        تأسست منصة "صوت تهامة" لتكون منبراً إعلامياً مستقلاً يعنى بقضايا المواطن اليمني، وتحديداً في منطقة تهامة والساحل الغربي.
                                        انطلقنا من إيمان عميق بأن الإعلام هو صوت من لا صوت له، وأن الحقيقة هي حق للجميع.
                                    </p>
                                    <p className="leading-loose">
                                        نعمل عبر فريق من الصحفيين والمراسلين المحترفين لتقديم تغطية إخبارية تواكب الأحداث لحظة بلحظة، ملتزمين في ذلك بأعلى معايير المهنية والموضوعية.
                                    </p>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary mb-4">
                                            <Icon name="ri-eye-line" size="lg" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">رؤيتنا</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            أن نكون المصدر الخبري الأول والأكثر موثوقية في اليمن، ونموذجاً للإعلام الهادف الذي يجمع بين رصانة الطرح وحداثة الوسيلة.
                                        </p>
                                    </div>

                                    <div className="bg-green-50/50 p-6 rounded-xl border border-green-100">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-secondary mb-4">
                                            <Icon name="ri-flag-line" size="lg" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">رسالتنا</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            نقل الواقع كما هو، وتسليط الضوء على الجوانب الإنسانية والتنموية، وتعزيز قيم التعايش والسلام في المجتمع.
                                        </p>
                                    </div>
                                </div>

                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">قيمنا</h2>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none pl-0">
                                        {[
                                            { title: 'المصداقية', desc: 'نلتزم الدقة في نقل المعلومة.' },
                                            { title: 'الموضوعية', desc: 'نقف على مسافة واحدة من الجميع.' },
                                            { title: 'الاستقلالية', desc: 'قرارنا التحريري حر ومستقل.' },
                                            { title: 'الإنسان أولاً', desc: 'قضايا الناس هي أولويتنا القصوى.' },
                                        ].map((val, idx) => (
                                            <li key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                <Icon name="ri-checkbox-circle-line" className="text-secondary mt-1 shrink-0" />
                                                <div>
                                                    <span className="block font-bold text-gray-900">{val.title}</span>
                                                    <span className="text-sm text-gray-600">{val.desc}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Fast Facts */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">أرقام وحقائق</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">التأسيس</span>
                                        <span className="font-bold text-gray-900">2024</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">التغطية</span>
                                        <span className="font-bold text-gray-900">شاملة (اليمن)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">المقر الرئيسي</span>
                                        <span className="font-bold text-gray-900">الحديدة</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Widget */}
                            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                                <h3 className="font-bold text-gray-900 mb-2">تواصل معنا</h3>
                                <p className="text-sm text-gray-600 mb-4">لديك استفسار أو مقترح؟ نحن هنا للاستماع.</p>
                                <a
                                    href="/contact"
                                    className="block w-full py-2.5 text-center bg-white border border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-colors"
                                >
                                    اتصل بنا
                                </a>
                            </div>
                        </div>
                    </div>
                </Container>
            </main>

        </>
    );
}
