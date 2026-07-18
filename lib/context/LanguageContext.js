'use client';

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { translations } from '@/lib/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // SSR-safe defaults — hydrate from localStorage after mount to avoid HTML mismatch.
    const [language, setLanguage] = useState('en');
    const [dir, setDir] = useState('ltr');

    useLayoutEffect(() => {
        const saved = localStorage.getItem('app-language') || 'en';
        const nextLang = saved === 'ur' ? 'ur' : 'en';
        setLanguage(nextLang);
        setDir(nextLang === 'ur' ? 'rtl' : 'ltr');
    }, []);

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = language;

        if (language === 'ur') {
            document.body.classList.add('font-urdu');
        } else {
            document.body.classList.remove('font-urdu');
        }
    }, [language, dir]);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ur' : 'en';
        setLanguage(newLang);
        const newDir = newLang === 'ur' ? 'rtl' : 'ltr';
        setDir(newDir);
        localStorage.setItem('app-language', newLang);

        document.documentElement.dir = newDir;
        document.documentElement.lang = newLang;

        if (newLang === 'ur') {
            document.body.classList.add('font-urdu');
        } else {
            document.body.classList.remove('font-urdu');
        }
    };

    const t = useMemo(() => translations[language] || translations.en, [language]);

    return (
        <LanguageContext.Provider value={{ language, dir, toggleLanguage, t }}>
            <div dir={dir} className={language === 'ur' ? 'font-urdu' : ''}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
