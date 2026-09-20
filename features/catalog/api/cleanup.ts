import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import type { MediaCleanupResult } from '../types';

/**
 * MinIO orphan görsel taraması/silmesi — backend POST /media/cleanup.
 * `dryRun=true` (varsayılan) sadece raporlar, `false` fiziksel olarak siler.
 * Rol: SUPER_ADMIN / ADMIN / OPERATOR (backend @Roles) — UI'da aynı yetkiyle
 * (catalog.import) render edilir.
 */
export async function cleanupOrphanedMedia(dryRun = true): Promise<MediaCleanupResult> {
  return adminAuthorizedFetch<MediaCleanupResult>(`/media/cleanup?dryRun=${dryRun}`, {
    method: 'POST',
    headers: {},
  });
}