'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar({ locale }: { locale: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-card bg-surface px-5 py-4 shadow-[0_12px_32px_rgba(23,22,20,0.16)]"
    >
      <Search size={20} className="shrink-0 text-ink-muted" strokeWidth={1.75} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for products…"
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-card bg-ink px-4 py-2 text-sm font-medium text-white"
      >
        Search
      </button>
    </form>
  );
}
