import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import type { CatalogImportResult } from '../types';

/**
 * Catalog import — medya upload'daki desenle aynı: FormData multipart,
 * Content-Type'ı tarayıcı kendi boundary'siyle set eder. Backend max 5 MB,
 * .xlsx/.xls/.csv. Backend CatalogIoController @Roles(SUPER_ADMIN, ADMIN,
 * OPERATOR) — permission sınırı orada; frontend sadece UI'da butonları
 * can('catalog.*') ile gizler.
 */
export async function importCatalogFile(file: File): Promise<CatalogImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return adminAuthorizedFetch<CatalogImportResult>('/catalog/import', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}