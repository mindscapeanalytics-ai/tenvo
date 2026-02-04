'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function BusinessLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { language } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${language === 'ur' ? 'lg:mr-64' : 'lg:ml-64'}`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
