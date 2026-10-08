import Link from 'next/link';
import Image from 'next/image';
import type { Brand } from '@/features/brands/types';
import { brandTranslation } from '@/features/brands/types';

interface BrandCardProps {
  brand: Brand;
  locale: string;
}

export function BrandCard({ brand, locale }: BrandCardProps) {
  const t = brandTranslation(brand, locale);
  const name = t?.name ?? brand.id;
  const slug = t?.slug ?? '';

  return (
    <Link
      href={`/${locale}/brand/${slug}`}
      className="group border-border bg-card hover:border-border/80 flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm"
    >
      {brand.logoUrl ? (
        <div className="border-border bg-background relative size-10 shrink-0 overflow-hidden rounded-lg border p-1">
          <Image
            src={brand.logoUrl}
            alt={name}
            fill
            sizes="40px"
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <span className="text-foreground text-sm font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
          {name}
        </p>
        {typeof brand._count?.products === 'number' && (
          <p className="text-muted-foreground mt-0.5 text-xs">{brand._count.products} products</p>
        )}
      </div>
    </Link>
  );
}
