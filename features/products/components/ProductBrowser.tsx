'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { productListOptions, brandCategoriesOptions } from '../api/queries';
import { availableQuantity, type Product, type ProductListResponse } from '../types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { wishlistOptions } from '@/features/wishlist/api/queries';
import { brandsByCategoryOptions } from '@/features/brands/api/queries';
import { brandTranslation } from '@/features/brands/types';

/**
 * Kategori + marka ürün sayfalarının ORTAK filtre paneli (CategoryFilters'ın
 * yerini aldı, 2026-09-18). Server'dan gelen `initialProductList` SEO/ilk
 * içeriktir (ISR). Kullanıcı panelde arama yapıp filtre seçince bu Client
 * Component kendi TanStack query'siyle devralır — filtre kombinasyonları Next
 * Data Cache'e girmez (STANDARDS.md #4).
 *
 * Panel içeriği sayfaya göre değişir:
 *   - KATEGORİ sayfası (categoryId) → arama + o kategorideki MARKALAR.
 *   - MARKA sayfası (brandId) → arama + o markanın ürünü olan KATEGORİLER.
 *   (İkisi birden geçilmez; product-list-query.dto kombinasyona zaten izin
 *   verir ama panelde aynı anda ikisini göstermek anlamsız.)
 *
 * Kategori tarafında backend GET /products `categoryId`'yi ALT AĞACA genişletir
 * (getSubtreeIds) ve `search`/`brandId` ile aynı `where`'da birleşir
 * (products.service.ts findAll) — bir kategori açılıp arama yapılırsa SADECE o
 * kategori içinden aranır; alt kategoriye gidilince o alt ağaçtan devam eder.
 * Marka tarafı için kategori listesi brandCategoriesOptions'tan türetilir
 * (backend'de marka→kategori endpoint'i yok; ürünlerin category alanı kullanılır).
 * ⚠️ minPrice/maxPrice backend'de no-op'tur (product-list-query.dto) — bu
 * yüzden panelde fiyat filtreleri YOK.
 */
export function ProductBrowser({
  categoryId,
  brandId,
  initialProductList,
  locale,
}: {
  categoryId?: string;
  brandId?: string;
  initialProductList: ProductListResponse;
  locale: string;
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [search, setSearch] = useState('');
  // Kategori sayfası: kullanıcının seçtiği marka (boş = hepsi).
  const [selectedBrandId, setSelectedBrandId] = useState('');
  // Marka sayfası: kullanıcının seçtiği kategori (boş = hepsi).
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const effectiveCategoryId = categoryId ?? (selectedCategoryId || undefined);
  const effectiveBrandId = brandId ?? (selectedBrandId || undefined);

  const { data, isFetching } = useQuery({
    ...productListOptions(storeId, {
      categoryId: effectiveCategoryId,
      brandId: effectiveBrandId,
      search,
    }),
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialProductList,
  });

  const { data: wishlist = [] } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  // Kategori sayfaları: o kategori subtree'sinde ürünü olan markalar → panel.
  const { data: brandsData, isFetching: brandsFetching } = useQuery({
    ...brandsByCategoryOptions(storeId, categoryId ?? ''),
    enabled: Boolean(categoryId),
  });
  const brandOptions = useMemo(
    () =>
      (brandsData?.items ?? []).map((brand) => ({
        id: brand.id,
        label: brandTranslation(brand, locale)?.name ?? brand.id,
      })),
    [brandsData, locale],
  );

  // Marka sayfası: markanın ürünü olan kategoriler → panel (brandCategoriesOptions).
  const { data: categoryOptions, isFetching: categoriesFetching } = useQuery({
    ...brandCategoriesOptions(storeId, locale, brandId ?? ''),
    enabled: Boolean(brandId),
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);

  const result = data ?? initialProductList;
  const products = result.items;
  const inStock = products.some((p) => p.variants.some((v) => availableQuantity(v) > 0));
  const isSectionLoading = categoryId ? brandsFetching : categoriesFetching;

  function markInteracted() {
    setHasInteracted(true);
  }

  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row">
      {/* ── Filtre paneli ─────────────────────────────────────────────── */}
      <aside className="shrink-0 lg:w-64">
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Search
            </p>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  markInteracted();
                  setSearch(e.target.value);
                }}
                placeholder={categoryId ? 'Search in this category…' : 'Search this brand…'}
                className="border-border bg-background placeholder:text-muted-foreground/60 w-full rounded-md border py-1.5 pr-7 pl-7.5 text-sm focus:border-teal focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {categoryId && !brandId && (
            <div>
              <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Brands
              </p>
              {brandOptions.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {isSectionLoading ? '…' : 'No brands in this category.'}
                </p>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        markInteracted();
                        setSelectedBrandId('');
                      }}
                      className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                        selectedBrandId === ''
                          ? 'bg-teal/10 text-teal font-medium'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground'
                      }`}
                    >
                      All brands
                    </button>
                  </li>
                  {brandOptions.map((brand) => (
                    <li key={brand.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markInteracted();
                          setSelectedBrandId(brand.id);
                        }}
                        className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                          selectedBrandId === brand.id
                            ? 'bg-teal/10 text-teal font-medium'
                            : 'text-muted-foreground hover:bg-background hover:text-foreground'
                        }`}
                      >
                        {brand.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {brandId && !categoryId && (
            <div>
              <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Categories
              </p>
              {!categoryOptions || categoryOptions.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {isSectionLoading ? '…' : 'No categories for this brand.'}
                </p>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        markInteracted();
                        setSelectedCategoryId('');
                      }}
                      className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                        selectedCategoryId === ''
                          ? 'bg-teal/10 text-teal font-medium'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground'
                      }`}
                    >
                      All categories
                    </button>
                  </li>
                  {categoryOptions.map((category) => (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markInteracted();
                          setSelectedCategoryId(category.id);
                        }}
                        className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                          selectedCategoryId === category.id
                            ? 'bg-teal/10 text-teal font-medium'
                            : 'text-muted-foreground hover:bg-background hover:text-foreground'
                        }`}
                      >
                        {category.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Sonuçlar ──────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {result.meta.total} products{inStock ? '' : ' — out of stock'}
            {isFetching && <span className="ml-2 text-xs">…</span>}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="text-muted-foreground mt-8 text-sm">
            No products found. Try a different search or clear the filters.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                isWishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}