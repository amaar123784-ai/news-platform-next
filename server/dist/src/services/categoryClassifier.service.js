/**
 * Category Classifier Service
 * Keyword-based automatic article categorization for mixed RSS sources
 */
// ============= KEYWORD DICTIONARIES =============
const POLITICS_KEYWORDS = [
    // المؤسسات
    'حكومة', 'برلمان', 'رئاسة', 'مجلس الوزراء', 'محكمة', 'أمم متحدة', 'مجلس الأمن',
    'جامعة الدول', 'سفارة', 'قنصلية', 'وزارة', 'معارضة', 'مجلس النواب', 'الكونغرس',
    // الأدوار
    'رئيس', 'وزير', 'نائب', 'سفير', 'مبعوث', 'مسؤول', 'قائد', 'زعيم', 'حاكم',
    'ملك', 'أمير', 'مستشار', 'ناطق رسمي', 'سياسي', 'دبلوماسي', 'محافظ',
    // الأفعال والأحداث
    'انتخابات', 'تصويت', 'مرسوم', 'قرار', 'هدنة', 'مفاوضات', 'اتفاقية', 'قمة',
    'مؤتمر', 'احتجاجات', 'مظاهرة', 'انقلاب', 'صراع', 'حرب', 'اشتباك', 'قصف',
    'غارة', 'سلام', 'حوار', 'عقوبات', 'حصار', 'تطبيع', 'دستور', 'تعديل دستوري',
    // الكيانات اليمنية
    'حزب', 'حوثي', 'انتقالي', 'شرعية', 'تحالف', 'جيش', 'شرطة', 'قوات', 'أمن',
    'مقاومة', 'مليشيا', 'جماعة', 'أنصار الله', 'المجلس الرئاسي', 'الإصلاح',
    'المؤتمر الشعبي', 'الاشتراكي', 'الناصري',
];
const ECONOMY_KEYWORDS = [
    // المالية
    'بنك', 'مصرف', 'عملة', 'دولار', 'ريال', 'يورو', 'سعر الصرف', 'تضخم', 'فائدة',
    'قرض', 'وديعة', 'بورصة', 'أسهم', 'تداول', 'موازنة', 'ميزانية', 'عجز مالي',
    'احتياطي', 'ائتمان', 'سيولة', 'إفلاس', 'ديون', 'سندات',
    // التجارة
    'تجارة', 'استيراد', 'تصدير', 'جمارك', 'بضائع', 'سوق', 'ميناء', 'شحنة',
    'نفط', 'غاز', 'وقود', 'ديزل', 'بترول', 'ذهب', 'معادن', 'سلع',
    // التنمية
    'إعمار', 'مشروع', 'بنية تحتية', 'استثمار', 'تمويل', 'منحة', 'مساعدة',
    'رواتب', 'أجور', 'غلاء', 'أسعار', 'تكلفة', 'اقتصاد', 'اقتصادي', 'تجاري',
    'صناعة', 'زراعة', 'صادرات', 'واردات', 'ناتج محلي', 'نمو اقتصادي',
];
const SPORTS_KEYWORDS = [
    // كرة القدم
    'كرة قدم', 'مباراة', 'هدف', 'مرمى', 'ركلة', 'جزاء', 'ركلة جزاء', 'تسلل',
    'شوط', 'حكم', 'صافرة', 'دوري', 'كأس', 'بطولة', 'نهائي', 'تأهل', 'إقصاء',
    'تصفيات', 'مونديال', 'يورو', 'أبطال أوروبا', 'كأس العالم', 'كأس آسيا',
    // الفرق والأدوار
    'منتخب', 'نادي', 'فريق', 'مدرب', 'لاعب', 'حارس', 'مهاجم', 'مدافع',
    'جمهور', 'مشجعين', 'اتحاد الكرة', 'فيفا', 'كونميبول', 'يويفا',
    // رياضات أخرى
    'أولمبياد', 'سباق', 'رياضي', 'لياقة', 'تدريب', 'ملعب', 'مدرج', 'فوز',
    'خسارة', 'تعادل', 'تتويج', 'ميدالية', 'ذهبية', 'فضية', 'برونزية',
    'تنس', 'سباحة', 'ألعاب قوى', 'ملاكمة', 'كاراتيه', 'رياضة',
    // أندية عربية
    'الأهلي', 'الزمالك', 'الهلال', 'النصر', 'الاتحاد', 'الأهلي السعودي',
];
const TECHNOLOGY_KEYWORDS = [
    // الرقمية
    'تطبيق', 'برنامج', 'موقع', 'إنترنت', 'شبكة', 'واي فاي', 'اتصالات', 'بيانات',
    'سيبراني', 'اختراق', 'هكر', 'قرصنة', 'أمن سيبراني', 'تشفير', 'خصوصية',
    'سحابة', 'سحابية', 'خوادم', 'سيرفر', 'استضافة', 'دومين',
    // الأجهزة
    'هاتف', 'جوال', 'موبايل', 'كمبيوتر', 'لابتوب', 'جهاز', 'شاشة', 'كاميرا',
    'روبوت', 'طائرة مسيرة', 'درون', 'آيفون', 'سامسونج', 'آندرويد', 'آبل',
    // الابتكار
    'ذكاء اصطناعي', 'ابتكار', 'تقنية', 'تكنولوجي', 'تكنولوجيا', 'تحديث', 'نظام',
    'برمجيات', 'برمجة', 'مطور', 'مبرمج', 'كود', 'خوارزمية', 'تعلم آلي',
    // منصات
    'فيسبوك', 'تويتر', 'واتساب', 'إنستغرام', 'تيك توك', 'يوتيوب', 'تيليجرام',
    'منصة', 'شبكة اجتماعية', 'تواصل اجتماعي', 'ميتا', 'غوغل', 'مايكروسوفت',
    'إيلون ماسك', 'سبيس إكس', 'تسلا', 'أوبن أي آي', 'شات جي بي تي',
];
const CULTURE_KEYWORDS = [
    // الفنون
    'فيلم', 'مسلسل', 'سينما', 'مسرح', 'تمثيل', 'ممثل', 'ممثلة', 'فنان', 'فنانة',
    'أغنية', 'موسيقى', 'حفل', 'مهرجان', 'معرض', 'رسم', 'لوحة', 'نحت',
    'تصوير', 'مخرج', 'إخراج', 'سيناريو', 'كليب', 'ألبوم', 'أوبرا',
    // التراث
    'تراث', 'تاريخ', 'آثار', 'مخطوطات', 'أدب', 'شعر', 'رواية', 'كتاب', 'كاتب',
    'شاعر', 'مثقف', 'ندوة', 'مؤلف', 'أديب', 'قصة', 'قصيدة', 'ديوان',
    // الجوائز والفعاليات
    'جوائز', 'أوسكار', 'جرامي', 'غولدن غلوب', 'تكريم', 'إصدار', 'توقيع كتاب',
    'معرض الكتاب', 'نجم', 'نجمة', 'سجادة حمراء', 'بريميير', 'عرض أول',
    // شخصيات فنية
    'محمد عبده', 'عمرو دياب', 'نانسي عجرم', 'أصالة', 'كاظم الساهر',
];
// ============= CLASSIFIER FUNCTIONS =============
/**
 * Count keyword matches in text
 */
function countMatches(text, keywords) {
    let count = 0;
    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
        // Use word boundary matching for accuracy
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            count += matches.length;
        }
    }
    return count;
}
/**
 * Classify an article based on title and excerpt
 * Returns category slug or null if no confident match
 */
export function classifyArticle(title, excerpt = '') {
    const fullText = `${title} ${excerpt}`;
    const scores = {
        politics: countMatches(fullText, POLITICS_KEYWORDS),
        economy: countMatches(fullText, ECONOMY_KEYWORDS),
        sports: countMatches(fullText, SPORTS_KEYWORDS),
        technology: countMatches(fullText, TECHNOLOGY_KEYWORDS),
        culture: countMatches(fullText, CULTURE_KEYWORDS),
    };
    // Find the highest scoring category
    let maxScore = 0;
    let winningCategory = null;
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            winningCategory = category;
        }
    }
    // Calculate confidence (0-100)
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 0;
    // Only return a category if we have at least 1 match and reasonable confidence
    if (maxScore < 1 || confidence < 40) {
        return {
            categorySlug: null,
            confidence: 0,
            scores,
        };
    }
    console.log(`[Classifier] "${title.substring(0, 50)}..." -> ${winningCategory} (${confidence}% confidence, scores: ${JSON.stringify(scores)})`);
    return {
        categorySlug: winningCategory,
        confidence,
        scores,
    };
}
/**
 * Check if a source category is "mixed" (requires auto-classification)
 */
export function isMixedCategory(categorySlug) {
    return categorySlug === 'mixed' || categorySlug === 'منوع';
}
//# sourceMappingURL=categoryClassifier.service.js.map