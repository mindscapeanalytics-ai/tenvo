'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/context/LanguageContext';
import { FilterProvider } from '@/lib/context/FilterContext';
import { DataProvider } from '@/lib/context/DataContext';

export default function BusinessLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { language } = useLanguage();

    const sidebarWidth = isSidebarCollapsed ? '20' : '64';
    const marginClass = language === 'ur'
        ? (isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64')
        : (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64');

    return (
        <FilterProvider>
            <DataProvider>
                <div className="min-h-screen bg-gray-50 flex">
                    {/* Sidebar */}
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        isSidebarCollapsed={isSidebarCollapsed}
                        setIsSidebarCollapsed={setIsSidebarCollapsed}
                    />

                    {/* Main Content Area */}
                    <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${marginClass}`}>
                        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </DataProvider>
        </FilterProvider>
    );
}
