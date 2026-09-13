'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';

/**
 * Middleware, giriş yapmamış kullanıcıyı `/?auth=login&redirect=…` adresine
 * atar (bkz. proxy.ts). Bu bileşen o parametreyi görünce AuthDialog'u
 * açar; `auth` parametresini URL'den temizler ve `redirect` hedefini
 * ui-store'a kaydeder (LoginForm/RegisterForm başarıda oraya gider).
 *
 * `useSearchParams` yerine window.location/history kullanır — Suspense
 * gerektirmez ve statik render'ı bozmaz.
 */
export function AuthDialogTrigger() {
  const setOpen = useUiStore((s) => s.setAuthDialogOpen);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);
  const setRedirect = useUiStore((s) => s.setAuthRedirect);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('auth');
    if (mode !== 'login' && mode !== 'register') return;

    const redirect = params.get('redirect');
    setRedirect(redirect && redirect.startsWith('/') ? redirect : null);
    openAuthDialog(mode);

    // auth param'ını temizle — refresh'te dialog tekrar açılmasın.
    params.delete('auth');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
