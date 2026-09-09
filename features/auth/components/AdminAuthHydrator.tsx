'use client';

import { useEffect } from 'react';
import { refreshAdminSession } from '@/lib/auth/refresh-admin-session';
import { useAuthStore } from '@/stores/auth-store';

/**
 * AuthHydrator'ın (providers/AuthHydrator.tsx) admin karşılığı — AYRI cookie
 * (admin_refresh_token) ile çalışır. Bilerek admin'e özel: bu component
 * SADECE app/admin/layout.tsx altında mount edilir, müşteri sayfalarında
 * hiç çalışmaz — bu sayede admin oturumu müşteri tarafını asla etkilemez.
 *
 * setHydrating(true) için bkz. AuthHydrator.tsx'teki aynı yorum — iki
 * hydrator aynı store'u paylaştığı için yarış durumunu önlemek şart.
 */
export function AdminAuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().setHydrating(true);
    refreshAdminSession();
  }, []);

  return <>{children}</>;
}
