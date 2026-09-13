'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchBar({ locale }: { locale: string }) {
  const router = useRouter();

  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const query = value.trim();

    if (!query) {
      return;
    }

    router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="group bg-background focus-within:border-foreground/20 flex h-14 w-full items-center rounded-2xl border px-3 shadow-sm transition focus-within:shadow-md"
    >
      <Search className="text-muted-foreground ml-1 size-5 shrink-0" strokeWidth={1.8} />

      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products, categories and brands"
        aria-label="Search products"
        autoComplete="off"
        className="h-full flex-1 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
      />

      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="mr-1 size-8 rounded-full"
        >
          <X className="size-4" />
        </Button>
      )}

      <Button
        type="submit"
        disabled={!value.trim()}
        className="h-10 rounded-xl px-4 max-sm:size-10 max-sm:px-0"
      >
        <span className="max-sm:hidden">Search</span>

        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
