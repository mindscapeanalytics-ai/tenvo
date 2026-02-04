'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, X, Plus, Trash2, Settings } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { getDomainColors } from '@/lib/domainColors';

/**
 * BusyGrid Component
 * A high-density, keyboard-navigable data grid inspired by Busy.in/Excel.
 * 
 * Features:
 * - Dense layout for maximum information density
 * - Arrow key navigation
 * - Inline editing
 * - "Enter" to edit/save
 * - "Esc" to cancel
 * - Internal sorting support
 * - Virtual scrolling support (prepared)
 */
export function BusyGrid({
    data = [],
    columns = [],
    onRowClick,
    onCellEdit,
    onAddRow,
    onDeleteRow,
    onAdvancedSettings,
    className,
    category = 'retail-shop'
}) {
    const { language } = useLanguage();
    const t = translations[language];
    const colors = getDomainColors(category);

    const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnWidths, setColumnWidths] = useState({});
    const [contextMenu, setContextMenu] = useState(null); // { x, y, rowIndex }
    const [shouldAutoEdit, setShouldAutoEdit] = useState(false);

    const gridRef = useRef(null);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // Get value helper to handle nested keys
    const getValue = useCallback((row, accessor) => {
        if (!accessor) return '';
        if (accessor.includes('.')) {
            return accessor.split('.').reduce((o, i) => (o ? o[i] : undefined), row) ?? '';
        }
        return row[accessor] ?? '';
    }, []);

    // Excel-style column letter helper (0 -> A, 1 -> B, ..., 26 -> AA)
    const getColumnLetter = (index) => {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode((index % 26) + 65) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    };

    const headerLetters = useMemo(() => columns.map((_, i) => getColumnLetter(i)), [columns]);

    // Derived sorted data
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        const sorted = [...data].sort((a, b) => {
            const aVal = getValue(a, sortConfig.key);
            const bVal = getValue(b, sortConfig.key);

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
            }
            return String(aVal).localeCompare(String(bVal));
        });

        return sortConfig.direction === 'asc' ? sorted : sorted.reverse();
    }, [data, sortConfig, getValue]);

    // Intelligence: Calculate summary for the selected column
    const summary = useMemo(() => {
        const colDef = columns[selectedCell.col];
        if (!colDef || !colDef.accessorKey) return null;

        // Sum numeric values in this column
        const values = sortedData
            .map(r => {
                const raw = getValue(r, colDef.accessorKey);
                return typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
            })
            .filter(v => !isNaN(v) && v !== 0);

        if (values.length < 2) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        return { sum, avg, count: values.length };
    }, [sortedData, selectedCell.col, columns, getValue]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Auto-edit cell if requested (e.g. after Enter/Tab)
    useEffect(() => {
        if (shouldAutoEdit && selectedCell) {
            startEditing();
            setShouldAutoEdit(false);
        }
    }, [selectedCell, shouldAutoEdit]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    // Scroll selected row into view
    useEffect(() => {
        if (selectedCell.row >= 0 && scrollRef.current) {
            const rowElement = document.getElementById(`row-${selectedCell.row}`);
            if (rowElement && scrollRef.current) {
                const container = scrollRef.current;
                const rowTop = rowElement.offsetTop;
                const rowHeight = rowElement.offsetHeight;
                const containerScrollTop = container.scrollTop;
                const containerHeight = container.offsetHeight;

                // Adjust for sticky header (h-10 = 40px)
                const headerHeight = 40;

                if (rowTop < containerScrollTop + headerHeight) {
                    container.scrollTop = rowTop - headerHeight;
                } else if (rowTop + rowHeight > containerScrollTop + containerHeight) {
                    container.scrollTop = rowTop + rowHeight - containerHeight;
                }
            }
        }
    }, [selectedCell.row]);

    // Handle column resizing
    const handleMouseDown = (e, colIndex) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = columnWidths[colIndex] || columns[colIndex].width || 120;

        const handleMouseMove = (moveEvent) => {
            const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
            setColumnWidths(prev => ({ ...prev, [colIndex]: newWidth }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Clipboard Functions
    const copyToClipboard = useCallback(() => {
        const colDef = columns[selectedCell.col];
        const row = sortedData[selectedCell.row];
        const val = getValue(row, colDef.accessorKey);
        navigator.clipboard.writeText(String(val));
        // We could add a toast here if imported
        setContextMenu(null);
    }, [selectedCell, sortedData, columns, getValue]);

    const pasteFromClipboard = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            const colDef = columns[selectedCell.col];
            const row = sortedData[selectedCell.row];
            if (!colDef.readOnly) {
                onCellEdit?.(row, colDef.accessorKey, text);
            }
        } catch (err) {
            console.error('Failed to paste:', err);
        }
        setContextMenu(null);
    }, [selectedCell, sortedData, columns, onCellEdit]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOut = () => setContextMenu(null);
        window.addEventListener('click', handleClickOut);
        return () => window.removeEventListener('click', handleClickOut);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (editingCell) {
            // In edit mode
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setEditingCell(null);
            }
            return;
        }

        // Navigation mode
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveSelection(-1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveSelection(1, 0);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveSelection(0, -1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveSelection(0, 1);
                break;
            case 'Home':
                e.preventDefault();
                if (e.ctrlKey) {
                    setSelectedCell({ row: 0, col: 0 });
                } else {
                    setSelectedCell(prev => ({ ...prev, col: 0 }));
                }
                break;
            case 'End':
                e.preventDefault();
                if (e.ctrlKey) {
                    setSelectedCell({ row: sortedData.length - 1, col: columns.length - 1 });
                } else {
                    setSelectedCell(prev => ({ ...prev, col: columns.length - 1 }));
                }
                break;
            case 'PageUp':
                e.preventDefault();
                moveSelection(-10, 0);
                break;
            case 'PageDown':
                e.preventDefault();
                moveSelection(10, 0);
                break;
            case 'Enter':
                e.preventDefault();
                startEditing();
                break;
            case 'Delete':
                if (!editingCell) {
                    e.preventDefault();
                    onDeleteRow?.(sortedData[selectedCell.row]);
                }
                break;
            case 'f':
                if (e.ctrlKey) {
                    e.preventDefault();
                    // This assumes there's a search input to focus
                    document.querySelector('input[placeholder*="Search"]')?.focus();
                }
                break;
            case 'F2':
                e.preventDefault();
                onAddRow?.();
                break;
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    copyToClipboard();
                }
                break;
            case 'v':
                if (e.ctrlKey) {
                    e.preventDefault();
                    pasteFromClipboard();
                }
                break;
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    startEditing(e.key);
                }
                break;
        }
    }, [selectedCell, editingCell, sortedData, columns, onAddRow, onDeleteRow, onCellEdit, copyToClipboard, pasteFromClipboard]);

    // Global key listener for grid focus
    useEffect(() => {
        // Only attach if grid is focused or we want global grid shortcuts?
        // For now, let's assume grid container has focus
        const container = gridRef.current;
        if (!container) return;

        // We attach to the container div
    }, []);

    const moveSelection = (dRow, dCol) => {
        setSelectedCell(prev => {
            let newRow = prev.row + dRow;
            let newCol = prev.col + dCol;

            // Row wrapping for Tab navigation
            if (newCol >= columns.length) {
                if (newRow < sortedData.length - 1) {
                    newRow += 1;
                    newCol = 0;
                } else {
                    newCol = columns.length - 1;
                }
            } else if (newCol < 0) {
                if (newRow > 0) {
                    newRow -= 1;
                    newCol = columns.length - 1;
                } else {
                    newCol = 0;
                }
            }

            // Bound checks
            if (newRow < 0) newRow = 0;
            if (newRow >= sortedData.length) newRow = sortedData.length - 1;

            return { row: newRow, col: newCol };
        });
    };

    const startEditing = (initialChar = null) => {
        const colDef = columns[selectedCell.col];
        if (colDef.readOnly) return;

        const row = data[selectedCell.row];
        let val = '';
        if (colDef.accessorKey) {
            if (colDef.accessorKey.includes('.')) {
                const keys = colDef.accessorKey.split('.');
                val = keys.reduce((o, i) => (o ? o[i] : undefined), row) ?? '';
            } else {
                val = row[colDef.accessorKey] ?? '';
            }
        }

        setEditingCell(selectedCell);
        setEditValue(initialChar !== null ? initialChar : val);
    };

    const saveEdit = (forcedValue = undefined) => {
        if (!editingCell) return;

        const colDef = columns[editingCell.col];
        const row = sortedData[editingCell.row];
        const finalValue = forcedValue !== undefined ? forcedValue : editValue;

        onCellEdit?.(row, colDef.accessorKey, finalValue);
        setEditingCell(null);
    };

    return (
        <div
            className={cn("border border-gray-300 bg-white shadow-sm overflow-hidden flex flex-col h-full select-none font-mono text-sm", className)}
            tabIndex={0}
            ref={gridRef}
            onKeyDown={handleKeyDown}
            style={{ outline: 'none' }}
        >
            {/* Data Grid Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-auto bg-white custom-scrollbar relative"
            >
                <table className="w-full table-fixed border-separate border-spacing-0">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-gray-100/95 backdrop-blur-sm shadow-sm">
                            <th className="w-10 h-10 border-r border-b border-gray-300 bg-gray-200/50 sticky left-0 z-40 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-500 font-mono">
                                #
                            </th>
                            {columns.map((col, idx) => {
                                const width = columnWidths[idx] || col.width || 120;
                                return (
                                    <th
                                        key={col.accessorKey || idx}
                                        className="h-10 border-r border-b border-gray-300 p-0 text-left overflow-hidden relative group hover:bg-gray-200/80 transition-colors"
                                        style={{ width }}
                                    >
                                        <div
                                            className="w-full h-full px-3 flex flex-col justify-center gap-0.5 cursor-pointer"
                                            onClick={() => col.accessorKey && handleSort(col.accessorKey)}
                                        >
                                            <span className="text-[8px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
                                                {headerLetters[idx]}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-[10px] font-black uppercase tracking-widest text-gray-700">
                                                    {col.header}
                                                </span>
                                                {sortConfig.key === col.accessorKey && (
                                                    <span className="flex-shrink-0">
                                                        {sortConfig.direction === 'asc' ?
                                                            <ChevronUp className="w-3 h-3 text-blue-600" /> :
                                                            <ChevronDown className="w-3 h-3 text-blue-600" />
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Column Resizer Handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-50 transition-colors"
                                            onMouseDown={(e) => handleMouseDown(e, idx)}
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map((row, rowIndex) => {
                            const isSelectedRow = selectedCell.row === rowIndex;
                            return (
                                <tr
                                    key={row.id || rowIndex}
                                    id={`row-${rowIndex}`}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({ x: e.pageX, y: e.pageY, rowIndex });
                                        setSelectedCell({ row: rowIndex, col: selectedCell.col });
                                    }}
                                    className={cn(
                                        "transition-colors group",
                                        isSelectedRow ? "bg-blue-50/50" : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/20",
                                        "hover:bg-blue-50/30"
                                    )}
                                >
                                    <td className="w-10 text-center text-[10px] text-gray-400 font-mono bg-gray-50/50 border-r border-gray-100 sticky left-0 z-20 group-hover:text-blue-500 transition-colors">
                                        {rowIndex + 1}
                                    </td>
                                    {columns.map((col, colIndex) => {
                                        const isSelected = selectedCell.row === rowIndex && selectedCell.col === colIndex;
                                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                                        const width = columnWidths[colIndex] || col.width || 120;

                                        return (
                                            <td
                                                key={colIndex}
                                                className={cn(
                                                    "p-0 relative h-10 border-r border-gray-100",
                                                    isSelected && !isEditing && "ring-2 ring-inset ring-blue-500 z-10 bg-blue-50/20",
                                                    col.readOnly && "bg-gray-50/10"
                                                )}
                                                style={{ width }}
                                                onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                                                onDoubleClick={() => !col.readOnly && startEditing()}
                                            >
                                                {isEditing ? (
                                                    <div className="absolute inset-0 z-40 p-0.5">
                                                        <input
                                                            ref={inputRef}
                                                            className="w-full h-full px-2.5 bg-white outline-none ring-2 ring-blue-600 shadow-xl font-medium text-gray-900 z-50 text-sm"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={(e) => saveEdit(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    saveEdit(e.target.value);
                                                                    moveSelection(0, 1);
                                                                    setShouldAutoEdit(true);
                                                                } else if (e.key === 'Tab') {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    saveEdit(e.target.value);
                                                                    moveSelection(0, e.shiftKey ? -1 : 1);
                                                                    setShouldAutoEdit(true);
                                                                } else if (e.key === 'Escape') {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setEditingCell(null);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "px-3 py-1 text-sm truncate w-full h-full flex items-center transition-colors",
                                                        col.readOnly ? "text-gray-400 font-medium italic" : "text-gray-700 font-medium",
                                                        isSelected && "font-bold text-blue-700"
                                                    )}>
                                                        {col.cell ? col.cell({
                                                            row: { original: row },
                                                            value: getValue(row, col.accessorKey)
                                                        }) : getValue(row, col.accessorKey)}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty State */}
                {sortedData.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
                            <Plus className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-1">No Inventory Data</h3>
                        <p className="text-sm text-gray-400 mb-6">Start by adding a new product or scanning a barcode.</p>
                        <kbd className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm font-mono text-xs">
                            <span className="text-blue-500 font-bold">F2</span>
                            <span className="text-gray-400">to quick add</span>
                        </kbd>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="bg-white border-t border-gray-200 p-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] h-8 flex items-center z-40">
                <div className="flex-1 flex items-center px-4 gap-6 overflow-hidden">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items:</span>
                        <span className="text-[10px] font-black font-mono text-gray-900">{data.length}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-gray-200" />
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Position:</span>
                        <span className="text-[10px] font-black font-mono text-blue-600">R:{selectedCell.row + 1} C:{headerLetters[selectedCell.col]}</span>
                    </div>
                    {summary && (
                        <>
                            <div className="h-3 w-[1px] bg-gray-200" />
                            <div className="flex items-center gap-4 text-[10px] font-bold text-blue-600/80">
                                <span>SUM: {summary.sum.toLocaleString()}</span>
                                <span>AVG: {summary.avg.toFixed(1)}</span>
                                <span>COUNT: {summary.count}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center px-2 gap-3 bg-gray-50 border-l border-gray-200 h-full ml-auto">
                    {[
                        { k: 'F2', l: 'Add' },
                        { k: 'ENT', l: 'Edit' },
                        { k: 'ESC', l: 'Back' },
                        { k: 'DEL', l: 'Clear' }
                    ].map(btn => (
                        <div key={btn.k} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-help">
                            <kbd className="bg-white border border-gray-300 px-1 rounded text-[9px] font-bold shadow-sm">{btn.k}</kbd>
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-500">{btn.l}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border border-gray-200 shadow-2xl rounded-lg py-1 w-48 font-sans overflow-hidden"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                        onClick={copyToClipboard}
                    >
                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">Copy Cell</span>
                            <span className="text-[10px] text-gray-400 font-mono">CTRL+C</span>
                        </div>
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                        onClick={pasteFromClipboard}
                    >
                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">Paste Cell</span>
                            <span className="text-[10px] text-gray-400 font-mono">CTRL+V</span>
                        </div>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                        onClick={() => { onAdvancedSettings?.(sortedData[contextMenu.rowIndex]); setContextMenu(null); }}
                    >
                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">Advanced Settings</span>
                        </div>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 transition-colors"
                        onClick={() => { onDeleteRow?.(sortedData[contextMenu.rowIndex]); setContextMenu(null); }}
                    >
                        <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">Delete Row</span>
                            <span className="text-[10px] text-red-400 font-mono">CTRL+DEL</span>
                        </div>
                    </button>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
