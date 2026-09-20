import { useState } from 'react';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';

/**
 * FRONTEND_AGENTS.md #11: Backend'in "önce yükle, sonra bağla" pattern'ine
 * birebir uyar. Her entity için ayrı upload component'i YAZILMAZ — bu tek
 * hook + tek MediaUploader shared component'i tüm context'lerde kullanılır.
 *
 * ✅ DOĞRULANDI (curl, 2026-09-08) — response context'e göre FARKLI `urls`
 * anahtarları döner:
 *   PRODUCT_IMAGE  → { PRODUCT_CARD, PRODUCT_DETAIL, PRODUCT_ORIGINAL }
 *   BANNER_IMAGE   → { BANNER_DESKTOP, BANNER_MOBILE }
 *   BRAND_IMAGE    → { BRAND_LOGO }
 *   CATEGORY_IMAGE → { CATEGORY_CARD }
 * Önceki varsayım (düz cardUrl/detailUrl alanları) YANLIŞTI, düzeltildi.
 *
 * Akış:
 *   1) Dosya seçilir → POST /media/uploads?context=PRODUCT_IMAGE|BANNER_IMAGE
 *   2) Backend resize edip MinIO'ya yükler, mediaId + context'e özel varyant
 *      URL'lerini döner
 *   3) Form submit edildiğinde bu id, entity body'sinde referans verilir —
 *      ürün için `images: [{ mediaId, isPrimary }]`, banner için tek
 *      `imageId: string`. Frontend boyut/preset bilgisini TEKRAR TANIMLAMAZ.
 *
 * 24 saat içinde hiçbir entity'ye bağlanmazsa backend'in MediaCleanupService'i
 * otomatik temizler — ama kullanıcı formu iptal ederse DELETE /media/uploads/{id}
 * ile hemen silmek daha temiz (bkz. `discard`).
 */

export type MediaContext =
  | 'PRODUCT_IMAGE'
  | 'BANNER_IMAGE'
  | 'BRAND_IMAGE'
  | 'CATEGORY_IMAGE';

type ProductImageUrls = { PRODUCT_CARD: string; PRODUCT_DETAIL: string; PRODUCT_ORIGINAL: string };
type BannerImageUrls = { BANNER_DESKTOP: string; BANNER_MOBILE: string };
type BrandImageUrls = { BRAND_LOGO: string };
type CategoryImageUrls = { CATEGORY_CARD: string };

export type PendingMedia =
  | { id: string; context: 'PRODUCT_IMAGE'; urls: ProductImageUrls }
  | { id: string; context: 'BANNER_IMAGE'; urls: BannerImageUrls }
  | { id: string; context: 'BRAND_IMAGE'; urls: BrandImageUrls }
  | { id: string; context: 'CATEGORY_IMAGE'; urls: CategoryImageUrls };

/** Verilen context için upload'ın döndüreceği asıl görsel URL'si. */
export function mediaPreviewUrl(context: MediaContext, media: PendingMedia): string | null {
  if (media.context !== context) return null;
  switch (media.context) {
    case 'PRODUCT_IMAGE':
      return media.urls.PRODUCT_CARD;
    case 'BANNER_IMAGE':
      return media.urls.BANNER_DESKTOP;
    case 'BRAND_IMAGE':
      return media.urls.BRAND_LOGO;
    case 'CATEGORY_IMAGE':
      return media.urls.CATEGORY_CARD;
  }
}

type UploadState = {
  isUploading: boolean;
  error: string | null;
  pendingMedia: PendingMedia | null;
  pendingMediaList: PendingMedia[];
};

export function useMediaUpload(context: MediaContext) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    error: null,
    pendingMedia: null,
    pendingMediaList: [],
  });

  async function upload(file: File) {
    setState((s) => ({ ...s, isUploading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await adminAuthorizedFetch<PendingMedia>(
        `/media/uploads?context=${context}`,
        { method: 'POST', body: formData, headers: {} }, // Content-Type multipart — tarayıcı otomatik set eder
      );

      setState((s) => ({
        isUploading: false,
        error: null,
        pendingMedia: result,
        pendingMediaList: [...s.pendingMediaList, result],
      }));
      return result;
    } catch (err) {
      setState((s) => ({
        ...s,
        isUploading: false,
        error: err instanceof Error ? err.message : 'errors.upload_failed',
      }));
      throw err;
    }
  }

  /** Kullanıcı formu iptal ederse yüklenen ama hiçbir entity'ye bağlanmayan görseli hemen sil. */
  async function discard(id?: string) {
    const targetId = id || state.pendingMedia?.id;
    if (!targetId) return;
    try {
      await adminAuthorizedFetch<void>(`/media/uploads/${targetId}`, {
        method: 'DELETE',
      });
      setState((s) => ({
        ...s,
        pendingMediaList: s.pendingMediaList.filter((m) => m.id !== targetId),
        pendingMedia: s.pendingMedia?.id === targetId ? null : s.pendingMedia,
      }));
    } catch (err) {
      console.error('Failed to discard media:', err);
    }
  }

  function reset() {
    setState({ isUploading: false, error: null, pendingMedia: null, pendingMediaList: [] });
  }

  return { ...state, upload, discard, reset };
}
