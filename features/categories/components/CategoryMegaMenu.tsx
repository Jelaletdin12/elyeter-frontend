'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { CategoryTreeNode } from '@/features/categories/types';

type CategoryMegaMenuProps = {
  locale: string;
  categories?: CategoryTreeNode[] | null;
};

export function CategoryMegaMenu({ locale, categories }: CategoryMegaMenuProps) {
  const t = useTranslations('header');
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [open, setOpen] = useState(false);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    safeCategories[0]?.id ?? null,
  );

  const activeCategory =
    safeCategories.find((category) => category.id === activeCategoryId) ?? safeCategories[0];

  const getTranslation = (category: CategoryTreeNode) => {
    return (
      category.translations?.find((translation) => translation.locale === locale) ??
      category.translations?.[0]
    );
  };

  const getCategoryName = (category: CategoryTreeNode) => {
    return getTranslation(category)?.name ?? '';
  };

  const getCategorySlug = (category: CategoryTreeNode) => {
    return getTranslation(category)?.slug ?? '';
  };

  const getCategoryHref = (category: CategoryTreeNode) => {
    const slug = getCategorySlug(category);

    if (!slug) {
      return `/${locale}/categories`;
    }

    return `/${locale}/${slug}`;
  };

  if (!safeCategories.length) {
    return null;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* =====================================================
          CATEGORY BUTTON
      ====================================================== */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="text-muted-foreground hover:bg-accent hover:text-foreground h-9 gap-1.5 rounded-md px-2.5 transition-colors"
      >
        <Layers size={15} strokeWidth={1.8} />

        <span>{t('categories')}</span>

        <ChevronDown
          size={13}
          className={`opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* =====================================================
          MEGA MENU
      ====================================================== */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 w-[min(900px,calc(100vw-2rem))] pt-3"
          onMouseEnter={() => setOpen(true)}
        >
          <div className="border-border/70 bg-popover text-popover-foreground overflow-hidden rounded-md border shadow-2xl shadow-black/10">
            <div className="grid min-h-[360px] grid-cols-[220px_minmax(0,1fr)]">
              {/* =================================================
                  LEFT — MAIN CATEGORIES
              ================================================== */}
              <aside className="border-border/60 bg-muted/30 border-r p-3">
                <div className="space-y-1">
                  {safeCategories.map((category) => {
                    const isActive = category.id === activeCategory?.id;

                    return (
                      <Link
                        key={category.id}
                        href={getCategoryHref(category)}
                        role="menuitem"
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        onFocus={() => setActiveCategoryId(category.id)}
                        onClick={() => setOpen(false)}
                        className={[
                          'group flex w-full items-center justify-between',
                          'gap-3 rounded-xl px-3 py-2.5',
                          'text-left text-sm',
                          'transition-all duration-200',
                          isActive
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                        ].join(' ')}
                      >
                        <span className="min-w-0 truncate font-medium">
                          {getCategoryName(category)}
                        </span>

                        <ChevronRight
                          size={14}
                          className={[
                            'shrink-0 transition-all duration-200',
                            isActive
                              ? 'translate-x-0.5 opacity-100'
                              : 'opacity-30 group-hover:opacity-70',
                          ].join(' ')}
                        />
                      </Link>
                    );
                  })}
                </div>
              </aside>

              {/* =================================================
                  RIGHT — SUBCATEGORIES
              ================================================== */}
              <section className="min-w-0 p-6">
                {activeCategory ? (
                  <>
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold tracking-tight">
                          {getCategoryName(activeCategory)}
                        </h3>
                      </div>

                      <Link
                        href={getCategoryHref(activeCategory)}
                        onClick={() => setOpen(false)}
                        className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                      >
                        {t('viewAll')}
                      </Link>
                    </div>

                    {activeCategory.children?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {activeCategory.children.map((child) => (
                          <Link
                            key={child.id}
                            href={getCategoryHref(child)}
                            onClick={() => setOpen(false)}
                            className="group hover:border-border/60 hover:bg-muted/50 rounded-xl border border-transparent p-3 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-foreground min-w-0 truncate text-sm font-medium">
                                {getCategoryName(child)}
                              </span>

                              <ChevronRight
                                size={14}
                                className="text-muted-foreground shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="border-border/70 bg-muted/20 flex min-h-40 items-center justify-center rounded-xl border border-dashed">
                        <div className="text-center">
                          <p className="text-sm font-medium">{t('noSubcategories')}</p>

                          <p className="text-muted-foreground mt-1 text-xs">
                            {t('browseCategory')}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </section>
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}
            <div className="border-border/60 bg-muted/20 flex items-center justify-between border-t px-5 py-3">
              <span className="text-muted-foreground text-xs">{t('discover')}</span>

              <Link
                href={`/${locale}/categories`}
                onClick={() => setOpen(false)}
                className="group text-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <span>{t('viewAllCategories')}</span>

                <ChevronRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
