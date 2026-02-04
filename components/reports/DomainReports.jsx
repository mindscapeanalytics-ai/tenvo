'use client';

import { useState } from 'react';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { getDomainTheme } from '@/lib/utils/domainHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart3, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export function DomainReports({ category }) {
    const domainKnowledge = getDomainKnowledge(category);
    const theme = getDomainTheme(category);
    const availableReports = domainKnowledge?.reports || [];

    const [selectedReport, setSelectedReport] = useState(null);
    const [dateRange, setDateRange] = useState('this_month');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!selectedReport) {
            toast.error('Please select a report to generate');
            return;
        }

        setIsGenerating(true);
        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success(`${selectedReport.name} generated successfully!`);
        setIsGenerating(false);
    };

    if (availableReports.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Domain Reports</CardTitle>
                    <CardDescription>No specialized reports available for this category.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableReports.map((report) => (
                    <Card
                        key={report.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedReport?.id === report.id ? `border-${theme.primary} ring-1 ring-${theme.primary}` : ''}`}
                        onClick={() => setSelectedReport(report)}
                    >
                        <CardHeader className="p-4">
                            <div className="flex items-start justify-between">
                                <div className={`p-2 rounded-lg bg-${theme.bg} text-${theme.primary}`}>
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                {selectedReport?.id === report.id && (
                                    <Badge className={`bg-${theme.primary}`}>Selected</Badge>
                                )}
                            </div>
                            <CardTitle className="mt-3 text-base">{report.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                                {report.description || `Detailed ${report.name.toLowerCase()} analysis`}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {selectedReport && (
                <Card className="animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className={`text-${theme.primary}`} />
                            Generate: {selectedReport.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2 min-w-[200px]">
                                <label className="text-sm font-medium">Date Range</label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Fiscal Year</SelectItem>
                                        <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`bg-${theme.primary} text-white min-w-[140px]`}
                            >
                                {isGenerating ? 'Generating...' : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export PDF
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                            <strong>Note:</strong> This report will include domain-specific fields like {
                                category === 'textile-wholesale' ? 'Thaan Length, Design No' :
                                    category === 'mobile' ? 'IMEI, Color' : 'specialized attributes'
                            }.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
