import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white mt-12">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">📰</span>
                            <span className="text-xl font-bold">أخبار اليمن</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            منصة إخبارية شاملة تقدم آخر الأخبار والتحليلات من اليمن وتهامة.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold mb-4">روابط سريعة</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-white transition">
                                    الرئيسية
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition">
                                    من نحن
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white transition">
                                    اتصل بنا
                                </Link>
                            </li>
                            <li>
                                <Link href="/sitemap" className="hover:text-white transition">
                                    خريطة الموقع
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-bold mb-4">الأقسام</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link href="/category/politics" className="hover:text-white transition">
                                    السياسة
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/economy" className="hover:text-white transition">
                                    الاقتصاد
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/sports" className="hover:text-white transition">
                                    الرياضة
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/culture" className="hover:text-white transition">
                                    الثقافة
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-bold mb-4">قانوني</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link href="/privacy" className="hover:text-white transition">
                                    سياسة الخصوصية
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-white transition">
                                    شروط الاستخدام
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>© {currentYear} أخبار اليمن. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
}
