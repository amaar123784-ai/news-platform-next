/**
 * Database Seed Script
 *
 * Populates the database with initial sample data.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@yemennews.com' },
        update: {
            role: 'ADMIN',
            password: adminPassword,
        },
        create: {
            email: 'admin@yemennews.com',
            password: adminPassword,
            name: 'مدير النظام',
            role: 'ADMIN',
            bio: 'مدير منصة أخبار اليمن',
        },
    });
    console.log('✅ Admin user created:', admin.email);
    // Create Editor User
    const editorPassword = await bcrypt.hash('editor123', 12);
    const editor = await prisma.user.upsert({
        where: { email: 'editor@yemennews.com' },
        update: {},
        create: {
            email: 'editor@yemennews.com',
            password: editorPassword,
            name: 'أحمد المحرر',
            role: 'EDITOR',
            bio: 'رئيس التحرير',
        },
    });
    console.log('✅ Editor user created:', editor.email);
    // Create Journalist User
    const journalistPassword = await bcrypt.hash('journalist123', 12);
    const journalist = await prisma.user.upsert({
        where: { email: 'journalist@yemennews.com' },
        update: {},
        create: {
            email: 'journalist@yemennews.com',
            password: journalistPassword,
            name: 'سارة الصحفية',
            role: 'JOURNALIST',
            bio: 'صحفية في قسم السياسة',
        },
    });
    console.log('✅ Journalist user created:', journalist.email);
    // Create Categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'politics' },
            update: {},
            create: {
                name: 'سياسة',
                slug: 'politics',
                color: '#DC2626',
                icon: 'ri-government-line',
                description: 'آخر الأخبار السياسية المحلية والدولية',
                sortOrder: 1,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'economy' },
            update: {},
            create: {
                name: 'اقتصاد',
                slug: 'economy',
                color: '#059669',
                icon: 'ri-money-dollar-circle-line',
                description: 'أخبار الاقتصاد والمال والأعمال',
                sortOrder: 2,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'sports' },
            update: {},
            create: {
                name: 'رياضة',
                slug: 'sports',
                color: '#2563EB',
                icon: 'ri-football-line',
                description: 'أخبار الرياضة المحلية والعالمية',
                sortOrder: 3,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'technology' },
            update: {},
            create: {
                name: 'تكنولوجيا',
                slug: 'technology',
                color: '#7C3AED',
                icon: 'ri-smartphone-line',
                description: 'آخر أخبار التقنية والابتكار',
                sortOrder: 4,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'culture' },
            update: {},
            create: {
                name: 'ثقافة وفن',
                slug: 'culture',
                color: '#F59E0B',
                icon: 'ri-palette-line',
                description: 'أخبار الثقافة والفنون والأدب',
                sortOrder: 5,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'mixed' },
            update: {},
            create: {
                name: 'منوع',
                slug: 'mixed',
                color: '#6B7280',
                icon: 'ri-apps-line',
                description: 'أخبار متنوعة من مصادر متعددة الفئات - يتم تصنيفها تلقائياً',
                sortOrder: 10,
            },
        }),
    ]);
    console.log('✅ Categories created:', categories.length);
    // Create Sample Articles
    const sampleArticles = [
        {
            title: 'مجلس الوزراء يناقش الموازنة العامة للعام الجديد',
            slug: 'cabinet-discusses-budget-2026',
            excerpt: 'عقد مجلس الوزراء اجتماعه الأسبوعي لمناقشة بنود الموازنة العامة للدولة للعام المالي القادم',
            content: '<p>عقد مجلس الوزراء اجتماعه الأسبوعي برئاسة رئيس الوزراء لمناقشة بنود الموازنة العامة للدولة للعام المالي القادم.</p><p>وأكد المجلس على أهمية ترشيد الإنفاق الحكومي وتوجيه الموارد نحو القطاعات الحيوية كالصحة والتعليم والبنية التحتية.</p><p>كما ناقش المجلس عدداً من المشاريع التنموية الهامة التي ستنعكس إيجاباً على حياة المواطنين.</p>',
            categoryId: categories[0].id, // Politics
            authorId: editor.id,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            views: 1250,
            imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
        },
        {
            title: 'ارتفاع مؤشرات البورصة المحلية بنسبة 2.5%',
            slug: 'stock-market-rises-2-5-percent',
            excerpt: 'شهدت البورصة المحلية ارتفاعاً ملحوظاً في تعاملات اليوم مدفوعة بأداء قوي لأسهم القطاع المصرفي',
            content: '<p>شهدت البورصة المحلية ارتفاعاً ملحوظاً في تعاملات اليوم بنسبة 2.5% مدفوعة بأداء قوي لأسهم القطاع المصرفي والعقاري.</p><p>وقد بلغت قيمة التداولات أكثر من 500 مليون ريال، في حين ارتفعت أسهم أكثر من 60 شركة مقابل تراجع 15 شركة فقط.</p>',
            categoryId: categories[1].id, // Economy
            authorId: journalist.id,
            status: 'PUBLISHED',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            views: 890,
            imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        },
        {
            title: 'المنتخب الوطني يتأهل لنهائيات كأس آسيا',
            slug: 'national-team-qualifies-asia-cup',
            excerpt: 'حقق المنتخب الوطني لكرة القدم فوزاً تاريخياً على نظيره الأسترالي ليتأهل رسمياً لنهائيات كأس آسيا',
            content: '<p>في مباراة مثيرة أقيمت على ملعب العاصمة، حقق المنتخب الوطني لكرة القدم فوزاً تاريخياً بهدفين مقابل هدف على نظيره الأسترالي.</p><p>سجل أهداف الفوز النجمان أحمد علي ومحمد سالم، ليتأهل المنتخب رسمياً لنهائيات كأس آسيا للمرة الثالثة في تاريخه.</p>',
            categoryId: categories[2].id, // Sports
            authorId: editor.id,
            status: 'PUBLISHED',
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            views: 3450,
            imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        },
        {
            title: 'إطلاق تطبيق ذكي جديد للخدمات الحكومية',
            slug: 'new-government-services-app-launched',
            excerpt: 'أعلنت وزارة الاتصالات عن إطلاق تطبيق ذكي جديد يتيح للمواطنين إنجاز أكثر من 50 خدمة حكومية',
            content: '<p>أعلنت وزارة الاتصالات وتقنية المعلومات عن إطلاق تطبيق ذكي جديد يحمل اسم "خدماتي"، يتيح للمواطنين إنجاز أكثر من 50 خدمة حكومية إلكترونياً.</p><p>يتميز التطبيق بواجهة سهلة الاستخدام ودعم كامل للغة العربية، مع إمكانية الدفع الإلكتروني الآمن.</p>',
            categoryId: categories[3].id, // Technology
            authorId: journalist.id,
            status: 'PUBLISHED',
            publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            views: 2100,
            imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        },
        {
            title: 'مهرجان الحديدة للفنون يستقطب آلاف الزوار',
            slug: 'sanaa-arts-festival-attracts-thousands',
            excerpt: 'اختتم مهرجان الحديدة الدولي للفنون فعالياته بنجاح كبير بعد استقطابه أكثر من 50 ألف زائر',
            content: '<p>اختتم مهرجان الحديدة الدولي للفنون التشكيلية فعالياته بنجاح كبير، بعد أن استقطب أكثر من 50 ألف زائر من مختلف المحافظات.</p><p>شارك في المهرجان أكثر من 200 فنان من 15 دولة عربية وأجنبية، قدموا أعمالاً فنية متنوعة في الرسم والنحت والتصوير الفوتوغرافي.</p>',
            categoryId: categories[4].id, // Culture
            authorId: editor.id,
            status: 'PUBLISHED',
            publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
            views: 1850,
            imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
        },
    ];
    for (const article of sampleArticles) {
        await prisma.article.upsert({
            where: { slug: article.slug },
            update: {},
            create: {
                ...article,
                readTime: Math.ceil(article.content.split(/\s+/).length / 200),
            },
        });
    }
    console.log('✅ Sample articles created:', sampleArticles.length);
    // Create some activity logs
    await prisma.activityLog.createMany({
        data: [
            { action: 'LOGIN', targetType: 'user', targetId: admin.id, targetTitle: admin.name, userId: admin.id },
            { action: 'CREATE', targetType: 'article', targetId: 'sample-1', targetTitle: sampleArticles[0].title, userId: editor.id },
            { action: 'PUBLISH', targetType: 'article', targetId: 'sample-2', targetTitle: sampleArticles[1].title, userId: editor.id },
        ],
        skipDuplicates: true,
    });
    console.log('✅ Activity logs created');
    // Create RSS Sources for aggregated news (using new multi-feed schema)
    // 1. BBC Arabic
    let bbcSource = await prisma.rSSSource.findFirst({ where: { name: 'BBC عربي' } });
    if (!bbcSource) {
        bbcSource = await prisma.rSSSource.create({
            data: {
                name: 'BBC عربي',
                websiteUrl: 'https://www.bbc.com/arabic',
                logoUrl: 'https://www.bbc.com/favicon.ico',
                description: 'آخر الأخبار من بي بي سي عربي',
            },
        });
    }
    // Create feed for BBC
    await prisma.rSSFeed.upsert({
        where: { feedUrl: 'https://feeds.bbci.co.uk/arabic/rss.xml' },
        update: { sourceId: bbcSource.id },
        create: {
            feedUrl: 'https://feeds.bbci.co.uk/arabic/rss.xml',
            sourceId: bbcSource.id,
            categoryId: categories[0].id, // Politics
            fetchInterval: 15,
            status: 'ACTIVE',
        },
    });
    // 2. Al Jazeera
    let aljazeeraSource = await prisma.rSSSource.findFirst({ where: { name: 'الجزيرة نت' } });
    if (!aljazeeraSource) {
        aljazeeraSource = await prisma.rSSSource.create({
            data: {
                name: 'الجزيرة نت',
                websiteUrl: 'https://www.aljazeera.net',
                logoUrl: 'https://www.aljazeera.net/favicon.ico',
                description: 'آخر الأخبار من قناة الجزيرة',
            },
        });
    }
    await prisma.rSSFeed.upsert({
        where: { feedUrl: 'https://www.aljazeera.net/rss' },
        update: { sourceId: aljazeeraSource.id },
        create: {
            feedUrl: 'https://www.aljazeera.net/rss',
            sourceId: aljazeeraSource.id,
            categoryId: categories[0].id, // Politics
            fetchInterval: 15,
            status: 'ACTIVE',
        },
    });
    // 3. Sky News Arabia
    let skySource = await prisma.rSSSource.findFirst({ where: { name: 'سكاي نيوز عربية' } });
    if (!skySource) {
        skySource = await prisma.rSSSource.create({
            data: {
                name: 'سكاي نيوز عربية',
                websiteUrl: 'https://www.skynewsarabia.com',
                logoUrl: 'https://www.skynewsarabia.com/favicon.ico',
                description: 'أخبار سكاي نيوز عربية',
            },
        });
    }
    await prisma.rSSFeed.upsert({
        where: { feedUrl: 'https://www.skynewsarabia.com/rss/middle-east' },
        update: { sourceId: skySource.id },
        create: {
            feedUrl: 'https://www.skynewsarabia.com/rss/middle-east',
            sourceId: skySource.id,
            categoryId: categories[0].id, // Politics
            fetchInterval: 15,
            status: 'ACTIVE',
        },
    });
    await prisma.rSSFeed.upsert({
        where: { feedUrl: 'https://www.skynewsarabia.com/rss' },
        update: {},
        create: {
            feedUrl: 'https://www.skynewsarabia.com/rss',
            sourceId: skySource.id,
            categoryId: categories[1].id, // Economy
            fetchInterval: 20,
            status: 'ACTIVE',
        },
    });
    console.log('✅ RSS Sources and Feeds created');
    console.log('🎉 Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map