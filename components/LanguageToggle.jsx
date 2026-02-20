import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle({ isCompact = false }) {
    const { language, toggleLanguage } = useLanguage();

    if (isCompact) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm shrink-0"
                title={language === 'en' ? 'Switch to Urdu' : 'English میں تبدیل کریں'}
            >
                <Languages className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 font-bold px-3 py-1.5 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors"
            title={language === 'en' ? 'Switch to Urdu' : 'English میں تبدیل کریں'}
        >
            <Languages className="w-3.5 h-3.5" />
            <span className={cn("text-[11px]", language === 'ur' ? 'font-urdu' : '')}>
                {language === 'en' ? 'Urdu (اردو)' : 'English'}
            </span>
        </Button>
    );
}
