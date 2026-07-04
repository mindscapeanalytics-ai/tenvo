'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, Download, Trash2, X, Settings2 } from 'lucide-react';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
/**
 * @param {Object} props
 * @param {any[]} props.data
 * @param {any[]} props.columns
 * @param {boolean} [props.searchable]
 * @param {boolean} [props.exportable]
 * @param {Function} [props.onExport]
 * @param {Function} [props.onBulkDelete]
 * @param {string} [props.category]
 * @param {'default'|'inventory'} [props.variant]
 * @param {Function} [props.onRowClick]
 * @param {Record<string, boolean>} [props.initialColumnVisibility]
 * @param {number} [props.initialPageSize]
 */
export function DataTable({
  data,
  columns: userColumns,
  searchable = true,
  exportable = false,
  onExport,
  onBulkDelete,
  category = 'retail-shop',
  emptyComponent,
  variant = 'default',
  onRowClick,
  initialColumnVisibility = {},
  initialPageSize = 10,
}) {
  const colors = getDomainColors(category);
  const isInventory = variant === 'inventory';
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (!initialColumnVisibility || !Object.keys(initialColumnVisibility).length) return;
    setColumnVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [key, visible] of Object.entries(initialColumnVisibility)) {
        if (prev[key] === undefined) {
          next[key] = visible;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initialColumnVisibility]);

  // Add Selection Column + Domain Intelligent Columns
  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] border-gray-400 bg-white"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] border-gray-400 bg-white"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: isInventory ? 36 : 40,
      minSize: isInventory ? 36 : 40,
      maxSize: isInventory ? 36 : 40,
    },
    ...userColumns,
  ], [userColumns, isInventory]);

  const stickyLeftByColumnId = useMemo(() => {
    if (!isInventory) return {};
    let offset = 0;
    const map = {};
    for (const col of columns) {
      const id = col.id;
      const width = col.size ?? col.minSize ?? 40;
      if (id === 'select' || id === 'actions' || id === 'name') {
        map[id] = offset;
        offset += width;
      }
    }
    return map;
  }, [columns, isInventory]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="w-full relative">
      {/* Selection Action Bar (Floating Premium Bar) */}
      {hasSelection && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300 lg:bottom-8">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-6">
              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold">
                {selectedRows.length}
              </span>
              <span className="text-sm font-bold tracking-tight uppercase">Selected</span>
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={() => {
                  if (onBulkDelete) {
                    const items = selectedRows.map(r => r.original);
                    onBulkDelete(items);
                    table.resetRowSelection();
                  }
                }}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-300 transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Bulk Delete
              </button>

              <button
                onClick={() => {
                  if (onExport) {
                    onExport(selectedRows.map(r => r.original));
                  }
                }}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Export {selectedRows.length} items
              </button>

              <button
                onClick={() => table.resetRowSelection()}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors group"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Search and Export Bar */}
        <div className={cn(
          'flex items-center gap-3',
          isInventory ? 'mb-2.5 justify-end' : 'mb-4 justify-between'
        )}>
          {searchable && !isInventory && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={/** @type {React.CSSProperties} */ ({
                  '--tw-ring-color': `${colors.primary}30`,
                  borderColor: globalFilter ? colors.primary : '#D1D5DB'
                })}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = globalFilter ? colors.primary : '#D1D5DB'}
              />
            </div>
          )}
          {isInventory && (
            <p className="mr-auto text-[11px] font-medium text-gray-500 tabular-nums">
              {table.getFilteredRowModel().rows.length} products
              <span className="hidden sm:inline text-gray-400"> · double-click row to edit</span>
            </p>
          )}
          {exportable && onExport && !isInventory && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'ml-auto h-8 rounded-lg border-gray-200 text-xs font-semibold text-gray-700',
                  isInventory && 'shadow-none'
                )}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px] max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  // Check if it's a domain column (custom header string) or standard
                  let header = column.columnDef.header;
                  if (typeof header === 'function') {
                    // Try to extract text from React Element or just fallback to ID
                    header = column.id;
                  }

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {header}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table - with Sticky Header */}
        <div className={cn(
          'relative overflow-auto custom-scrollbar group/table border border-gray-200',
          isInventory ? 'max-h-[calc(100vh-22rem)] min-h-[320px] rounded-xl' : 'max-h-[600px] rounded-lg'
        )}>
          <table className={cn(
            'relative w-full bg-white border-separate border-spacing-0',
            isInventory ? 'table-fixed min-w-[960px]' : 'min-w-full table-auto'
          )}>
            <thead className="sticky top-0 z-20 bg-gray-50/95 shadow-sm backdrop-blur-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const colId = header.column.id;
                    const stickyLeft = stickyLeftByColumnId[colId];
                    const colSize = header.column.columnDef.size;
                    const colMin = header.column.columnDef.minSize;
                    return (
                    <th
                      key={header.id}
                      style={{
                        width: colSize,
                        minWidth: colMin ?? colSize,
                        maxWidth: header.column.columnDef.maxSize,
                        ...(stickyLeft != null ? { left: stickyLeft } : {}),
                      }}
                      className={cn(
                        'cursor-pointer border-b border-gray-200 text-left font-semibold uppercase tracking-wide transition-colors hover:bg-gray-100/80',
                        isInventory ? 'px-2 py-1.5 text-[9px] text-gray-500' : 'px-3 py-2 text-[10px] text-gray-500',
                        header.column.getIsSorted() && 'border-b-blue-500 bg-blue-50/40 text-blue-700',
                        stickyLeft != null && 'sticky z-30 bg-gray-50/95 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.08)]'
                      )}
                      onClick={(e) => header.column.getToggleSortingHandler()?.(e)}
                    >
                      <div className="flex min-w-0 items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="shrink-0 text-[10px] text-gray-400">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted()] ?? '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  );})}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-2 text-center text-gray-500">
                    {emptyComponent || (
                      <div className="flex flex-col items-center justify-center space-y-3 py-12">
                        <div className="p-3 bg-gray-50 rounded-full">
                          <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-gray-900">No results found</p>
                          <p className="text-sm text-gray-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer',
                      isInventory
                        ? 'hover:bg-blue-50/50'
                        : 'hover:bg-gray-50',
                      !isInventory && (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')
                    )}
                    onDoubleClick={() => onRowClick?.(row.original)}
                    title={onRowClick ? 'Double-click to edit' : undefined}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const colId = cell.column.id;
                      const stickyLeft = stickyLeftByColumnId[colId];
                      const rowBg = isInventory
                        ? 'bg-white'
                        : rowIndex % 2 === 0
                          ? 'bg-white/95'
                          : 'bg-gray-50/95';
                      return (
                      <td
                        key={cell.id}
                        style={stickyLeft != null ? { left: stickyLeft } : undefined}
                        className={cn(
                          'border-b border-gray-100/80 text-xs font-medium text-gray-700',
                          isInventory ? 'px-2 py-1' : 'px-3 py-1.5',
                          stickyLeft != null && cn('sticky z-10 border-r border-gray-100/70 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.04)] backdrop-blur-sm', rowBg)
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );})}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={cn(
          'flex items-center justify-between gap-3',
          isInventory ? 'mt-2.5' : 'mt-4'
        )}>
          <div className={cn('text-gray-500', isInventory ? 'text-[11px]' : 'text-sm')}>
            {table.getFilteredRowModel().rows.length > 0 ? (
              <>
                Showing{' '}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{' '}
                to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} results
              </>
            ) : (
              <span className="text-gray-400 italic">No entries to display</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                'rounded-lg border border-gray-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50',
                isInventory ? 'p-1.5' : 'p-2 border-gray-300'
              )}
            >
              <ChevronLeft className={isInventory ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
            <span className={cn('text-gray-700 tabular-nums', isInventory ? 'text-[11px]' : 'text-sm')}>
              Page {table.getPageCount() > 0 ? table.getState().pagination.pageIndex + 1 : 0} of {table.getPageCount()}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                'rounded-lg border border-gray-200 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50',
                isInventory ? 'p-1.5' : 'p-2 border-gray-300'
              )}
            >
              <ChevronRight className={isInventory ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </button>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className={cn(
                'ml-1 rounded-lg border border-gray-200 bg-white',
                isInventory ? 'px-2 py-1 text-[11px]' : 'ml-2 px-3 py-1 text-sm border-gray-300'
              )}
            >
              {(isInventory ? [25, 50, 100, 200] : [10, 20, 30, 50, 100]).map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}








