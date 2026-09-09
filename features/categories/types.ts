/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-07):
 * POST/GET /categories, GET /categories/slug/{locale}/{slug}, GET/PATCH/DELETE
 * /categories/{id}. Ürünlerle AYNI translations-array + sayfalanmış liste
 * pattern'i.
 */

export type CategoryLocale = 'en' | 'ru' | 'tk';

export type CategoryTranslation = {
  id: string;
  categoryId: string;
  locale: CategoryLocale;
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
};

export type Category = {
  id: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
};

export type CategoryListResponse = {
  items: Category[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/**
 * slug/metaTitle/metaDescription boş bırakılırsa backend name'den otomatik
 * üretiyor (CategoryTranslationDto description'ı) — bu yüzden create/update
 * formunda sadece locale+name zorunlu tutuluyor.
 */
export type CategoryTranslationInput = {
  locale: CategoryLocale;
  name: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CreateCategoryInput = {
  isActive?: boolean;
  translations: CategoryTranslationInput[];
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export function categoryTranslation(
  category: Category,
  locale: string,
): CategoryTranslation | undefined {
  return category.translations.find((t) => t.locale === locale) ?? category.translations[0];
}
