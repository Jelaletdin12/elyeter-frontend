'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { PagePagination } from './PagePagination';

/**
 * Admin liste tabloları (products/categories/orders/coupons/users) için
 * ORTAK generic DataTable. tbbank-admin'in dataTable.tsx mantığından
 * uyarlandı (FRONTEND_AGENTS.md #16):
 *
 * - Client-side sorting: sütun tanımına `sortValue` verilirse header tıklanabilir
 *   olur (ok indikatörü). ⚠️ Sıralama YALNIZCA geçerli sayfadaki `rows` üzerinde
 *   etkilidir — backend'de admin listeler için sort query param'ı doğrulanmadı.
 * - Server-side pagination: ellipsis'li sayfa numaraları + önceki/sonraki.
 * - Loading: gerçek tablo iskeleti (thead korunur, satırlar skeleton) — boş
 *   "No data" anında boş duruma karışmaz.
 * - `columnVisibility`/`columnOrder` toolbar'dan gelir (geçilmezse hepsi görünür,
 *   tanım sırası korunur).
 *
 * Sadece `id`'si olan sütunlar visibility/reorder'a tabidir; id'siz tanımlar
 * (opsiyonel aksiyon ters hizalı sütunlar) her zaman görünür kalır.
 */

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
  id?: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** true ise header tıklanabilir — `sortValue` yoksa hücreyi string olarak sıralar. */
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

/** products sayfasının beklediği eski isim — Column'ın alias'ı. */
export type ColumnDef<T> = Column<T>;

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

  // Toolbar'ın ürettiği kolon state'i (yoksa boş kabul edilir)
  columnVisibility?: Record<string, boolean>;
  columnOrder?: string[];

  // İlk sıralama (varsayılan)
  defaultSort?: { id: string; dir: SortDirection } | null;
};

function SortIndicator({ dir }: { dir: SortDirection | null }) {
  if (dir === 'asc') return <ArrowUp size={13} className="text-sidebar-primary shrink-0" />;
  if (dir === 'desc') return <ArrowDown size={13} className="text-sidebar-primary shrink-0" />;
  return <ArrowUpDown size={13} className="shrink-0 opacity-40" />;
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
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; dir: SortDirection } | null>(defaultSort);

  // ── Sıralama (client-side, geçerli sayfa) ──────────────────────────────────
  const columnById = useMemo(() => {
    const map = new Map<string, Column<T>>();
    for (const col of columns) if (col.id) map.set(col.id, col);
    return map;
  }, [columns]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columnById.get(sort.id);
    if (!col) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue ? col.sortValue(a) : String(a);
      const vb = col.sortValue ? col.sortValue(b) : String(b);
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

  function toggleSort(id: string) {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: 'asc' };
      if (prev.dir === 'asc') return { id, dir: 'desc' };
      return null;
    });
  }

  const showPagination = Boolean(onPageChange) && totalPages > 1;

  return (
    <div>
      <div className="rounded-md border-border bg-card overflow-x-auto border shadow-[0_1px_3px_rgba(23,22,20,0.05)]">
        <Table>
          <TableHeader className="bg-background/80">
            <TableRow>
              {visibleColumns.map((col) => {
                const isSorted = sort?.id === col.id;
                const sortable = Boolean(col.id && (col.sortable || col.sortValue));
                return (
                  <TableHead
                    key={col.id ?? col.header}
                    className={`text-muted-foreground px-3 py-3 ${col.className ?? ''}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => col.id && toggleSort(col.id)}
                        className="hover:text-foreground flex items-center gap-1 text-xs font-semibold tracking-wider uppercase transition-colors"
                        aria-label={`Sort by ${col.header}`}
                      >
                        {col.header}
                        <SortIndicator dir={isSorted ? (sort?.dir ?? null) : null} />
                      </button>
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
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id ?? col.header} className="px-3 py-2.5">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="py-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow key={getRowId(row)} className="hover:bg-sidebar-primary/[0.04] transition-colors">
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id ?? col.header}
                      className={`px-3 py-2.5 ${col.className ?? ''}`}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
            onPageChange={onPageChange as (page: number) => void}
          />
        </div>
      )}
    </div>
  );
}
