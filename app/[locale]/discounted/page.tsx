import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api/client';
import { dataCacheTags } from '@/lib/api/query-keys';
import { ProductGrid } from '@/features/home/components/ProductGrid';
import type { ProductListResponse } from '@/features/products/types';

/**
 * 🔥 İNDİRİMDEKİLER — GET /products/discounted (backend'te mevcuttu,
 * 2026-09-14'te kategori subtree genişletmesi eklendi: ?categoryId= parent
 * verilirse o ağacın tüm alt dallarındaki indirimli ürünler gelir).
 *
 * İndirimli ürün = en az bir varyantın compareAtPrice > price olması
 * (backend'e curl ile doğrulandı: %20 indirimli ürün bu endpoint'te gelir).
 *
 * STANDARDS.md #4: ISR, tags:['products','home'], revalidate:300.
 */

async function getDiscountedProducts(locale: string): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(`/products/discounted?locale=${locale}&limit=12`, {
    next: { revalidate: 300, tags: [dataCacheTags.products()] },
  });
}

export const metadata: Metadata = {
  title: 'Discounted products',
};

export default async function DiscountedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const productList = await getDiscountedProducts(locale);

  return (
    <div>
      <ProductGrid products={productList.items} locale={locale} title="Discounted products" />
    </div>
  );
}
