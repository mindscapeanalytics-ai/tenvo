'use client';

import { Menu, Search, Bell, User, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { getDomainColors } from '@/lib/domainColors';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useSearchParams } from 'next/navigation';
import { ChevronRight as ChevronIcon } from 'lucide-react';

export function Header({ onMenuClick }) {
    const { language } = useLanguage();
    const { business } = useBusiness();
    const searchParams = useSearchParams();
    const t = translations[language];
    const pathname = usePathname();
    const currentTab = searchParams.get('tab') || 'dashboard';

    // Extract category for colors
    const pathParts = pathname?.split('/') || [];
    const category = pathParts[2] || 'retail-shop';
    const domainColors = getDomainColors(category);
    const colors = {
        primary: domainColors?.primary || '#8B1538',
    };
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
                {/* Left: Mobile Menu */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0"
                    onClick={onMenuClick}
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </Button>

                {/* Left: Breadcrumbs/Context */}
                <div className="hidden lg:flex items-center gap-2 overflow-hidden mr-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-6 h-6 rounded-lg bg-wine text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {business?.name?.substring(0, 2).toUpperCase() || 'B'}
                        </div>
                        <span className="text-xs font-black text-gray-900 truncate max-w-[120px]">
                            {business?.name || 'Business'}
                        </span>
                    </div>
                    <ChevronIcon className="w-3 h-3 text-gray-300 shrink-0" />
                    <span className="text-xs font-bold text-gray-500 capitalize px-2 py-1 bg-gray-50/50 rounded-lg border border-transparent">
                        {currentTab.replace(/-/g, ' ')}
                    </span>
                </div>

                {/* Center: Search */}
                <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-2">
                    <div className="relative w-full group">
                        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-wine transition-colors ${language === 'ur' ? 'right-3' : 'left-3'}`} />
                        <Input
                            placeholder={t.search_placeholder}
                            className={`h-10 bg-gray-100/50 border-transparent focus:bg-white focus:border-wine/30 focus:ring-wine/20 transition-all rounded-xl ${language === 'ur' ? 'pr-10' : 'pl-10'}`}
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Fast Entry Button */}
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-quick-action'))}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all group overflow-hidden relative border border-dashed"
                        style={{
                            backgroundColor: `${colors.primary}08`,
                            color: colors.primary,
                            borderColor: `${colors.primary}30`
                        }}
                    >
                        <div className="p-1 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="uppercase tracking-tighter">Fast Entry</span>
                        <Zap className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </button>

                    <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-wine hover:bg-wine/5 rounded-full transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    </Button>
                    <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                    <LanguageToggle />
                </div>
            </div>
        </header >
    );
}
