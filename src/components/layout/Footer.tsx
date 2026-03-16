import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white mt-16 pt-16 pb-8 border-t-4 border-primary">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-white p-1">
                                <Image 
                                    src="/images/logo.webp" 
                                    alt="صوت تهامة" 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <span className="block text-xl font-black text-white leading-none">صوت تهامة</span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Voice of Tihama</span>
                            </div>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            منصة إخبارية تهامية مستقلة، تسعى لنقل الحقيقة وتسليط الضوء على قضايا تهامة واليمن برؤية مهنية وموضوعية.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                                <Icon name="ri-facebook-fill" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                                <Icon name="ri-twitter-x-fill" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                                <Icon name="ri-telegram-fill" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                                <Icon name="ri-youtube-fill" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 relative inline-block">
                            روابط سريعة
                            <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-arrow-left-s-line" className="text-primary opacity-0 group-hover:opacity-100 transition-all -mr-4 group-hover:mr-0" />
                                    <span>الرئيسية</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-arrow-left-s-line" className="text-primary opacity-0 group-hover:opacity-100 transition-all -mr-4 group-hover:mr-0" />
                                    <span>من نحن</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-arrow-left-s-line" className="text-primary opacity-0 group-hover:opacity-100 transition-all -mr-4 group-hover:mr-0" />
                                    <span>اتصل بنا</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-arrow-left-s-line" className="text-primary opacity-0 group-hover:opacity-100 transition-all -mr-4 group-hover:mr-0" />
                                    <span>البحث المتقدم</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Top Categories */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 relative inline-block">
                            أهم الأقسام
                            <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/category/politics" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-government-line" size="sm" />
                                    <span>السياسة</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/economy" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-money-dollar-circle-line" size="sm" />
                                    <span>الاقتصاد</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/sports" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-football-line" size="sm" />
                                    <span>الرياضة</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/culture" className="text-gray-400 hover:text-primary flex items-center gap-2 transition-colors group">
                                    <Icon name="ri-book-2-line" size="sm" />
                                    <span>الثقافة والفنون</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 relative inline-block">
                            تواصل معنا
                            <span className="absolute -bottom-2 right-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-gray-400">
                                <Icon name="ri-mail-send-line" className="text-primary mt-1" />
                                <div>
                                    <span className="block text-white font-medium text-sm">البريد الإلكتروني</span>
                                    <a href="mailto:info@voiceoftihama.com" className="text-xs hover:text-primary">info@voiceoftihama.com</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-gray-400">
                                <Icon name="ri-map-pin-line" className="text-primary mt-1" />
                                <div>
                                    <span className="block text-white font-medium text-sm">المقر الرئيسي</span>
                                    <span className="text-xs">الحديدة - اليمن</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>© {currentYear} صوت تهامة. جميع الحقوق محفوظة.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link>
                        <Link href="/data-deletion" className="hover:text-white transition-colors">حذف البيانات</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
