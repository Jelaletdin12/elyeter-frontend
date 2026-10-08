'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Camera, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchBar({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations('search');
  const tCommon = useTranslations('common');

  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const query = value.trim();

    if (!query) return;

    router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="group border-border/80 bg-card/90 hover:border-primary/25 focus-within:border-primary/45 dark:bg-card/80 dark:border-border/70 dark:hover:border-primary/30 dark:focus-within:border-primary/50 relative flex h-10 w-full items-center rounded-md border shadow-[0_4px_20px_rgba(15,42,68,0.06)] transition-all duration-300 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.08),0_8px_30px_rgba(15,42,68,0.10)] hover:shadow-[0_6px_28px_rgba(15,42,68,0.09)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.10),0_10px_36px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    >
      {/* Input */}
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('inputLabel')}
        autoComplete="off"
        className="text-foreground placeholder:text-muted-foreground/65 h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium tracking-[-0.01em] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden"
      />

      {/* Clear */}
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setValue('')}
          aria-label={t('clear')}
          className="text-muted-foreground hover:bg-muted hover:text-foreground mr-0.5 size-8 shrink-0 rounded-xl transition-all"
        >
          <X size={15} strokeWidth={2} />
        </Button>
      )}

      {/* Divider */}
      <div className="bg-border/80 mx-1 h-6 w-px shrink-0" />

      {/* Visual search → /search?mode=image sayfası */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => router.push(`/${locale}/search?mode=image`)}
        aria-label={t('tabImage')}
        className="text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0 rounded-xl transition-all duration-200 active:scale-95"
      >
        <Camera size={17} strokeWidth={1.8} />
      </Button>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!value.trim()}
        aria-label={tCommon('search')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 ml-0.5 h-full! shrink-0 rounded-md shadow-[0_4px_14px_rgba(20,184,166,0.20)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(20,184,166,0.30)] active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none sm:h-9 sm:w-auto sm:px-3.5"
      >
        <Search />
      </Button>
    </form>
  );
}
