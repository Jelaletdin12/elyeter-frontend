import type { Metadata } from 'next';
import { getPublicBrands } from '@/features/brands/api/queries';
import { getPublicCategoryTree } from '@/features/categories/api/queries';
import { BrandFilters } from '@/features/brands/components/BrandFilters';
import { categoryTranslation, type CategoryTreeNode } from '@/features/categories/types';

/**
 * TÜM MARKALAR — GET /brands (public, curl ile doğrulanmış: brand listesi + slug).
 * STANDARDS.md #4: ISR — getPublicBrands revalidate:300, tags:['brands','home'].
 * `generateStaticParams` KULLANILMAZ (bkz. [categorySlug] notu) — marka listesi
 * ilk istekte ISR'a girer. 2026-09-18: arama + kategori filtreleme
 * (BrandFilters client bileşeni, backend search/categoryId param'ları).
 */
export const metadata: Metadata = {
  title: 'Brands',
};

function flattenTreeOptions(
  nodes: CategoryTreeNode[],
  depth: number,
  locale: string,
  out: Array<{ id: string; label: string }>,
) {
  for (const node of nodes) {
    out.push({
      id: node.id,
      label: `${depth === 0 ? '' : '── '.repeat(depth)}${categoryTranslation(node, locale)?.name ?? node.id}`,
    });
    if (node.children?.length) flattenTreeOptions(node.children, depth + 1, locale, out);
  }
  return out;
}

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, tree] = await Promise.all([getPublicBrands(50), getPublicCategoryTree()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-foreground font-serif text-2xl italic">Brands</h1>
      <p className="text-muted-foreground mt-1 text-sm">{data.meta.total} brands</p>

      <BrandFilters
        initialBrandList={data}
        locale={locale}
        categoryOptions={flattenTreeOptions(tree, 0, locale, [])}
      />
    </div>
  );
}
