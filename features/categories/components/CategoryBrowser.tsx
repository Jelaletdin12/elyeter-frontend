'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { publicCategoryListOptions } from '../api/queries';
import { categoryTranslation } from '../types';
import type { Category, CategoryListResponse } from '../types';

interface CategoryBrowserProps {
  initialCategoryList: CategoryListResponse;
  locale: string;
}

export function CategoryBrowser({ initialCategoryList, locale }: CategoryBrowserProps) {
  const t = useTranslations('categories');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isFetching } = useQuery({
    ...publicCategoryListOptions(storeId, search),
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialCategoryList,
  });

  const categories = (data ?? initialCategoryList).items;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex max-w-xs items-center gap-3">
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setHasInteracted(true);
            setSearch(e.target.value);
          }}
          placeholder={t('searchPlaceholder')}
        />
        {isFetching && (
          <span className="text-muted-foreground animate-pulse text-xs">{t('searching')}</span>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((category: Category) => {
            const translation = categoryTranslation(category, locale);
            if (!translation) return null;
            return (
              <Link
                key={category.id}
                href={`/${locale}/${translation.slug}`}
                className="group border-border bg-card hover:border-border/80 overflow-hidden rounded-lg border transition-all hover:shadow-sm"
              >
                <div className="bg-muted relative aspect-[3/2] w-full overflow-hidden">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={translation.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-xs">
                      {t('noImage')}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                    {translation.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {category._count?.children
                      ? t('subcategories', { count: category._count.children })
                      : '—'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
