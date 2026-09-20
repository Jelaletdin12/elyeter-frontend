import { resolveErrorMessage } from '@/lib/errors/error-messages';

export type CatalogDownloadType = 'export' | 'template';
export type CatalogFormat = 'xlsx' | 'csv';

/**
 * İndirme proxy'si: /api/admin/catalog/download (route handler) backend
 * /catalog/{export|template}?format= dosyasını stream eder ve refresh token
 * dönüşünü cookie'ye yazar. apiFetch binary alamadığı için (JSON unwrap)
 * burada raw fetch → blob + download tetikleniyor.
 */
export async function downloadCatalogFile(
  type: CatalogDownloadType,
  format: CatalogFormat,
): Promise<void> {
  const res = await fetch(`/api/admin/catalog/download?type=${type}&format=${format}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'errors.catalog_export_failed';
    try {
      const json: unknown = await res.json();
      if (typeof json === 'object' && json !== null && 'message' in json) {
        message = String((json as { message: unknown }).message);
      }
    } catch {
      // body yok (örn. 500) — varsayılan key ile devam
    }
    throw new Error(message);
  }

  const disposition = res.headers.get('content-disposition') ?? '';
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  const filename = filenameMatch?.[1] ?? `catalog-${type}.${format}`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** hata mesajı i18n key ise okunur dile çevirir. */
export function resolveDownloadError(message: unknown): string {
  return typeof message === 'string' ? resolveErrorMessage(message) : String(message);
}