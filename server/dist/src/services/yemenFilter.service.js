/**
 * Yemen-Specific RSS Filter Engine
 *
 * Multi-layered filtering and scoring logic for Yemen-focused news aggregation.
 * Implements: Ingestion gates, Source tiering, Semantic deduplication,
 * Heuristic scoring, and Burst control.
 */
import crypto from 'crypto';
// ============= KEYWORD DICTIONARIES =============
/**
 * Primary Yemen identifiers (Hard Filter - at least one required)
 */
const YEMEN_PRIMARY_KEYWORDS = [
    // Arabic
    'اليمن', 'يمني', 'يمنية', 'اليمنية', 'اليمنيين', 'اليمنيون',
    // English
    'yemen', 'yemeni',
    // Sports
    'المنتخب الوطني', 'منتخب الناشئين', 'منتخب الشباب', 'المنتخب اليمني',
];
/**
 * Secondary entities (Geographic + Political) - At least one required with primary
 */
const YEMEN_SECONDARY_ENTITIES = {
    geographic: [
        // Major cities
        'صنعاء', 'عدن', 'تعز', 'مأرب', 'الحديدة', 'إب', 'ذمار', 'حضرموت', 'المكلا',
        'سيئون', 'عمران', 'صعدة', 'الجوف', 'البيضاء', 'لحج', 'أبين', 'شبوة', 'المهرة',
        'سقطرى', 'الضالع', 'ريمة', 'حجة', 'تهامة',
        // English transliterations
        "sana'a", 'sanaa', 'aden', 'taiz', 'marib', 'hodeidah', 'hodeida', 'ibb',
        'hadramout', 'mukalla', 'socotra', 'tihama',
    ],
    sports: [
        'اتحاد الكرة', 'الدوري اليمني', 'كأس الجمهورية', 'أهلي صنعاء', 'وحدة صنعاء',
        'التلال', 'شعب إب', 'الصقر', 'اليرموك', 'الهلال الساحلي', 'شعب حضرموت',
        'استاد سيئون', 'ملعب المريسي',
    ],
    political: [
        // Houthis
        'الحوثي', 'الحوثيين', 'حوثي', 'أنصار الله',
        'houthi', 'houthis', 'ansar allah',
        // Legitimate Government
        'الحكومة الشرعية', 'الشرعية', 'هادي', 'العليمي', 'مجلس القيادة الرئاسي',
        // STC
        'الانتقالي', 'المجلس الانتقالي', 'الزبيدي', 'stc', 'southern transitional',
        // Coalition
        'التحالف', 'التحالف العربي', 'عاصفة الحزم', 'coalition',
        // International
        'غريفيث', 'المبعوث الأممي', 'هانس غروندبرغ', 'grundberg',
    ],
};
/**
 * Negative filter keywords (if these dominate, reject)
 */
const NOISE_KEYWORDS = [
    'سوريا', 'سوري', 'دمشق', 'الأسد',
    'ليبيا', 'ليبي', 'طرابلس', 'حفتر',
    'أوكرانيا', 'أوكراني', 'كييف', 'زيلينسكي',
    'فلسطين', 'غزة', 'إسرائيل', // Unless Yemen is explicitly the focus
    'syria', 'syrian', 'damascus', 'assad',
    'libya', 'libyan', 'tripoli', 'haftar',
    'ukraine', 'ukrainian', 'kyiv', 'zelensky',
];
// ============= SOURCE TIERING =============
/**
 * Source tier configuration
 * Tier 1: Local Yemeni (x1.5)
 * Tier 2: Regional Pan-Arab (x1.0)
 * Tier 3: International (x0.8)
 */
const SOURCE_TIERS = {
    // Tier 1 - Local Yemeni sources
    'saba.ye': { tier: 1, multiplier: 1.5 },
    'sabanew.net': { tier: 1, multiplier: 1.5 },
    'almasdaronline.com': { tier: 1, multiplier: 1.5 },
    'almashhadonline.com': { tier: 1, multiplier: 1.5 },
    'yemenmonitor.com': { tier: 1, multiplier: 1.5 },
    'newsyemen.net': { tier: 1, multiplier: 1.5 },
    'adenpress.news': { tier: 1, multiplier: 1.5 },
    'al-ayyam.info': { tier: 1, multiplier: 1.5 },
    'akhbaralyom-ye.net': { tier: 1, multiplier: 1.5 },
    'ypa.net.ye': { tier: 1, multiplier: 1.5 },
    // Tier 2 - Regional Pan-Arab
    'aljazeera.net': { tier: 2, multiplier: 1.0 },
    'alarabiya.net': { tier: 2, multiplier: 1.0 },
    'skynewsarabia.com': { tier: 2, multiplier: 1.0 },
    'bbc.com/arabic': { tier: 2, multiplier: 1.0 },
    'arabic.rt.com': { tier: 2, multiplier: 1.0 },
    'france24.com/ar': { tier: 2, multiplier: 1.0 },
    'dw.com/ar': { tier: 2, multiplier: 1.0 },
    // Tier 3 - International wires
    'reuters.com': { tier: 3, multiplier: 0.8 },
    'apnews.com': { tier: 3, multiplier: 0.8 },
    'afp.com': { tier: 3, multiplier: 0.8 },
};
const sourceBurstTracker = new Map();
const BURST_THRESHOLD = 10;
const BURST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const fingerprintCache = [];
const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const SIMILARITY_THRESHOLD = 0.8;
// ============= HELPER FUNCTIONS =============
/**
 * Normalize text for comparison (Arabic-aware)
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[\s\u200B-\u200D\uFEFF]/g, ' ') // Normalize whitespace
        .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics
        .replace(/[^\u0600-\u06FF\w\s]/g, '') // Keep Arabic + alphanumeric
        .trim();
}
/**
 * Count keyword occurrences in text
 */
function countKeywords(text, keywords) {
    const normalized = normalizeText(text);
    return keywords.filter(kw => normalized.includes(normalizeText(kw))).length;
}
/**
 * Extract source domain from URL or name
 */
function extractSourceDomain(sourceName, sourceUrl) {
    if (sourceUrl) {
        try {
            return new URL(sourceUrl).hostname.replace('www.', '');
        }
        catch {
            // Invalid URL
        }
    }
    return sourceName.toLowerCase().replace(/\s+/g, '');
}
/**
 * Get source tier info
 */
function getSourceTier(sourceName, sourceUrl) {
    const domain = extractSourceDomain(sourceName, sourceUrl);
    for (const [key, value] of Object.entries(SOURCE_TIERS)) {
        if (domain.includes(key) || key.includes(domain)) {
            return value;
        }
    }
    // Default to Tier 2 for unknown sources
    return { tier: 2, multiplier: 1.0 };
}
/**
 * Generate semantic fingerprint from text
 */
function generateFingerprint(text) {
    const normalized = normalizeText(text).substring(0, 150);
    return crypto.createHash('md5').update(normalized).digest('hex');
}
/**
 * Calculate Jaccard similarity between two texts
 */
function calculateSimilarity(text1, text2) {
    const words1 = new Set(normalizeText(text1).split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(normalizeText(text2).split(/\s+/).filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0)
        return 0;
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}
/**
 * Calculate recency decay score (0-1)
 */
function calculateRecencyScore(publishedAt) {
    const ageMs = Date.now() - publishedAt.getTime();
    const halfLifeMs = 30 * 60 * 1000; // 30 minutes half-life
    return Math.exp(-ageMs / halfLifeMs);
}
/**
 * Calculate entity density score
 */
function calculateEntityDensity(text) {
    const allEntities = [
        ...YEMEN_SECONDARY_ENTITIES.geographic,
        ...YEMEN_SECONDARY_ENTITIES.political,
        ...YEMEN_SECONDARY_ENTITIES.sports,
    ];
    const count = countKeywords(text, allEntities);
    // Normalize to 0-1 range (max 10 entities = 1.0)
    return Math.min(count / 10, 1.0);
}
/**
 * Check burst control
 */
function checkBurstControl(sourceId) {
    const now = new Date();
    const existing = sourceBurstTracker.get(sourceId);
    if (existing) {
        const elapsed = now.getTime() - existing.firstSeen.getTime();
        if (elapsed < BURST_WINDOW_MS) {
            existing.count++;
            sourceBurstTracker.set(sourceId, existing);
            return { isBurst: existing.count > BURST_THRESHOLD, count: existing.count };
        }
    }
    // Reset or initialize
    sourceBurstTracker.set(sourceId, { count: 1, firstSeen: now });
    return { isBurst: false, count: 1 };
}
/**
 * Find similar article in cache
 */
function findSimilarArticle(description, sourceId) {
    const now = Date.now();
    const cutoff = now - DEDUP_WINDOW_MS;
    // Clean old entries
    while (fingerprintCache.length > 0 && fingerprintCache[0].timestamp.getTime() < cutoff) {
        fingerprintCache.shift();
    }
    // Search for similar
    for (const entry of fingerprintCache) {
        if (entry.sourceId !== sourceId) { // Cross-source dedup only
            const similarity = calculateSimilarity(description, entry.fingerprint);
            if (similarity >= SIMILARITY_THRESHOLD) {
                return entry;
            }
        }
    }
    return null;
}
/**
 * Add fingerprint to cache
 */
function addToFingerprintCache(articleId, description, sourceId) {
    fingerprintCache.push({
        articleId,
        fingerprint: description.substring(0, 150),
        timestamp: new Date(),
        sourceId,
    });
}
// ============= MAIN FILTER FUNCTION =============
/**
 * Process an RSS item through the Yemen-specific filter engine
 */
export function processYemenFilter(item) {
    const fullText = `${item.title} ${item.description || item.excerpt || ''}`;
    const tierInfo = getSourceTier(item.sourceName, item.sourceUrl);
    // ========== STEP 1: MULTI-LAYERED INGESTION GATE ==========
    // Check primary Yemen keywords
    const primaryCount = countKeywords(fullText, YEMEN_PRIMARY_KEYWORDS);
    // Check secondary entities FIRST (before rejecting for no primary)
    const geoCount = countKeywords(fullText, YEMEN_SECONDARY_ENTITIES.geographic);
    const politicalCount = countKeywords(fullText, YEMEN_SECONDARY_ENTITIES.political);
    const sportsCount = countKeywords(fullText, YEMEN_SECONDARY_ENTITIES.sports);
    const secondaryCount = geoCount + politicalCount + sportsCount;
    // NEW LOGIC: Accept if strong secondary presence even without primary keyword
    // Examples: "وفد عسكري من التحالف يصل إلى عدن" - contains عدن and التحالف
    const hasStrongSecondary = secondaryCount >= 2 || (politicalCount >= 1 && geoCount >= 1);
    if (primaryCount === 0 && !hasStrongSecondary) {
        return {
            status: 'REJECTED',
            relevanceScore: 0,
            tierCategory: tierInfo.tier,
            reasoning: 'No primary Yemen identifier found (اليمن/Yemen)',
            action: 'DROP',
        };
    }
    // Secondary entities already computed above
    // Tier 1 sources get relaxed secondary requirement
    const secondaryRequired = tierInfo.tier === 1 ? 0 : 1;
    if (secondaryCount < secondaryRequired) {
        return {
            status: 'REJECTED',
            relevanceScore: 0.1,
            tierCategory: tierInfo.tier,
            reasoning: `Insufficient Yemen entity depth (found ${secondaryCount} secondary entities)`,
            action: 'DROP',
        };
    }
    // Negative filter: Check noise keywords
    const noiseCount = countKeywords(item.title, NOISE_KEYWORDS); // Title only for noise
    const yemenTitleCount = countKeywords(item.title, YEMEN_PRIMARY_KEYWORDS);
    if (noiseCount > yemenTitleCount) {
        return {
            status: 'REJECTED',
            relevanceScore: 0.15,
            tierCategory: tierInfo.tier,
            reasoning: `Noise keywords dominate title (${noiseCount} noise vs ${yemenTitleCount} Yemen)`,
            action: 'DROP',
        };
    }
    // ========== STEP 2: BURST CONTROL ==========
    const burstCheck = checkBurstControl(item.sourceId);
    if (burstCheck.isBurst) {
        return {
            status: 'FLAGGED',
            relevanceScore: 0.5,
            tierCategory: tierInfo.tier,
            reasoning: `Burst detected: ${burstCheck.count} items in 5 minutes from this source`,
            action: 'HOLD',
        };
    }
    // ========== STEP 3: SEMANTIC DEDUPLICATION ==========
    const description = item.description || item.excerpt || item.title;
    const similarArticle = findSimilarArticle(description, item.sourceId);
    if (similarArticle) {
        return {
            status: 'MERGED',
            relevanceScore: 0.7,
            tierCategory: tierInfo.tier,
            reasoning: `>80% similarity with existing article from different source`,
            action: 'MERGE',
            mergeWithId: similarArticle.articleId,
            semanticFingerprint: generateFingerprint(description),
        };
    }
    // ========== STEP 4: HEURISTIC SCORING ==========
    const recencyScore = calculateRecencyScore(item.publishedAt);
    const entityDensity = calculateEntityDensity(fullText);
    const sourceWeight = tierInfo.multiplier / 1.5; // Normalize to 0-1
    // Final score formula
    const relevanceScore = (recencyScore * 0.5) +
        (sourceWeight * 0.3) +
        (entityDensity * 0.2);
    // Add to fingerprint cache for future dedup
    addToFingerprintCache(item.guid, description, item.sourceId);
    // ========== STEP 5: RETURN RESULT ==========
    return {
        status: 'ACCEPTED',
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        tierCategory: tierInfo.tier,
        reasoning: `Passed all gates. Entities: ${secondaryCount}, Recency: ${recencyScore.toFixed(2)}, Source: Tier ${tierInfo.tier}`,
        action: 'PUBLISH',
        semanticFingerprint: generateFingerprint(description),
        entityDensity,
    };
}
/**
 * Clear burst tracking (call periodically for memory management)
 */
export function clearBurstTracking() {
    const now = Date.now();
    for (const [sourceId, state] of sourceBurstTracker.entries()) {
        if (now - state.firstSeen.getTime() > BURST_WINDOW_MS) {
            sourceBurstTracker.delete(sourceId);
        }
    }
}
/**
 * Get filter statistics
 */
export function getFilterStats() {
    return {
        cacheSize: fingerprintCache.length,
        trackedSources: sourceBurstTracker.size,
    };
}
export default {
    processYemenFilter,
    clearBurstTracking,
    getFilterStats,
};
//# sourceMappingURL=yemenFilter.service.js.map