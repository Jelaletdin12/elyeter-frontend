import { apiFetch, ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { refreshCustomerSession } from './refresh-session';

/**
 * FRONTEND_STANDARDS.md #8, madde 3: 401 alınca BİR KERE refresh dener,
 * başarılıysa orijinal isteği tekrar eder, başarısızsa logout tetiklenir.
 *
 * Gerçek refresh çağrısı burada DEĞİL, refreshCustomerSession()'da —
 * o fonksiyon eşzamanlı çağrıları tek bir in-flight promise'te birleştirir
 * (bkz. lib/auth/refresh-session.ts). Burada elle fetch('/api/auth/refresh')
 * YAZILMAZ, aksi halde aynı anda 401 alan birden fazla istek birbirinden
 * habersiz paralel refresh çağrısı yapar ve refresh token rotation'ı
 * yarış durumuna (race condition) sokar.
 *
 * Bu sadece Client Component / TanStack queryFn tarafında kullanılır —
 * MÜŞTERİ tarafı için. Admin tarafı lib/auth/admin-authorized-fetch.ts kullanır
 * (ayrı cookie/oturum, bkz. o dosyadaki not).
 */
export async function authorizedFetch<T>(
  path: string,
  options: Parameters<typeof apiFetch<T>>[1] = {},
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  try {
    return await apiFetch<T>(path, { ...options, cache: 'no-store', accessToken: accessToken ?? undefined });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      const newToken = await refreshCustomerSession();

      if (newToken) {
        return apiFetch<T>(path, { ...options, cache: 'no-store', accessToken: newToken });
      }
    }
    throw error;
  }
}
