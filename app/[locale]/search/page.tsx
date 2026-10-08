import { SearchResults } from '@/features/products/components/SearchResults';

/**
 * STANDARDS.md #4/#12: /search Client Component + TanStack Query'dir,
 * Next.js Data Cache'e ASLA girmez — query param'a bağlı sonsuz kombinasyon
 * cache'i şişirir. Backend'in pg_trgm tabanlı arama sonucu debounce
 * edilerek client'tan çekilir (bkz. SearchResults). Ayrıca SearchResults
 * useSearchParams() kullanır — prerender'ın Suspense hatası için de bu
 * dynamic kuralı gerekir.
 */
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SearchResults />
    </div>
  );
}
