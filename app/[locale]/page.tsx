import { getPublicBanners } from '@/features/banners/api/queries';
import { getPublicCategories } from '@/features/categories/api/queries';
import { apiFetch } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import { HeroBanner } from '@/features/home/components/HeroBanner';
import { CategoryRail } from '@/features/home/components/CategoryRail';
import { ProductGrid } from '@/features/home/components/ProductGrid';
import type { ProductListResponse } from '@/features/products/types';

/**
 * ✅ Artık GERÇEK veri — banners/categories/products'ın hepsi curl ile
 * doğrulandı (bkz. features/banners, features/categories, features/products
 * altındaki type dosyaları). Mock data katmanı (features/home/get-home-page-data.ts)
 * artık KULLANILMIYOR, silinebilir.
 *
 * STANDARDS.md #4: ISR, tags:['home','banners','categories','products'],
 * revalidate:300.
 */

async function getHomepageProducts(locale: string): Promise<ProductListResponse> {
  // ⚠️ "featured" gibi bir alan backend'de (schema.prisma) YOK — sadece
  // varsayılan sıralamayla ilk sayfayı çekiyoruz.
  return apiFetch<ProductListResponse>(`/products?locale=${locale}&limit=8`, {
    next: { revalidate: 300, tags: [dataCacheTags.home(), dataCacheTags.products()] },
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const [banners, categoryList, productList] = await Promise.all([
    getPublicBanners(),
    getPublicCategories(),
    getHomepageProducts(locale),
  ]);

  return (
    <div>
      {banners.length > 0 && <HeroBanner banners={banners} locale={locale} />}
      <CategoryRail categories={categoryList.items} locale={locale} />
      <ProductGrid products={productList.items} locale={locale} />
    </div>
  );
}
