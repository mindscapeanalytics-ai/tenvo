import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand Colors
                brand: {
                    primary: '#2F5BFF',
                    'primary-light': '#5F82FF',
                    'primary-dark': '#1738A5',
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                },
                // Neutral Scale
                neutral: {
                    50: '#FAFAFA',
                    100: '#F5F5F5',
                    200: '#E5E5E5',
                    300: '#D4D4D4',
                    400: '#A3A3A3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                },
                // Semantic Colors
                success: {
                    DEFAULT: '#10B981',
                    light: '#D1FAE5',
                    dark: '#059669',
                },
                warning: {
                    DEFAULT: '#C69214',
                    light: '#FFF3D6',
                    dark: '#8F6710',
                },
                error: {
                    DEFAULT: '#8B1538',
                    light: '#F9E8ED',
                    dark: '#6B0F28',
                },
                info: {
                    DEFAULT: '#2F5BFF',
                    light: '#DDE7FF',
                    dark: '#1738A5',
                },
                // Legacy wine alias preserved for backward compatibility
                wine: {
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                    200: '#BED0FF',
                    300: '#96B1FF',
                    400: '#6D90FF',
                    500: '#4971FF',
                    600: '#2F5BFF',
                    700: '#2346D6',
                    800: '#1738A5',
                    900: '#132E80',
                    950: '#0C1B47',
                    DEFAULT: '#2F5BFF',
                    light: '#5F82FF',
                    dark: '#1738A5',
                },
                // Enterprise aliases to eliminate visual drift from purple families
                indigo: {
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                    200: '#BED0FF',
                    300: '#96B1FF',
                    400: '#6D90FF',
                    500: '#4971FF',
                    600: '#2F5BFF',
                    700: '#2346D6',
                    800: '#1738A5',
                    900: '#132E80',
                    950: '#0C1B47',
                },
                violet: {
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                    200: '#BED0FF',
                    300: '#96B1FF',
                    400: '#6D90FF',
                    500: '#4971FF',
                    600: '#2F5BFF',
                    700: '#2346D6',
                    800: '#1738A5',
                    900: '#132E80',
                    950: '#0C1B47',
                },
                purple: {
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                    200: '#BED0FF',
                    300: '#96B1FF',
                    400: '#6D90FF',
                    500: '#4971FF',
                    600: '#2F5BFF',
                    700: '#2346D6',
                    800: '#1738A5',
                    900: '#132E80',
                    950: '#0C1B47',
                },
                fuchsia: {
                    50: '#EEF4FF',
                    100: '#DDE7FF',
                    200: '#BED0FF',
                    300: '#96B1FF',
                    400: '#6D90FF',
                    500: '#4971FF',
                    600: '#2F5BFF',
                    700: '#2346D6',
                    800: '#1738A5',
                    900: '#132E80',
                    950: '#0C1B47',
                },
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
            spacing: {
                '0.5': '0.125rem',  // 2px
                '1.5': '0.375rem',  // 6px
                '2.5': '0.625rem',  // 10px
                '3.5': '0.875rem',  // 14px
                '4.5': '1.125rem',  // 18px
                '5.5': '1.375rem',  // 22px
                '6.5': '1.625rem',  // 26px
                '7.5': '1.875rem',  // 30px
            },
            borderRadius: {
                'sm': '0.375rem',
                'md': '0.5rem',
                'lg': '0.75rem',
                'xl': '1rem',
                '2xl': '1.5rem',
            },
        },
    },
    plugins: [],
};
export default config;
