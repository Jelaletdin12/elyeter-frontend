import type { Product } from '@/features/products/types';

/**
 * POST /products/search-by-image yanıtı.
 * `product` — ProductsService.findManyByIds'in döndürdüğü tam ProductResponseDto
 * şeklidir; ProductCard'ın ihtiyaç duyduğu translations/images/variants(inventory)
 * hepsi backend tarafında populate edilir (wishlist'teki kısmi şeklin aksine).
 * `similarity` 0..1 arası cosine benzerliğidir (Decimal → JSON serialization'da sayı gelir).
 */
export type VisualSearchProduct = Product;

export type VisualSearchResultItem = {
  product: VisualSearchProduct;
  similarity: number;
};

export type VisualSearchResult = {
  items: VisualSearchResultItem[];
  total: number;
};

/** POST /admin/products/visual-search/reindex yanıtı (ReindexResultDto). */
export type VisualSearchReindexFailedImage = {
  id: string;
  error?: string;
};

export type VisualSearchReindexResult = {
  total: number;
  indexed: number;
  skipped: number;
  failed: number;
  failedImages: VisualSearchReindexFailedImage[];
};
