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
                    primary: '#e34242',
                    'primary-light': '#f2d785',
                    'primary-dark': '#c49c3b',
                    50: '#fefbf0',
                    100: '#fdf4d4',
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
                    DEFAULT: '#e34242',
                    light: '#fdf4d4',
                    dark: '#c49c3b',
                },
                // Legacy wine alias preserved for backward compatibility
                wine: {
                    50: '#fefbf0',
                    100: '#fdf4d4',
                    200: '#fae9aa',
                    300: '#f6da7c',
                    400: '#f2d15d',
                    500: '#e34242',
                    600: '#d6aa38',
                    700: '#b28729',
                    800: '#8f6721',
                    900: '#74521d',
                    950: '#46300f',
                    DEFAULT: '#e34242',
                    light: '#f2d785',
                    dark: '#c49c3b',
                },
                // Enterprise aliases to eliminate visual drift
                indigo: {
                    50: '#fefbf0',
                    100: '#fdf4d4',
                    200: '#fae9aa',
                    300: '#f6da7c',
                    400: '#f2d15d',
                    500: '#e34242',
                    600: '#d6aa38',
                    700: '#b28729',
                    800: '#8f6721',
                    900: '#74521d',
                    950: '#46300f',
                },
                violet: {
                    50: '#fefbf0',
                    100: '#fdf4d4',
                    200: '#fae9aa',
                    300: '#f6da7c',
                    400: '#f2d15d',
                    500: '#e34242',
                    600: '#d6aa38',
                    700: '#b28729',
                    800: '#8f6721',
                    900: '#74521d',
                    950: '#46300f',
                },
                purple: {
                    50: '#fefbf0',
                    100: '#fdf4d4',
                    200: '#fae9aa',
                    300: '#f6da7c',
                    400: '#f2d15d',
                    500: '#e34242',
                    600: '#d6aa38',
                    700: '#b28729',
                    800: '#8f6721',
                    900: '#74521d',
                    950: '#46300f',
                },
                fuchsia: {
                    50: '#fefbf0',
                    100: '#fdf4d4',
                    200: '#fae9aa',
                    300: '#f6da7c',
                    400: '#f2d15d',
                    500: '#e34242',
                    600: '#d6aa38',
                    700: '#b28729',
                    800: '#8f6721',
                    900: '#74521d',
                    950: '#46300f',
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
