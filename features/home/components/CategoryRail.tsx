import Link from 'next/link';
import { categoryTranslation, type Category } from '@/features/categories/types';

/**
 * ✅ Gerçek Category tipi — `accent` diye bir alan yok (mock'ta renk
 * kodlaması veriden geliyordu). Renk noktası hâlâ işlevsel (göz taraması
 * için art arda aynı renk gelmesin diye) ama artık dizideki INDEX'ten
 * hesaplanıyor, backend'den gelmiyor.
 */
export function CategoryRail({ categories, locale }: { categories: Category[]; locale: string }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <h2 className="font-display text-2xl italic">Browse categories</h2>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {categories.map((category, i) => {
          const translation = categoryTranslation(category, locale);
          if (!translation) return null;

          return (
            <Link
              key={category.id}
              href={`/${locale}/${translation.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-card border border-line bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-ink/30"
            >
              <span
                className={i % 2 === 0 ? 'h-2 w-2 rounded-full bg-saffron' : 'h-2 w-2 rounded-full bg-teal'}
              />
              {translation.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
