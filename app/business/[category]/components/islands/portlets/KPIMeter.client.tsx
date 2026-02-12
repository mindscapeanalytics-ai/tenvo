'use client';

import { memo } from 'react';
import { Portlet } from '@/components/ui/portlet';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface KPIMeterProps {
    title?: string;
    value?: number;
    target?: number;
    prefix?: string;
    suffix?: string;
    color?: string;
}

export const KPIMeter = memo(function KPIMeter({
    title = "Inventory Health",
    value = 85,
    target = 100,
    prefix = "",
    suffix = "%",
    color = "#8B1538"
}: KPIMeterProps) {
    const data = [
        { name: 'Value', value: value, fill: color },
        { name: 'Gap', value: Math.max(0, target - value), fill: '#F3F4F6' }
    ];

    return (
        <Portlet title={title}>
            <div className="flex flex-col items-center justify-center -mt-4">
                <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={12}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <RadialBar
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Centered Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <span className="text-3xl font-black text-gray-900 leading-none">
                            {prefix}{value}{suffix}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+12% vs LY</span>
                        </div>
                    </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 -mt-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Current</p>
                        <p className="text-sm font-black text-gray-800 tracking-tight">{prefix}{value}{suffix}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Target</p>
                        <p className="text-sm font-black text-gray-800 tracking-tight">{prefix}{target}{suffix}</p>
                    </div>
                </div>
            </div>
        </Portlet>
    );
});
