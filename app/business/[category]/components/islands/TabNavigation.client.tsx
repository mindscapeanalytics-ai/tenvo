/**
 * Tab Navigation - Client Island Component
 * Interactive tab navigation with URL sync
 */

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LayoutDashboard,
    Package,
    FileText,
    Users,
    Truck,
    Factory,
    Warehouse,
    BarChart3,
    Settings
} from 'lucide-react';

interface TabNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'inventory', label: 'Inventory', icon: Package },
    { value: 'invoices', label: 'Invoices', icon: FileText },
    { value: 'customers', label: 'Customers', icon: Users },
    { value: 'vendors', label: 'Vendors', icon: Truck },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'multi-location', label: 'Multi-Location', icon: Warehouse },
    { value: 'reports', label: 'Reports', icon: BarChart3 },
    { value: 'settings', label: 'Settings', icon: Settings }
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2"
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
