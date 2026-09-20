import Link from 'next/link';
import type { Brand } from '@/features/brands/types';
import { brandTranslation } from '@/features/brands/types';

/**
 * Public marka kartı — /brands grid + kategori rail. Marka adı çevirisini
 * locale'e göre çözer (backend tüm translations'ı populate edip döner).
 * `productsCount` yoksa (public response'ta _count gelmiyorsa) fallback submit.
 */
export function BrandCard({ brand, locale }: { brand: Brand; locale: string }) {
  const t = brandTranslation(brand, locale);
  const name = t?.name ?? brand.id;
  const slug = t?.slug ?? '';

  return (
    <Link
      href={`/${locale}/brand/${slug}`}
      className="group hover:border-primary/50 bg-background/60 flex items-center gap-4 rounded-xl border p-4 transition-colors"
    >
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt="" className="size-10 shrink-0 rounded-lg object-contain" />
      ) : (
        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
          <span className="text-primary text-sm font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {typeof brand._count?.products === 'number' && (
          <p className="text-muted-foreground text-xs">{brand._count.products} products</p>
        )}
      </div>
    </Link>
  );
}
