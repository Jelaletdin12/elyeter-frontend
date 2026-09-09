import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

/**
 * Bu mutation'lar backend'e DEĞİL, kendi route handler'larımıza gider —
 * onlar httpOnly cookie'yi yönetip backend'e proxy yapıyor. Component'ler
 * asla backend'e doğrudan login/register isteği atmaz.
 *
 * 🔴 Müşteri (/api/auth/*) ve admin (/api/admin-auth/*) route'ları AYRI —
 * AYRI cookie kullanıyorlar (refresh_token vs admin_refresh_token). Bu
 * yüzden useLoginMutation/useLogoutMutation SADECE müşteri sitesinde,
 * useAdminLoginMutation/useAdminLogoutMutation SADECE admin panelde
 * kullanılır — birbirinin yerine KULLANILMAZ (aksi halde tam olarak
 * düzelttiğimiz "admin oturumu müşteri tarafına sızıyor" bug'ı geri gelir).
 */

type AuthSuccessResponse = {
  success: true;
  data: {
    accessToken: string;
    user: { id: string; email: string; fullName: string; role: string };
  };
};

type AuthErrorResponse = { success: false; message: string };

async function postAuthRoute(
  path: '/api/auth/login' | '/api/auth/register' | '/api/admin-auth/login',
  body: unknown,
): Promise<AuthSuccessResponse['data']> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as AuthSuccessResponse | AuthErrorResponse;

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}

// --- Müşteri ---

export function useLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      postAuthRoute('/api/auth/login', input),
    onSuccess: (data) => setSession(data.user as AuthUser, data.accessToken),
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: { email: string; password: string; fullName: string }) =>
      postAuthRoute('/api/auth/register', input),
    onSuccess: (data) => setSession(data.user as AuthUser, data.accessToken),
  });
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetch('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

// --- Admin ---

export function useAdminLoginMutation() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      postAuthRoute('/api/admin-auth/login', input),
    onSuccess: (data) => setSession(data.user as AuthUser, data.accessToken),
  });
}

export function useAdminLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetch('/api/admin-auth/logout', { method: 'POST' }),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
