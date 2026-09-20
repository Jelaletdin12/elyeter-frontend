import { resolveErrorMessage } from '@/lib/errors/error-messages';

/** POST /catalog/import yanıtı — created/updated + satır bazlı hata listesi. */
export type CatalogImportResult = {
  applied: boolean;
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
};

/** POST /media/cleanup yanıtı — bucket başına orphan raporu. */
export type MediaCleanupBucketResult = {
  context: 'PRODUCT_IMAGE' | 'BANNER_IMAGE' | 'BRAND_IMAGE' | 'CATEGORY_IMAGE';
  bucket: string;
  totalObjects: number;
  referenced: number;
  orphaned: number;
  deleted: number;
};

export type MediaCleanupResult = {
  dryRun: boolean;
  totalOrphaned: number;
  totalDeleted: number;
  buckets: MediaCleanupBucketResult[];
};

export const MEDIA_CONTEXT_LABELS: Record<MediaCleanupBucketResult['context'], string> = {
  PRODUCT_IMAGE: 'Product images',
  BANNER_IMAGE: 'Banner images',
  BRAND_IMAGE: 'Brand logos',
  CATEGORY_IMAGE: 'Category images',
};

/**
 * Backend hata mesajları i18n key olarak gelir (örn.
 * "errors.catalog_import_invalid_row") — resolveErrorMessage ile okunur
 * dile çevirir; bilinmeyen key için insanlarıza fallback yapar.
 */
export function resolveCatalogMessage(message: string): string {
  return resolveErrorMessage(message);
}