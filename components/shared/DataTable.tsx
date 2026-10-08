'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, type LucideIcon } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { PagePagination } from './PagePagination';

/**
 * Admin liste tabloları için ortak generic DataTable.
 *
 * - Client-side sorting: YALNIZCA `sortValue` verilen sütunlar sıralanabilir.
 *   Sıralama sadece geçerli sayfadaki `rows` üzerinde etkilidir.
 * - Server-side pagination: `onPageChange` verilirse PagePagination gösterilir.
 *   Sayfa değişince sayfa-içi seçim temizlenir.
 * - Loading: thead korunur, satırlar skeleton olur.
 * - Satır seçimi: `enableRowSelection` ile başa checkbox sütunu eklenir.
 *
 * Sadece `id`'si olan sütunlar visibility/reorder/sort'a tabidir.
 */

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
  id?: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** @deprecated Sıralama için `sortValue` gerekir; tek başına etkisizdir. */
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

/** products sayfasının beklediği eski isim — Column'ın alias'ı. */
export type ColumnDef<T> = Column<T>;

export type DataTableSelection<T> = {
  /** Geçerli sayfada seçili satırlar. */
  rows: T[];
  /** Backend genelinde TÜM kayıtların seçildiğini belirtir. */
  allRecordsSelected: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  isLoading?: boolean;

  // Server-side pagination
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;

  columnVisibility?: Record<string, boolean>;
  columnOrder?: string[];

  defaultSort?: { id: string; dir: SortDirection } | null;

  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: DataTableSelection<T>) => void;
};

function SortIndicator({ dir }: { dir: SortDirection | null }) {
  if (dir === 'asc') return <ArrowUp size={13} className="text-sidebar-primary shrink-0" />;
  if (dir === 'desc') return <ArrowDown size={13} className="text-sidebar-primary shrink-0" />;
  return <ArrowUpDown size={13} className="shrink-0 opacity-40" />;
}

type SelectAllControlProps = {
  isAllPageChecked: boolean;
  isIndeterminate: boolean;
  pageCount: number;
  totalCount: number;
  hasAnySelected: boolean;
  onTogglePage: (checked: boolean) => void;
  onSelectThisPage: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

function SelectAllControl({
  isAllPageChecked,
  isIndeterminate,
  pageCount,
  totalCount,
  hasAnySelected,
  onTogglePage,
  onSelectThisPage,
  onSelectAll,
  onClearAll,
}: SelectAllControlProps) {
  return (
    <div className="flex items-center gap-1">
      <Checkbox
        checked={isAllPageChecked ? true : isIndeterminate ? 'indeterminate' : false}
        onCheckedChange={(value) => onTogglePage(value === true)}
        aria-label="Select all on page"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-6"
            aria-label="Selection options"
          >
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={onSelectThisPage}>
            Select this page
            <span className="text-muted-foreground ml-auto text-xs">({pageCount})</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSelectAll}>
            Select all records
            <span className="text-muted-foreground ml-auto text-xs">({totalCount})</span>
          </DropdownMenuItem>
          {hasAnySelected && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onClearAll}
                className="text-destructive focus:text-destructive"
              >
                Clear selection
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
  columnVisibility,
  columnOrder,
  defaultSort = null,
  enableRowSelection = false,
  onRowSelectionChange,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; dir: SortDirection } | null>(defaultSort);

  // ── Satır seçimi ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [allRecordsSelected, setAllRecordsSelected] = useState(false);

  const pageIds = useMemo(() => rows.map((r) => getRowId(r)), [rows, getRowId]);
  const pageSelectedCount = useMemo(
    () => pageIds.filter((id) => selectedIds.has(id)).length,
    [pageIds, selectedIds],
  );
  const isAllPageSelected =
    rows.length > 0 && !allRecordsSelected && pageSelectedCount === rows.length;
  const isSomePageSelected = rows.length > 0 && !allRecordsSelected && pageSelectedCount > 0;
  const selectedCount = allRecordsSelected ? (totalCount ?? rows.length) : selectedIds.size;

  const emitSelection = (nextIds: Set<string>, nextAllRecords: boolean) => {
    const selectedRows = rows.filter((r) => nextIds.has(getRowId(r)));
    onRowSelectionChange?.({ rows: selectedRows, allRecordsSelected: nextAllRecords });
  };

  function applySelection(next: Set<string>, nextAll: boolean) {
    setSelectedIds(next);
    setAllRecordsSelected(nextAll);
    emitSelection(next, nextAll);
  }

  function toggleSelectPage(checked: boolean) {
    const next = new Set(selectedIds);
    for (const id of pageIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    applySelection(next, false);
  }

  function selectThisPage() {
    const next = new Set(selectedIds);
    for (const id of pageIds) next.add(id);
    applySelection(next, false);
  }

  function selectAllRecords() {
    applySelection(new Set(pageIds), true);
  }

  function clearSelection() {
    applySelection(new Set(), false);
  }

  function toggleRow(id: string, checked: boolean) {
    // "Tüm kayıtlar" seçiliyken tek satır kaldırılırsa toplu seçim iptal olur,
    // sayfadaki diğer satırlar seçili kalır.
    const base = allRecordsSelected ? new Set(pageIds) : new Set(selectedIds);
    if (checked) base.add(id);
    else base.delete(id);
    applySelection(base, false);
  }

  function handlePageChange(page: number) {
    if (!allRecordsSelected) {
      applySelection(new Set(), false);
    }
    onPageChange?.(page);
  }

  // ── Sıralama (client-side, geçerli sayfa) ──────────────────────────────────
  const columnById = useMemo(() => {
    const map = new Map<string, Column<T>>();
    for (const col of columns) if (col.id) map.set(col.id, col);
    return map;
  }, [columns]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columnById.get(sort.id);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    const getValue = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
      return cmp * dir;
    });
  }, [rows, sort, columnById]);

  // ── Kolon görünürlüğü + sıra ───────────────────────────────────────────────
  const orderedColumns = useMemo(() => {
    if (!columnOrder || columnOrder.length === 0) return columns;
    const byId = new Map(columns.map((c) => [c.id, c]));
    return columnOrder
      .map((id) => byId.get(id))
      .filter((c): c is Column<T> => Boolean(c))
      .concat(columns.filter((c) => !c.id || !columnOrder.includes(c.id)));
  }, [columns, columnOrder]);

  const visibleColumns = orderedColumns.filter(
    (col) => !col.id || columnVisibility?.[col.id] !== false,
  );

  const selectionColumn: Column<T> = {
    header: '',
    className: 'w-10',
    cell: (row) => {
      const id = getRowId(row);
      return (
        <Checkbox
          checked={allRecordsSelected || selectedIds.has(id)}
          onCheckedChange={(value) => toggleRow(id, value === true)}
          aria-label="Select row"
        />
      );
    },
  };

  const displayColumns = enableRowSelection ? [selectionColumn, ...visibleColumns] : visibleColumns;

  function toggleSort(id: string) {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: 'asc' };
      if (prev.dir === 'asc') return { id, dir: 'desc' };
      return null;
    });
  }

  const columnKey = (col: Column<T>, index: number) =>
    enableRowSelection && index === 0 ? 'select' : (col.id ?? `${col.header}-${index}`);

  const showPagination = Boolean(onPageChange) && totalPages > 1;
  const showSelectionBanner = enableRowSelection && selectedCount > 0;

  return (
    <div>
      {showSelectionBanner && (
        <div className="border-primary/20 bg-primary/5 text-primary flex items-center justify-between rounded-t-lg border border-b-0 px-3 py-1.5 text-sm font-medium">
          <span>
            {allRecordsSelected
              ? `All ${totalCount ?? rows.length} records selected`
              : `${selectedCount} row${selectedCount !== 1 ? 's' : ''} selected`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-muted-foreground hover:text-foreground h-7 text-xs font-normal"
          >
            Clear
          </Button>
        </div>
      )}

      <div
        className={cn(
          'border-border bg-card overflow-x-auto border shadow-[0_1px_3px_rgba(23,22,20,0.05)]',
          showSelectionBanner ? 'rounded-t-none rounded-b-md' : 'rounded-md',
        )}
      >
        <Table>
          <TableHeader className="bg-background/80">
            <TableRow>
              {displayColumns.map((col, index) => {
                const isSelectionCol = enableRowSelection && index === 0;
                const isSorted = sort?.id === col.id;
                const sortable = Boolean(col.id && col.sortValue);

                return (
                  <TableHead
                    key={columnKey(col, index)}
                    className={cn('text-muted-foreground px-3 py-3', col.className)}
                  >
                    {isSelectionCol ? (
                      <SelectAllControl
                        isAllPageChecked={allRecordsSelected || isAllPageSelected}
                        isIndeterminate={!allRecordsSelected && isSomePageSelected}
                        pageCount={rows.length}
                        totalCount={totalCount ?? rows.length}
                        hasAnySelected={selectedCount > 0}
                        onTogglePage={toggleSelectPage}
                        onSelectThisPage={selectThisPage}
                        onSelectAll={selectAllRecords}
                        onClearAll={clearSelection}
                      />
                    ) : sortable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => col.id && toggleSort(col.id)}
                        className="hover:text-foreground -ml-2 h-8 gap-1 px-2 text-xs font-semibold tracking-wider uppercase"
                        aria-label={`Sort by ${col.header}`}
                      >
                        {col.header}
                        <SortIndicator dir={isSorted ? (sort?.dir ?? null) : null} />
                      </Button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {displayColumns.map((col, j) => (
                    <TableCell key={columnKey(col, j)} className="px-3 py-2.5">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="py-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => {
                const rowId = getRowId(row);
                const isSelected = allRecordsSelected || selectedIds.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? 'selected' : undefined}
                    className="hover:bg-sidebar-primary/[0.04] transition-colors"
                  >
                    {displayColumns.map((col, j) => (
                      <TableCell
                        key={columnKey(col, j)}
                        className={cn('px-3 py-2.5', col.className)}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="mt-4">
          <PagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
