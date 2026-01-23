import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">الصفحة غير موجودة</h2>
            <p className="text-gray-500 mb-6">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
            <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                العودة للرئيسية
            </Link>
        </div>
    );
}
