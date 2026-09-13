'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Server-side sayfa listeleri için ortak sayfalama — tbbank-admin'in
 * dataTable.tsx'teki ellipsis'li Pagination mantığı burada paylaşılır
 * (FRONTEND_AGENTS.md #16). DataTable + coupons/orders sayfaları kullanır.
 */
type PagePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
};

function getPages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];
  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export function PagePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: PagePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {typeof totalCount === 'number' && <>{totalCount} records · </>}
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </Button>

        {getPages(currentPage, totalPages).map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="text-muted-foreground px-1.5">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              className={
                page === currentPage ? 'bg-saffron text-foreground hover:bg-saffron-dark' : 'bg-card'
              }
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}
