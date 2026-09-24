import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * CategoryRail artık hem categories API'sinin tam `Category`'sini hem de
 * öneri API'sinin `id + imageUrl + translations{locale,name,slug}` lite
 * şeklini kabul eder (structural alt-küme — brands BrandLike deseniyle aynı).
 * Sadece name/slug/imageUrl kullanıldığı için tam Category zorunlu değildir.
 */
export type CategoryRailItem = {
  id: string;
  imageUrl?: string | null;
  translations: { locale: string; name: string; slug: string }[];
};

export function CategoryRail({ categories, locale }: { categories: CategoryRailItem[]; locale: string }) {
  if (categories.length === 0) return null;
  const visibleCategories = categories.slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-primary size-1.5 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.7)]" />
            <span className="text-primary text-[11px] font-semibold tracking-[0.18em] uppercase">
              Explore
            </span>
          </div>

          <h2 className="text-foreground text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Shop by category
          </h2>

          <p className="text-muted-foreground mt-1.5 text-sm">
            Find the products that fit your world.
          </p>
        </div>

        <Link
          href={`/${locale}/categories`}
          className="group border-border bg-card/70 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary hidden shrink-0 items-center gap-1.5 rounded-md border px-4 py-2 text-xs font-semibold transition-all duration-200 sm:flex"
        >
          View all
          <ArrowUpRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      {/* Category grid / rail */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visibleCategories.map((category, index) => {
          const translation =
            category.translations.find((t) => t.locale === locale) ?? category.translations[0];

          if (!translation) return null;

          return (
            <Link
              key={category.id}
              href={`/${locale}/${translation.slug}`}
              className="group border-border/70 bg-card hover:border-primary/30 dark:bg-card/90 relative overflow-hidden rounded-2xl border shadow-[0_4px_18px_rgba(15,42,68,0.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,42,68,0.10)] dark:shadow-[0_5px_22px_rgba(0,0,0,0.16)] dark:hover:shadow-[0_14px_35px_rgba(0,0,0,0.28)]"
            >
              {/* Image */}
              <div className="bg-muted relative aspect-[1.15/1] overflow-hidden">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={translation.name}
                    fill
                    sizes="
                      (max-width: 640px) 50vw,
                      (max-width: 1024px) 33vw,
                      (max-width: 1280px) 25vw,
                      16vw
                    "
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="from-primary/15 via-muted to-primary/5 absolute inset-0 bg-gradient-to-br">
                    <div className="bg-primary/10 group-hover:bg-primary/20 absolute -top-8 -right-8 size-28 rounded-full blur-2xl transition-all duration-500" />

                    <div className="border-primary/20 bg-primary/10 absolute bottom-4 left-4 size-10 rounded-xl border backdrop-blur-sm" />
                  </div>
                )}

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

                {/* Number */}
                <span className="absolute top-3 left-3 flex size-7 items-center justify-center rounded-lg border border-white/15 bg-black/20 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Arrow */}
                <span className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/80 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
                  <ArrowUpRight size={13} />
                </span>
              </div>

              {/* Content */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-3.5">
                <div className="min-w-0">
                  <h3 className="text-foreground group-hover:text-primary truncate text-sm font-semibold tracking-[-0.015em] transition-colors">
                    {translation.name}
                  </h3>

                  <span className="text-muted-foreground/60 mt-0.5 block text-[10px] font-medium tracking-[0.12em] uppercase">
                    Explore
                  </span>
                </div>

                <span className="bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile view all */}
      <Link
        href={`/${locale}/categories`}
        className="group border-border bg-card/70 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary mt-5 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition-all sm:hidden"
      >
        View all categories
        <ArrowUpRight
          size={14}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </Link>
    </section>
  );
}
