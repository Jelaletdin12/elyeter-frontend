import { SearchResults } from '@/features/products/components/SearchResults';

/**
 * STANDARDS.md #4/#12: /search Client Component + TanStack Query'dir,
 * Next.js Data Cache'e ASLA girmez — query param'a bağlı sonsuz kombinasyon
 * cache'i şişirir. Backend'in pg_trgm tabanlı arama sonucu debounce
 * edilerek client'tan çekilir (bkz. SearchResults).
 */
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchResults />
    </div>
  );
}
