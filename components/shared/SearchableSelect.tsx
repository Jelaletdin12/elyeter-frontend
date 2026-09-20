'use client';

import { useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/**
 * Arama kutusu içeren açılır select — Radix Select + Command yerine
 * DataTableToolbar'daki backdrop-dropdown deseninin bir variesyonu
 * (FRONTEND_AGENTS.md: bağımlılık eklenmez, basit dropdown kullanılır).
 * Çok sayıda seçenekli listeler için (örn. kategori marka seçimi,
 * admin brand filtre kategori listesi).
 */
export type SearchableOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results',
  className = '',
  label,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((opt) => opt.value === value);
  const filtered = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 focus:outline-none ${
          open ? 'border-sidebar-primary' : ''
        } ${selected ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <span className="line-clamp-1 text-left">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="rounded-md border-border bg-card absolute right-0 z-50 mt-1.5 w-full min-w-56 border shadow-lg">
            <div className="relative border-b border-border p-2">
              <Search
                size={13}
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="border-border bg-background placeholder:text-muted-foreground/60 h-8 w-full rounded-md border py-0 pr-7 pl-7 text-sm focus:border-sidebar-primary focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <ul
              role="listbox"
              className="max-h-64 overflow-y-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">{emptyText}</li>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <li key={opt.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => {
                          onValueChange(opt.value);
                          close();
                        }}
                        className={`relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm text-left select-none disabled:pointer-events-none disabled:opacity-50 ${
                          isSelected
                            ? 'bg-sidebar-primary/10 text-foreground font-medium'
                            : 'text-foreground hover:bg-background'
                        }`}
                      >
                        <span className="flex-1 truncate">{opt.label}</span>
                        {isSelected && <Check size={15} className="text-sidebar-primary" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}