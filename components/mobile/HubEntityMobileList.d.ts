import type { ComponentType, ReactNode } from 'react';

export interface HubEntityMobileAction<T> {
  id: string;
  icon?: ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  onClick: (item: T) => void;
}

export interface HubEntityMobileListProps<T = Record<string, unknown>> {
  items?: T[];
  filterItems?: (items: T[], search: string) => T[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  getKey?: (item: T) => string | number;
  onRowPress?: (item: T) => void;
  renderIcon?: (item: T) => ReactNode;
  getTitle?: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getAmount?: (item: T) => ReactNode;
  getAmountClassName?: (item: T) => string;
  renderBadge?: (item: T) => ReactNode;
  getActions?: (item: T) => HubEntityMobileAction<T>[];
  pageSize?: number;
  className?: string;
}

export function HubEntityMobileList<T = Record<string, unknown>>(
  props: HubEntityMobileListProps<T>
): JSX.Element;

export default HubEntityMobileList;
