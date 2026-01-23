/**
 * Design System Tokens
 * 
 * Single source of truth for all design values.
 * These tokens are derived from design-system.json and must be used
 * instead of hardcoded values throughout the component library.
 * 
 * @module design-system/tokens
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
    brand: {
        primary: '#38BDF8',
        secondary: '#22C55E',
    },
    semantic: {
        success: {
            base: '#22c55e',
            light: '#dcfce7',
            dark: '#166534',
            textOnLight: '#166534',
        },
        error: {
            base: '#ef4444',
            light: '#fef2f2',
            dark: '#991b1b',
            textOnLight: '#991b1b',
        },
        warning: {
            base: '#eab308',
            light: '#fef9c3',
            dark: '#a16207',
            textOnLight: '#a16207',
        },
        info: {
            base: '#3b82f6',
            light: '#dbeafe',
            dark: '#1d4ed8',
            textOnLight: '#1e40af',
        },
    },
    neutral: {
        white: '#ffffff',
        gray50: '#f9fafb',
        gray100: '#f3f4f6',
        gray200: '#e5e7eb',
        gray300: '#d1d5db',
        gray400: '#9ca3af',
        gray500: '#6b7280',
        gray600: '#4b5563',
        gray700: '#374151',
        gray800: '#1f2937',
        gray900: '#111827',
        black: '#000000',
    },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
    fontFamily: {
        primary: "'Noto Sans Arabic', sans-serif",
        brand: "'Pacifico', cursive",
    },
    fontSize: {
        xs: { value: '0.75rem', lineHeight: '1rem' },
        sm: { value: '0.875rem', lineHeight: '1.25rem' },
        base: { value: '1rem', lineHeight: '1.5rem' },
        lg: { value: '1.125rem', lineHeight: '1.75rem' },
        xl: { value: '1.25rem', lineHeight: '1.75rem' },
        '2xl': { value: '1.5rem', lineHeight: '2rem' },
        '3xl': { value: '1.875rem', lineHeight: '2.25rem' },
    },
    fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700,
    },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
    none: '0px',
    sm: '4px',
    default: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
    button: '8px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

// ============================================================================
// ICONS (Remix Icon classes)
// ============================================================================

export const icons = {
    navigation: {
        home: 'ri-home-line',
        dashboard: 'ri-dashboard-line',
        menu: 'ri-menu-line',
        search: 'ri-search-line',
        settings: 'ri-settings-line',
        logout: 'ri-logout-box-line',
    },
    content: {
        article: 'ri-article-line',
        folder: 'ri-folder-line',
        chat: 'ri-chat-line',
        global: 'ri-global-line',
        government: 'ri-government-line',
        fire: 'ri-fire-line',
        notification: 'ri-notification-3-line',
    },
    actions: {
        add: 'ri-add-line',
        edit: 'ri-edit-line',
        delete: 'ri-delete-bin-line',
        eye: 'ri-eye-line',
        eyeOff: 'ri-eye-off-line',
    },
    user: {
        user: 'ri-user-line',
        userAdd: 'ri-user-add-line',
        notification: 'ri-notification-line',
    },
    social: {
        facebook: 'ri-facebook-fill',
        twitter: 'ri-twitter-fill',
        youtube: 'ri-youtube-fill',
        telegram: 'ri-telegram-fill',
        google: 'ri-google-fill',
    },
    utility: {
        time: 'ri-time-line',
        mail: 'ri-mail-line',
        phone: 'ri-phone-line',
        mapPin: 'ri-map-pin-line',
        barChart: 'ri-bar-chart-line',
        lock: 'ri-lock-line',
    },
} as const;

// ============================================================================
// CATEGORY BADGES
// ============================================================================

export const categoryBadges = {
    parliament: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'البرلمان' },
    diplomacy: { bg: 'bg-green-100', text: 'text-green-600', label: 'دبلوماسية' },
    localGovernment: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'حكم محلي' },
    regional: { bg: 'bg-green-100', text: 'text-green-600', label: 'إقليمي' },
    analysis: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'تحليل خاص' },
    opinion: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'رأي' },
    breaking: { bg: 'bg-sky-600', text: 'text-white', label: 'عاجل' },
    // New Categories
    sports: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'رياضة' },
    economy: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'اقتصاد' },
    culture: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', label: 'ثقافة' },
    world: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'عالم' },
    society: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'مجتمع' },
    local: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'محليات' },
    tech: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'تكنولوجيا' },
    technology: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'تكنولوجيا' },
    politics: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'سياسة' },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CategoryType = keyof typeof categoryBadges;
export type IconCategory = keyof typeof icons;
export type SemanticColor = keyof typeof colors.semantic;
