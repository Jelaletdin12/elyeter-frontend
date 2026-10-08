'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { publicBrandListOptions } from '../api/queries';
import { BrandCard } from './BrandCard';
import type { Brand, BrandListResponse } from '../types';

interface BrandFiltersProps {
  initialBrandList: BrandListResponse;
  locale: string;
  categoryOptions: Array<{ id: string; label: string }>;
}

const ALL_CATEGORIES_SENTINEL = '__all__';

export function BrandFilters({ initialBrandList, locale, categoryOptions }: BrandFiltersProps) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const t = useTranslations('brands');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data, isFetching } = useQuery({
    ...publicBrandListOptions(storeId, search, categoryId),
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialBrandList,
  });

  const brands = (data ?? initialBrandList).items;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setHasInteracted(true);
              setSearch(e.target.value);
            }}
            placeholder={t('searchPlaceholder')}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={categoryId || ALL_CATEGORIES_SENTINEL}
            onValueChange={(val) => {
              setHasInteracted(true);
              setCategoryId(val === ALL_CATEGORIES_SENTINEL ? '' : val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_SENTINEL}>{t('allCategories')}</SelectItem>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isFetching && (
          <span className="text-muted-foreground animate-pulse text-xs">{t('searching')}</span>
        )}
      </div>

      {brands.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand: Brand) => (
            <BrandCard key={brand.id} brand={brand} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
