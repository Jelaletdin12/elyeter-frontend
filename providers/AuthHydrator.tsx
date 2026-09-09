'use client';

import { useEffect } from 'react';
import { refreshCustomerSession } from '@/lib/auth/refresh-session';
import { useAuthStore } from '@/stores/auth-store';

/**
 * MÜŞTERİ tarafı için. Uygulama açılışında BİR KERE session restore dener —
 * gerçek işi refreshCustomerSession() yapıyor (dedup'lı, bkz. o dosya).
 *
 * setHydrating(true) BİLEREK burada, effect'in en başında: admin ve müşteri
 * hydrator'ları AYNI global Zustand store'u (tek useAuthStore instance)
 * paylaşıyor. Biri /admin'den müşteri sitesine client-side navigate ederse,
 * önceki bölümün hydrator'ından kalma "isHydrating:false" state'i burası
 * kendi refresh'ini bitirmeden guard'ların erken/yanlış karar vermesine yol
 * açar — bu satır o yarış durumunu önlüyor.
 */
export function AuthHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().setHydrating(true);
    refreshCustomerSession();
  }, []);

  return <>{children}</>;
}
