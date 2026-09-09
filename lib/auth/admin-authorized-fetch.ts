import { apiFetch, ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { refreshAdminSession } from './refresh-admin-session';

/**
 * authorized-fetch.ts'in admin karşılığı. TEK fark: 401 sonrası
 * refreshAdminSession() çağırır (→ /api/admin-auth/refresh →
 * admin_refresh_token cookie'si) — müşteri tarafının refresh_token
 * cookie'sine hiç dokunmaz. Bkz. app/api/admin-auth/login/route.ts'teki not:
 * bu ayrım olmadan admin girişi müşteri sitesindeki oturumu da değiştirirdi.
 *
 * Admin panelindeki TÜM authenticated istekler (ürün/kategori/banner/sipariş/
 * kullanıcı yönetimi) bunu kullanır — features/products/api/mutations.ts,
 * app/admin/*, features/users/api/*.
 */
export async function adminAuthorizedFetch<T>(
  path: string,
  options: Parameters<typeof apiFetch<T>>[1] = {},
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  try {
    return await apiFetch<T>(path, { ...options, cache: 'no-store', accessToken: accessToken ?? undefined });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      const newToken = await refreshAdminSession();

      if (newToken) {
        return apiFetch<T>(path, { ...options, cache: 'no-store', accessToken: newToken });
      }
    }
    throw error;
  }
}
