'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

type SearchResult = { id: string; name: string; slug: string };

const DEBOUNCE_MS = 350;

export function SearchResults() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedTerm) params.set('q', debouncedTerm);
    else params.delete('q');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.search.results(storeId, locale, debouncedTerm),
    queryFn: () =>
      apiFetch<SearchResult[]>(
        `/search?locale=${locale}&q=${encodeURIComponent(debouncedTerm)}`,
        { cache: 'no-store' },
      ),
    enabled: debouncedTerm.length > 1,
    staleTime: 0,
  });

  return (
    <div>
      <input
        autoFocus
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search products..."
        className="w-full rounded-md border border-line px-3 py-2 text-sm"
      />

      {isFetching && <p className="mt-4 text-sm text-ink-muted">...</p>}

      {!isFetching && debouncedTerm.length > 1 && (data?.length ?? 0) === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={SearchX}
            title={`No results for "${debouncedTerm}"`}
            description="Try a different search term or check the spelling."
          />
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data?.map((result) => (
          <li key={result.id} className="rounded-lg border border-line p-3">
            {result.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
