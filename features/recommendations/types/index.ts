/**
 * Recommendation engine response tipleri.
 *
 * ⚠️ NOT: `/recommendations/home` ve `/recommendations/products/:id/similar`
 * backend'de @ApiOkResponse ile dokümante edildi (HomeRecommendationsResponseDto,
 * RecommendationProductDto) ama şu an 3000'deki backend örneği bu response
 * DTO'larının eklenmesinden ÖNCE başlatıldığı için `docs-json`'da response
 * şeması yok (openapi-typescript 200 yanıtını boş üretti). Bu yüzden tipler
 * burada backend DTO'suna birebir karşılık gelecek şekilde elle tanımlandı —
 * dosya `generate:types` çıktısı DEĞİL, feature wrapper'ı (StockMovement ile
 * aynı desen). Backend yeniden başlatılıp şema düştüğünde buradaki tip,
 * generated tiple birebir eşleşmeli.
 *
 * Ürün satırları `/products` listesiyle AYNI populate şemasını taşır
 * (`ProductResponseDto` + category/brand/images/variants) + tek fazladan
 * alan `recommendationReason`. Bu yüzden `Product` tipine intersect edilir.
 */
import type { Product } from '@/features/products/types';

export const RECOMMENDATION_REASONS = [
  'behavior',
  'content',
  'collaborative',
  'popularity',
  'freshness',
] as const;

export type RecommendationReason = (typeof RECOMMENDATION_REASONS)[number];

export type RecommendedProduct = Product & { recommendationReason: RecommendationReason };

/** Anaşayfa "kategoriler" bölümündeki kart. */
export type RecommendedCategoryItem = {
  id: string;
  imageUrl: string | null;
  translations: { id: string; locale: string; name: string; slug: string }[];
};

/** Anaşayfa "markalar" bölümündeki kart. */
export type RecommendedBrandItem = {
  id: string;
  logoUrl: string | null;
  translations: { id: string; locale: string; name: string; slug: string }[];
};

export type HomeRecommendations = {
  categories: RecommendedCategoryItem[];
  brands: RecommendedBrandItem[];
  forYou: RecommendedProduct[];
  trending: RecommendedProduct[];
  newArrivals: RecommendedProduct[];
};

/** GET /recommendations/products — sayfalanmış öneri listesi (meta: ürün listesiyle aynı şekil). */
export type RecommendationProductListResponse = {
  items: RecommendedProduct[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};