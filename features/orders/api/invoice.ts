import { API_PREFIX } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { refreshAdminSession } from '@/lib/auth/refresh-admin-session';

/**
 * GET /orders/{id}/invoice.pdf — BINARY yanıt (StreamableFile,
 * TransformInterceptor tarafından unwrap edilmez). apiFetch JSON unwrap
 * yaptığı için burada kullanılamaz — token'ı adminAuthorizedFetch ile aynı
 * şekilde (accessToken → Bearer, 401'de refreshAdminSession) koyan, blob'u
 * tarayıcıda kaydeden özel bir helper.
 *
 * ⚠️ Gerçek PDF response'u curl ile doğrulanmadı (StreamableFile + filename
 * disposition altında binary dönmesi beklenir) — ilk manuel testte kontrol edilmeli.
 */
export async function downloadOrderInvoice(orderId: string): Promise<void> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    token = await refreshAdminSession();
  }
  if (!token) {
    throw new Error('Not authenticated');
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const res = await fetch(`${baseUrl}${API_PREFIX}/orders/${orderId}/invoice.pdf`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Invoice download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `invoice-${orderId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
