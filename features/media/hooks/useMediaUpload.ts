import { useState } from 'react';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';

/**
 * FRONTEND_AGENTS.md #11: Backend'in "önce yükle, sonra bağla" pattern'ine
 * birebir uyar. Her entity için ayrı upload component'i YAZILMAZ — bu tek
 * hook + tek MediaUploader shared component'i tüm context'lerde kullanılır.
 *
 * ✅ DOĞRULANDI (curl, 2026-09-08) — response context'e göre FARKLI `urls`
 * anahtarları döner:
 *   PRODUCT_IMAGE → { PRODUCT_CARD, PRODUCT_DETAIL, PRODUCT_ORIGINAL }
 *   BANNER_IMAGE  → { BANNER_DESKTOP, BANNER_MOBILE }
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

export type MediaContext = 'PRODUCT_IMAGE' | 'BANNER_IMAGE';

type ProductImageUrls = { PRODUCT_CARD: string; PRODUCT_DETAIL: string; PRODUCT_ORIGINAL: string };
type BannerImageUrls = { BANNER_DESKTOP: string; BANNER_MOBILE: string };

export type PendingMedia =
  | { id: string; context: 'PRODUCT_IMAGE'; urls: ProductImageUrls }
  | { id: string; context: 'BANNER_IMAGE'; urls: BannerImageUrls };

type UploadState = {
  isUploading: boolean;
  error: string | null;
  pendingMedia: PendingMedia | null;
};

export function useMediaUpload(context: MediaContext) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    error: null,
    pendingMedia: null,
  });

  async function upload(file: File) {
    setState({ isUploading: true, error: null, pendingMedia: null });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await adminAuthorizedFetch<PendingMedia>(
        `/media/uploads?context=${context}`,
        { method: 'POST', body: formData, headers: {} }, // Content-Type multipart — tarayıcı otomatik set eder
      );

      setState({ isUploading: false, error: null, pendingMedia: result });
      return result;
    } catch (err) {
      setState({
        isUploading: false,
        error: err instanceof Error ? err.message : 'errors.upload_failed',
        pendingMedia: null,
      });
      throw err;
    }
  }

  /** Kullanıcı formu iptal ederse yüklenen ama hiçbir entity'ye bağlanmayan görseli hemen sil. */
  async function discard() {
    if (!state.pendingMedia) return;
    try {
      await adminAuthorizedFetch<void>(`/media/uploads/${state.pendingMedia.id}`, {
        method: 'DELETE',
      });
    } finally {
      reset();
    }
  }

  function reset() {
    setState({ isUploading: false, error: null, pendingMedia: null });
  }

  return { ...state, upload, discard, reset };
}
