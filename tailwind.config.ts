import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // Colors from design-system.json
            colors: {
                primary: '#38BDF8',
                secondary: '#22C55E',
            },
            // Border radius from design-system.json
            borderRadius: {
                'none': '0px',
                'sm': '4px',
                DEFAULT: '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '20px',
                '2xl': '24px',
                '3xl': '32px',
                'full': '9999px',
                'button': '8px',
            },
            // Font families from design-system.json
            fontFamily: {
                'arabic': ['var(--font-arabic)', 'sans-serif'],
                'brand': ['Pacifico', 'cursive'],
            },
            // Animations from design-system.json
            animation: {
                'scroll-right': 'scroll-right 30s linear infinite',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'scroll-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
