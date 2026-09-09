import { useAuthStore } from '@/stores/auth-store';
import { decodeAccessToken } from './jwt';

/**
 * 🔴 KRİTİK BUG DÜZELTMESİ: Birden fazla istek aynı anda 401 alırsa (örn.
 * sayfa açılışında sepet + wishlist + sipariş sayısı paralel çekiliyorsa),
 * her biri BAĞIMSIZ bir /api/auth/refresh çağrısı yapıyordu. Backend refresh
 * token'ı her kullanımda rotate ettiği için ilk çağrı eskisini geçersiz
 * kılıyor, aynı anda giden ikinci/üçüncü çağrı "invalid refresh token" ile
 * başarısız oluyordu — bu da rastgele/açıklanamaz logout'lara yol açıyordu.
 *
 * Çözüm: modül seviyesinde TEK bir in-flight promise. Kim önce çağırırsa
 * gerçek isteği o yapar, aynı anda çağıran herkes AYNI promise'i bekler —
 * backend'e sadece BİR istek gider.
 */
let inFlightRefresh: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const json: unknown = await res.json();

    const success =
      typeof json === 'object' && json !== null && (json as { success?: unknown }).success === true;

    if (!success) {
      useAuthStore.getState().clearSession();
      return null;
    }

    const accessToken = (json as { data: { accessToken: string } }).data.accessToken;
    const payload = decodeAccessToken(accessToken);

    if (!payload) {
      useAuthStore.getState().clearSession();
      return null;
    }

    // fullName JWT'de yok — bkz. AuthHydrator'daki asıl not. Zaten bir
    // session varsa (setSession ile fullName biliniyorsa) onu koru, yoksa
    // email'in @ öncesini kullan.
    const existingUser = useAuthStore.getState().user;
    const fullName =
      existingUser && existingUser.id === payload.sub
        ? existingUser.fullName
        : (payload.email.split('@')[0] ?? payload.email);

    useAuthStore.getState().setSession(
      { id: payload.sub, email: payload.email, fullName, role: payload.role },
      accessToken,
    );

    return accessToken;
  } catch {
    useAuthStore.getState().clearSession();
    return null;
  }
}

/**
 * Müşteri (customer) tarafı için TEK giriş noktası. AuthHydrator (ilk
 * bootstrap) ve authorized-fetch (401 sonrası reaktif refresh) AYNI bu
 * fonksiyonu çağırır — ikisi aynı anda tetiklense bile backend'e tek istek gider.
 */
export function refreshCustomerSession(): Promise<string | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}
