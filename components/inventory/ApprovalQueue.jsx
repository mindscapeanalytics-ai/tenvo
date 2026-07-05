/**
 * ApprovalQueue — Prisma-backed stock adjustment history.
 *
 * Legacy Supabase `stock_adjustments` removed: hub writes go through
 * InventoryService.adjustStock → stock_movements (same DB as inventory grid).
 * High-value approval thresholds live in StockAdjustmentManager.
 */

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveManagerHeader } from '@/components/mobile/HubSectionHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useStockAdjustment } from '@/lib/hooks/useStockAdjustment';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';

export default function ApprovalQueue({ businessId }) {
  const { adjustments, pendingApprovals, loading } = useStockAdjustment(businessId);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecent = useMemo(() => {
    let rows = [...adjustments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter(
        (adj) =>
          adj.product_name?.toLowerCase().includes(query) ||
          adj.reason_code?.toLowerCase().includes(query) ||
          adj.warehouse_name?.toLowerCase().includes(query)
      );
    }

    rows.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortBy === 'date_asc' ? aDate - bDate : bDate - aDate;
    });

    return rows.slice(0, 50);
  }, [adjustments, searchQuery, sortBy]);

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <ResponsiveManagerHeader
        title="Approval Queue"
        subtitle="Stock adjustments apply immediately via Inventory · pending multi-level approval uses Stock Adjustments"
        titleClassName="lg:text-2xl"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search recent adjustments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full lg:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending approvals
          </CardTitle>
          <CardDescription>
            No separate approval table: adjustments post to stock_movements when saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No pending approvals in queue.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent adjustments</CardTitle>
          <CardDescription>Last {filteredRecent.length} stock_movements (adjustment type)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-600">Loading adjustments...</div>
          ) : filteredRecent.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-600">No recent adjustments found.</div>
          ) : (
            <div className="space-y-3">
              {filteredRecent.map((adj) => {
                const isIncrease = Number(adj.quantity_change) > 0;
                return (
                  <div
                    key={adj.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border bg-white min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{adj.product_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {adj.warehouse_name || 'Primary'} · {adj.reason_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={isIncrease ? 'default' : 'secondary'} className="gap-1">
                        {isIncrease ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isIncrease ? '+' : ''}
                        {Math.abs(Number(adj.quantity_change))}
                      </Badge>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatDisplayDate(adj.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
