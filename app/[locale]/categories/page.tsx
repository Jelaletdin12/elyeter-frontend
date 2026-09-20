import type { Metadata } from 'next';
import { getPublicCategories } from '@/features/categories/api/queries';
import { CategoryBrowser } from '@/features/categories/components/CategoryBrowser';

/**
 * KATEGORİ DİZİNİ — GET /categories (public). STANDARDS.md #4: ISR,
 * getPublicCategories revalidate:300, tags:['categories','home'].
 * Arama + liste client bileşeni (CategoryBrowser).
 */
export const metadata: Metadata = {
  title: 'Categories',
};

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getPublicCategories(100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-foreground font-serif text-2xl italic">Categories</h1>
      <p className="text-muted-foreground mt-1 text-sm">{data.meta.total} categories</p>

      <CategoryBrowser initialCategoryList={data} locale={locale} />
    </div>
  );
}
