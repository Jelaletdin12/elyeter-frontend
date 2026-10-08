'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type SearchableOption = {
  value: string;
  label: string;
  disabled?: boolean;

  /** 0 = root, 1 = child, 2 = nested child */
  depth?: number;

  hasChildren?: boolean;
  isParent?: boolean;

  /** Parent option's `value`. Required for expand/collapse. */
  parentId?: string | null;
};

type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;

  options: SearchableOption[];

  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;

  className?: string;
  label?: string;

  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  id,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results',
  className,
  label,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const optionById = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const isSearching = search.trim() !== '';

  const visibleOptions = useMemo(() => {
    // Aramada hiyerarşi yok sayılır, cmdk filtreler.
    if (isSearching) return options;

    return options.filter((option) => {
      let parentId = option.parentId ?? null;
      while (parentId) {
        if (!expanded.has(parentId)) return false;
        parentId = optionById.get(parentId)?.parentId ?? null;
      }
      return true;
    });
  }, [options, optionById, expanded, isSearching]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setSearch('');

    if (next && value) {
      // Seçili kategorinin atalarını aç.
      setExpanded((prev) => {
        const nextSet = new Set(prev);
        let parentId = optionById.get(value)?.parentId ?? null;
        while (parentId) {
          nextSet.add(parentId);
          parentId = optionById.get(parentId)?.parentId ?? null;
        }
        return nextSet;
      });
    }
  }

  function toggleExpanded(optionValue: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(optionValue)) next.delete(optionValue);
      else next.add(optionValue);
      return next;
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label ?? placeholder}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between',
            'rounded-lg',
            'border-input',
            'bg-input-background',
            'px-3',
            'font-normal',
            'text-sm',
            'shadow-[0_1px_2px_rgba(15,42,68,0.03)]',
            'transition-all duration-200',
            'hover:border-slate-300',
            'hover:bg-input-background',
            'focus-visible:border-primary',
            'focus-visible:ring-2',
            'focus-visible:ring-primary/15',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selected?.label ?? placeholder}
          </span>

          <ChevronDown
            className={cn(
              'text-muted-foreground ml-2 size-4 shrink-0',
              'transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          'w-[var(--radix-popover-trigger-width)]',
          'min-w-[280px]',
          'overflow-hidden',
          'rounded-xl',
          'border-border',
          'bg-card',
          'p-0',
          'shadow-xl',
        )}
      >
        <Command className="bg-card" loop>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            className={cn(
              'h-11',
              'border-0',
              'bg-input-background',
              'text-foreground',
              'placeholder:text-muted-foreground/70',
              'focus:ring-0',
            )}
          />

          <CommandList className="max-h-72 p-1.5">
            <CommandEmpty className="text-muted-foreground px-3 py-8 text-center text-sm">
              {emptyText}
            </CommandEmpty>

            <CommandGroup>
              {visibleOptions.map((option) => {
                const isSelected = option.value === value;
                const depth = isSearching ? 0 : (option.depth ?? 0);
                const hasChildren = option.hasChildren ?? false;
                const isParent = option.isParent ?? depth === 0;
                const isExpanded = expanded.has(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    // id'yi value'ya kat: aynı isimli kategoriler çakışmasın.
                    value={`${option.label} ${option.value}`}
                    disabled={option.disabled}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'relative',
                      'min-h-9',
                      'cursor-pointer',
                      'rounded-lg',
                      'px-2.5',
                      'py-2',
                      'text-sm',
                      'transition-colors duration-150',

                      // cmdk v1: data-disabled="false" da yazılır, "=true" kullan.
                      'data-[disabled=true]:pointer-events-none',
                      'data-[disabled=true]:opacity-40',

                      isSelected
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className="flex min-w-0 flex-1 items-center"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      {/* Expand/collapse: aramada gizli */}
                      {!isSearching &&
                        (hasChildren ? (
                          <span
                            role="button"
                            tabIndex={-1}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            aria-expanded={isExpanded}
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(option.value);
                            }}
                            className="hover:bg-muted-foreground/10 mr-1 flex size-5 shrink-0 items-center justify-center rounded"
                          >
                            <ChevronRight
                              aria-hidden="true"
                              className={cn(
                                'text-muted-foreground size-4 transition-transform duration-150',
                                isExpanded && 'rotate-90',
                              )}
                            />
                          </span>
                        ) : (
                          <span className="mr-1 size-5 shrink-0" aria-hidden="true" />
                        ))}

                      {depth > 0 && (
                        <CornerDownRight
                          aria-hidden="true"
                          className="text-border mr-1.5 size-3.5 shrink-0"
                          strokeWidth={1.6}
                        />
                      )}

                      <span
                        className={cn(
                          'min-w-0 truncate',
                          isParent && depth === 0 && 'text-foreground font-medium',
                          depth > 0 && 'text-muted-foreground font-normal',
                          isSelected && 'text-foreground font-medium',
                        )}
                      >
                        {option.label}
                      </span>
                    </span>

                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="text-primary ml-2 size-4 shrink-0"
                        strokeWidth={2.2}
                      />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
