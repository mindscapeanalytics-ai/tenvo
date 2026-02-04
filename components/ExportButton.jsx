'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToCSV, exportToExcel, generateReportPDF } from '@/lib/pdf';
import toast from 'react-hot-toast';

export function ExportButton({ data, filename = 'export', columns, title }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (type) => {
    try {
      switch (type) {
        case 'csv':
          exportToCSV(data, filename);
          toast.success('CSV exported successfully');
          break;
        case 'excel':
          try {
            await exportToExcel(data, filename);
            toast.success('Excel exported successfully');
          } catch (error) {
            toast.error('Excel export failed');
          }
          break;
        case 'pdf':
          if (columns && title) {
            const doc = generateReportPDF(title, data, columns);
            doc.save(`${filename}.pdf`);
            toast.success('PDF exported successfully');
          } else {
            toast.error('PDF export requires columns and title');
          }
          break;
        default:
          break;
      }
      setIsOpen(false);
    } catch (error) {
      toast.error('Export failed');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-wine text-white rounded-lg hover:bg-wine/90 transition"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export as Excel
            </button>
            {columns && title && (
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <File className="w-4 h-4" />
                Export as PDF
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

