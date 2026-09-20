'use client';

import { useRef, useState } from 'react';
import { Search, SlidersHorizontal, Filter, ChevronDown, X, GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from './SearchableSelect';

/**
 * Admin tablo araç çubuğu — tbbank-admin'in dataTableToolbar.tsx mantığı
 * (FRONTEND_AGENTS.md #16): arama, kolon görünürlüğü + SÜRÜKLE-SIRALA
 * dropdown, aktif filtre sayacı badge'li filtre popover'ı ve per-page seçici.
 *
 * Kolon state'i sayfa tarafında tutulur (DataTable'a da geçilir) — tek kaynak.
 * Backdrop tabanlı basit dropdown'lar kullanılır (Radix Popover şart değil).
 */
export type ToolbarColumn = { id: string; label: string };

export type ToolbarFilterField = {
  id: string;
  label: string;
  /**
   * `select` → Radix Select; `combobox` → aramalı açılır liste
   * (SearchableSelect — çok seçenekli listeler için, bkz. brand sayfası
   * category filter). `text` → metin input.
   */
  type?: 'text' | 'select' | 'combobox';
  options?: { value: string; label: string }[];
};

export type ToolbarActiveFilter = {
  fieldId: string;
  value: string;
};

type DataTableToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  columns: ToolbarColumn[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;

  filterFields?: ToolbarFilterField[];
  activeFilters?: ToolbarActiveFilter[];
  onFilterChange?: (fieldId: string, value: string) => void;
  onFilterReset?: () => void;

  perPageOptions?: number[];
  perPage?: number;
  onPerPageChange?: (value: number) => void;

  actionLabel?: string;
  onAction?: () => void;

  hideSearch?: boolean;
  hideAction?: boolean;
  extraActions?: ReactNode;
};

function ToggleColumnsDropdown({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: Pick<
  DataTableToolbarProps,
  | 'columns'
  | 'columnVisibility'
  | 'onColumnVisibilityChange'
  | 'columnOrder'
  | 'onColumnOrderChange'
>) {
  const [open, setOpen] = useState(false);
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const isVisible = (id: string) =>
    columnVisibility[id] === undefined ? true : columnVisibility[id];

  const ordered = [...columns].sort((a, b) => {
    const ai = columnOrder.indexOf(a.id);
    const bi = columnOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  function handleDrop(targetId: string) {
    const sourceId = dragIdRef.current;
    dragIdRef.current = null;
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const next = [...columnOrder];
    const from = next.indexOf(sourceId);
    const to = next.indexOf(targetId);
    const safeFrom = from === -1 ? next.length : from;
    const safeTo = to === -1 ? next.length : to;
    next.splice(safeFrom, 1);
    next.splice(safeTo, 0, sourceId);
    onColumnOrderChange(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle columns"
        className={`rounded-md border-border bg-card text-muted-foreground hover:bg-background hover:text-foreground flex h-9 cursor-pointer items-center gap-1.5 border px-3 text-sm transition-colors ${
          open ? 'border-sidebar-primary text-foreground' : ''
        }`}
      >
        <SlidersHorizontal size={14} />
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="rounded-md border-border bg-card absolute right-0 z-50 mt-1.5 w-56 border py-2 shadow-lg">
            <p className="text-muted-foreground px-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase">
              Columns
            </p>
            {ordered.map((col) => (
              <div
                key={col.id}
                draggable
                onDragStart={() => (dragIdRef.current = col.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIdRef.current !== col.id) setDragOverId(col.id);
                }}
                onDrop={() => handleDrop(col.id)}
                onDragEnd={() => {
                  dragIdRef.current = null;
                  setDragOverId(null);
                }}
                className={`hover:bg-background flex cursor-default items-center gap-2.5 px-3 py-1.5 transition-colors ${
                  dragOverId === col.id ? 'border-sidebar-primary bg-sidebar-primary/5 border-l-2' : ''
                }`}
              >
                <GripVertical
                  size={13}
                  className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing"
                />
                <input
                  id={`col-toggle-${col.id}`}
                  type="checkbox"
                  checked={isVisible(col.id)}
                  onChange={() =>
                    onColumnVisibilityChange({ ...columnVisibility, [col.id]: !isVisible(col.id) })
                  }
                  className="accent-teal h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor={`col-toggle-${col.id}`}
                  className="text-foreground flex-1 cursor-pointer truncate text-sm select-none"
                >
                  {col.label}
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterDropdown({
  filterFields,
  activeFilters,
  onFilterChange,
  onFilterReset,
  perPageOptions,
  perPage,
  onPerPageChange,
}: Pick<
  DataTableToolbarProps,
  | 'filterFields'
  | 'activeFilters'
  | 'onFilterChange'
  | 'onFilterReset'
  | 'perPageOptions'
  | 'perPage'
  | 'onPerPageChange'
>) {
  const [open, setOpen] = useState(false);
  const fields = filterFields ?? [];
  const active = activeFilters ?? [];
  const activeCount = active.filter((f) => f.value !== '').length;
  const hasActive = activeCount > 0;
  const getValue = (id: string) => active.find((f) => f.fieldId === id)?.value ?? '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filters"
        className={`rounded-md border-border bg-card text-muted-foreground hover:bg-background hover:text-foreground flex h-9 cursor-pointer items-center gap-1.5 border px-3 text-sm transition-colors ${
          open || hasActive ? 'border-sidebar-primary text-foreground' : ''
        }`}
      >
        <Filter size={14} />
        {hasActive && (
          <span className="bg-sidebar-primary flex h-4 w-4 items-center justify-center rounded-full text-xs leading-none font-semibold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="rounded-md border-border bg-card absolute right-0 z-50 mt-1.5 flex w-64 flex-col border shadow-lg">
            <div className="border-border border-b px-3 py-2">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                Filters
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto px-3 py-3">
              {fields.map((field) => {
                const current = getValue(field.id);
                const isFieldActive = current !== '';
                return (
                  <div key={field.id} className="space-y-1">
                    <label className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                      {field.label}
                    </label>
                    <div className="flex items-center gap-1">
                      {field.type === 'combobox' ? (
                        <>
                          <SearchableSelect
                            value={current}
                            onValueChange={(val) => onFilterChange?.(field.id, val)}
                            options={field.options?.map((o) => ({ value: o.value, label: o.label })) ?? []}
                            placeholder="—"
                            searchPlaceholder={`Search ${field.label.toLowerCase()}…`}
                            emptyText="No results"
                            className="flex-1"
                          />
                          {isFieldActive && (
                            <button
                              type="button"
                              onClick={() => onFilterChange?.(field.id, '')}
                              aria-label={`Clear ${field.label}`}
                              className="text-muted-foreground hover:bg-background hover:text-foreground h-6 w-6 shrink-0 rounded transition-colors"
                            >
                              <X size={11} className="mx-auto" />
                            </button>
                          )}
                        </>
                      ) : field.type === 'select' ? (
                        <>
                          <Select
                            value={current || '__all__'}
                            onValueChange={(val) =>
                              onFilterChange?.(field.id, val === '__all__' ? '' : val)
                            }
                          >
                            <SelectTrigger
                              className={`h-8 flex-1 text-sm ${isFieldActive ? 'border-sidebar-primary text-foreground' : 'text-muted-foreground'}`}
                            >
                              <SelectValue>
                                {isFieldActive
                                  ? field.options?.find((o) => o.value === current)?.label
                                  : '—'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all__">
                                <span className="text-muted-foreground">All</span>
                              </SelectItem>
                              {(field.options ?? []).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isFieldActive && (
                            <button
                              type="button"
                              onClick={() => onFilterChange?.(field.id, '')}
                              aria-label={`Clear ${field.label}`}
                              className="text-muted-foreground hover:bg-background hover:text-foreground h-6 w-6 shrink-0 rounded transition-colors"
                            >
                              <X size={11} className="mx-auto" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={current}
                            onChange={(e) => onFilterChange?.(field.id, e.target.value)}
                            placeholder="—"
                            className={`rounded-md border-border bg-card text-foreground placeholder:text-muted-foreground/50 h-8 flex-1 border px-2.5 text-sm focus:outline-none ${
                              isFieldActive ? 'border-sidebar-primary' : ''
                            }`}
                          />
                          {isFieldActive && (
                            <button
                              type="button"
                              onClick={() => onFilterChange?.(field.id, '')}
                              aria-label={`Clear ${field.label}`}
                              className="text-muted-foreground hover:bg-background hover:text-foreground h-6 w-6 shrink-0 rounded transition-colors"
                            >
                              <X size={11} className="mx-auto" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {onPerPageChange && (
              <div className="border-border border-t px-3 py-3">
                <label className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                  Per page
                </label>
                <Select
                  value={String(perPage)}
                  onValueChange={(val) => onPerPageChange(Number(val))}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(perPageOptions ?? [10, 25, 50, 100]).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasActive && (
              <div className="border-border border-t px-3 py-2">
                <button
                  type="button"
                  onClick={onFilterReset}
                  className="rounded-md border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 border text-xs font-medium transition-colors"
                >
                  <X size={11} />
                  Reset ({activeCount})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  filterFields,
  activeFilters,
  onFilterChange,
  onFilterReset,
  perPageOptions,
  perPage,
  onPerPageChange,
  actionLabel,
  onAction,
  hideSearch = false,
  hideAction = false,
  extraActions,
}: DataTableToolbarProps) {
  return (
    <div
      className={`mb-3 flex flex-wrap items-center gap-2 sm:gap-3 ${hideSearch ? 'justify-end' : 'justify-between'}`}
    >
      {!hideSearch && (
        <div className="relative min-w-0 flex-1 sm:flex-initial">
          <Search
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="border-border bg-card focus:border-sidebar-primary rounded-md text-foreground placeholder:text-muted-foreground h-9 w-full max-w-64 border py-0 pr-3 pl-9 text-sm transition-colors focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <ToggleColumnsDropdown
          columns={columns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={onColumnVisibilityChange}
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
        />

        {filterFields && filterFields.length > 0 && onFilterChange && onFilterReset && (
          <FilterDropdown
            filterFields={filterFields}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onFilterReset={onFilterReset}
            perPageOptions={perPageOptions}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
          />
        )}

        {extraActions}

        {!hideAction && actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel && <span>{actionLabel}</span>}</Button>
        )}
      </div>
    </div>
  );
}
