import { Header, Footer } from "@/components/organisms";
import { Container, Button, Icon } from "@/components/atoms";

export const metadata = {
    title: "اتصل بنا | صوت تهامة",
    description: "تواصل مع فريق صوت تهامة، نحن هنا لسماع صوتك.",
};

export default function ContactPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-white">
                {/* Page Title */}
                <div className="bg-gray-50 border-b border-gray-100 py-12">
                    <Container>
                        <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-secondary rounded-full"></span>
                            اتصل بنا
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            نرحب بآرائكم واستفساراتكم. فريقنا جاهز للرد على رسائلكم في أقرب وقت.
                        </p>
                    </Container>
                </div>

                <Container className="py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Contact Form */}
                        <div className="lg:col-span-8 order-2 lg:order-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Icon name="ri-mail-send-line" className="text-primary" />
                                    أرسل لنا رسالة
                                </h2>
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                                            <input
                                                type="text"
                                                id="name"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors bg-gray-50 focus:bg-white"
                                                placeholder="أدخل اسمك"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors bg-gray-50 focus:bg-white"
                                                placeholder="example@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">الموضوع</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors bg-gray-50 focus:bg-white"
                                            placeholder="عنوان الرسالة"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">الرسالة</label>
                                        <textarea
                                            id="message"
                                            rows={6}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors bg-gray-50 focus:bg-white resize-y"
                                            placeholder="اكتب رسالتك هنا..."
                                        ></textarea>
                                    </div>

                                    <div className="pt-2">
                                        <Button className="w-full md:w-auto px-8">
                                            إرسال
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 order-1 lg:order-2 space-y-8">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-6">قنوات التواصل</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-3">
                                        <div className="text-secondary mt-1">
                                            <Icon name="ri-map-pin-line" size="lg" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">العنوان</h4>
                                            <p className="text-gray-600 text-sm">عدن، شارع حدة<br />الجمهورية اليمنية</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="text-primary mt-1">
                                            <Icon name="ri-mail-line" size="lg" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">البريد الإلكتروني</h4>
                                            <p className="text-gray-600 text-sm font-sans">info@voiceoftihama.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="text-secondary mt-1">
                                            <Icon name="ri-phone-line" size="lg" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">الهاتف</h4>
                                            <p className="text-gray-600 text-sm font-sans" dir="ltr">+967 1 444 555</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                                <h3 className="font-bold text-blue-900 mb-2">تابعنا</h3>
                                <p className="text-sm text-blue-800 mb-4">كن على اطلاع دائم بآخر الأخبار</p>
                                <div className="flex justify-center gap-3">
                                    {['ri-facebook-fill', 'ri-twitter-x-fill', 'ri-telegram-fill'].map((icon) => (
                                        <a
                                            key={icon}
                                            href="#"
                                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md transition-all hover:scale-105"
                                        >
                                            <Icon name={icon} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </main>
            <Footer />
        </>
    );
}
