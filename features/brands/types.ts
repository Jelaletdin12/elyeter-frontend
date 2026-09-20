/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-16):
 * GET/POST /brands, GET/PATCH/DELETE /brands/{id}, GET /brands/slug/{locale}/{slug}.
 * Brand, Category ile aynı çevrilebilir (translatable) yapıya sahiptir;
 * hiyerarşisi YOKTUR (parent yok), görseli `logoUrl` serbest URL string'idir.
 */
import type { components } from '@/types/generated/api';

export type BrandLocale = 'en' | 'ru' | 'tk';

export type BrandTranslation = {
  id: string;
  brandId: string;
  locale: BrandLocale;
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
};

export type Brand = {
  id: string;
  isActive: boolean;
  logoUrl?: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  translations: BrandTranslation[];
  /** findAll/findOne yanıtında ürün sayısı — silme engel kontrolü + istatistik. */
  _count?: { products: number };
};

export type BrandListResponse = {
  items: Brand[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/**
 * slug/metaTitle/metaDescription boş bırakılırsa backend name'den otomatik
 * üretiyor (BrandTranslationDto) — create/update formunda sadece locale+name
 * zorunlu tutulur (Category ile AYNI pattern).
 */
export type BrandTranslationInput = {
  locale: BrandLocale;
  name: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
};

export type CreateBrandInput = {
  isActive?: boolean;
  logoUrl?: string | null;
  /** POST /media/uploads?context=BRAND_IMAGE'den alınan media id — MinIO'ya yüklenen logo. */
  logoMediaId?: string;
  translations: BrandTranslationInput[];
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

/**
 * brandTranslation sadece `translations`'taki { locale, name, slug } alanlarını
 * kullandığı için structural bir alt-küme kabul eder — böylece tam `Brand`
 * (BrandTranslation[]: id/brandId/metaTitle/metaDescription dahil) de,
 * ProductListResponse'taki populate edilmiş `BrandBrief` (sadece
 * { locale, name, slug } içeren BrandBriefTranslationDto[]) de geçebilir.
 */
type BrandLikeTranslation = { locale: BrandLocale; name: string; slug: string };
type BrandLike = { translations: BrandLikeTranslation[] };

export function brandTranslation(brand: BrandLike, locale: string): BrandTranslation | undefined {
  // product.brand yalnızca kısmi embed gelebilir (translations boş/eksik) —
  // çökme yerine undefined döner (bkz. /en brandTranslation 500, 2026-09-17).
  const found = brand.translations?.find((t) => t.locale === locale) ?? brand.translations?.[0];
  return found ? (found as BrandTranslation) : undefined;
}

/** Swagger'da brand response şeması dokümante değil — ürün response'undaki populate edilmiş marka. */
export type BrandBrief = NonNullable<components['schemas']['ProductResponseDto']['brand']>;
