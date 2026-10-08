'use client';

import type { RefObject } from 'react';
import { Camera, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

type SearchBoxProps = {
  mode: 'text' | 'image';
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onOpenImageMode: () => void;
  onExitImageMode: () => void;
};

/**
 * Tek, birleşik arama çubuğu.
 * - text modu: input + temizle butonu
 * - image modu: "fotoğrafla arama" etiketi + çıkış butonu
 * Kamera butonu her zaman çubuğun içinde -> görsel arama keşfedilebilir.
 */
export function SearchBox({
  mode,
  value,
  inputRef,
  onChange,
  onSubmit,
  onClear,
  onOpenImageMode,
  onExitImageMode,
}: SearchBoxProps) {
  const t = useTranslations('search');
  const isImage = mode === 'image';

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
        inputRef.current?.blur(); // mobilde klavyeyi kapat
      }}
      className="border-border bg-card focus-within:border-ring focus-within:ring-ring/20 flex h-12 items-center gap-2 rounded-full border pr-1.5 pl-4 shadow-sm transition-shadow focus-within:ring-4 sm:h-14 sm:pl-5"
    >
      {isImage ? (
        <Camera className="text-primary size-5 shrink-0" aria-hidden="true" />
      ) : (
        <Search className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
      )}

      {isImage ? (
        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
          {t('imageQuery')}
        </span>
      ) : (
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('productsPlaceholder')}
          aria-label={t('productsPlaceholder')}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
        />
      )}

      {isImage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onExitImageMode}
          aria-label={t('exitImageMode')}
          className="text-muted-foreground size-9 shrink-0 rounded-full"
        >
          <X className="size-4" />
        </Button>
      ) : (
        <>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              aria-label={t('clear')}
              className="text-muted-foreground size-9 shrink-0 rounded-full"
            >
              <X className="size-4" />
            </Button>
          )}

          <span className="bg-border h-6 w-px shrink-0" aria-hidden="true" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenImageMode}
            aria-label={t('imageSearch')}
            title={t('imageSearch')}
            className="text-muted-foreground hover:text-primary size-9 shrink-0 rounded-full sm:size-10"
          >
            <Camera className="size-5" />
          </Button>
        </>
      )}
    </form>
  );
}
