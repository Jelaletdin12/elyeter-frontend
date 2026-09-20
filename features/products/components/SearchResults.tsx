'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

/**
 * ⚠️ GET /search'in response şeması Swagger'da yok — backend search.service.ts'ten
 * çıkarıldı (2026-09-10). Şekil her zaman { products, categories }; `price`
 * Decimal serialization yüzünden string gelir ("From X" değil, en ucuz aktif
 * varyantın fiyatı).
 */
type SearchProductResult = {
  id: string;
  sku: string;
  price: string;
  slug: string;
  name: string;
  cardImageUrl: string | null;
  matchedIn: 'name' | 'description';
};

type SearchCategoryResult = { id: string; slug: string; name: string };

type SearchResultsData = {
  products: SearchProductResult[];
  categories: SearchCategoryResult[];
};

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
      apiFetch<SearchResultsData>(
        `/search?locale=${locale}&q=${encodeURIComponent(debouncedTerm)}`,
        { cache: 'no-store' },
      ),
    enabled: debouncedTerm.length > 1,
    staleTime: 0,
  });

  const hasResults = data && (data.products.length > 0 || data.categories.length > 0);

  return (
    <div>
      <input
        autoFocus
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search products..."
        className="border-border w-full rounded-md border px-3 py-2 text-sm"
      />

      {isFetching && <p className="text-muted-foreground mt-4 text-sm">...</p>}

      {!isFetching && debouncedTerm.length > 1 && !hasResults && (
        <div className="mt-4">
          <EmptyState
            icon={SearchX}
            title={`No results for "${debouncedTerm}"`}
            description="Try a different search term or check the spelling."
          />
        </div>
      )}

      {data?.categories.length ? (
        <div className="mt-6">
          <h2 className="text-muted-foreground text-sm font-medium">Categories</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/${category.slug}`}
                className="border-border bg-card text-foreground hover:border-sidebar-primary rounded-full border px-3 py-1 text-sm transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data?.products.map((product) => (
          <li key={product.id}>
            <Link href={`/${locale}/products/${product.slug}`} className="group block">
              <div className="border-border bg-card relative aspect-square overflow-hidden rounded-lg border">
                {product.cardImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- gerçek entegrasyonda next/image + remotePatterns
                  <img
                    src={product.cardImageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}
              </div>
              <p className="text-foreground mt-2 truncate text-sm">{product.name}</p>
              <div className="flex items-baseline justify-between">
                <p className="text-foreground font-serif text-sm italic">{product.price}</p>
                <p className="text-muted-foreground text-xs">{product.sku}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
