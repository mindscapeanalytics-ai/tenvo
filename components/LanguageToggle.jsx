import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';

export function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-bold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            title={language === 'en' ? 'Switch to Urdu' : 'English میں تبدیل کریں'}
        >
            <Languages className="w-4 h-4 text-wine" />
            <span className={language === 'ur' ? 'font-urdu' : ''}>
                {language === 'en' ? 'Urdu (اردو)' : 'English'}
            </span>
        </Button>
    );
}
