import { useAuthStore } from '@/stores/auth-store';
import { decodeAccessToken } from './jwt';

/**
 * refresh-session.ts'in admin karşılığı — AYNI dedup mantığı (bkz. o
 * dosyadaki yorum), ama /api/admin-auth/refresh'e gider. Bilerek AYRI bir
 * dosya: iki modülün her birinin kendi `inFlightRefresh` değişkeni olmalı,
 * aksi halde admin ve müşteri tarafının refresh çağrıları birbirini
 * bekler/karışır.
 */
let inFlightAdminRefresh: Promise<string | null> | null = null;

async function performAdminRefresh(): Promise<string | null> {
  try {
    const res = await fetch('/api/admin-auth/refresh', { method: 'POST' });
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

export function refreshAdminSession(): Promise<string | null> {
  if (!inFlightAdminRefresh) {
    inFlightAdminRefresh = performAdminRefresh().finally(() => {
      inFlightAdminRefresh = null;
    });
  }
  return inFlightAdminRefresh;
}
