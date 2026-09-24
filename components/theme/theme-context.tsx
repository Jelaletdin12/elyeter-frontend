'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useAuthStore } from '@/stores/auth-store';

/**
 * KULLANICILARA ÖZEL tema — next-themes'in yerini alır.
 *
 * next-themes tek bir localStorage key'i (`theme`) kullandığından, admin panel
 * ile mağaza aynı origin'de (port 3001) yaşadığı için temalar birbirine
 * sızıyordu: client login → "Giriş yap" temasını değiştiriyor → admin de
 * değişiyor (ve tersi). Bu sağlayıcı tema yüklemesini KAPSAM'a (scope) bağlar:
 *
 *   localStorage key = `ma:theme:<area>:<userId|guest>`
 *     area    → `/admin/*` altında "admin", değilse "storefront"
 *     userId  → oturumlu kullanıcı id'si (her kullanıcı kendi temasını görür)
 *               oturum yoksa "guest"
 *
 * Aynı tarayıcıda her alan (storefront/admin) ve her kullanıcı kendi temasını
 * korur; login/logout ve route geçişlerinde provider yeniden MOUNT edilmez
 * (key remount tüm app'i remount ederdi) — sadece karşılık gelen key yeniden
 * okunur ve <html> class'ı güncellenir.
 *
 * SSR: pathname/user server'da bilinmediğinden ilk render sabit ("system")
 * kalır, gerçek key hydration sonrası effect'te okunur. Flash'ı önlemek için
 * provider, kullanıcının son görülen scope'unu `ma:theme:active-scope`'ta
 * tutar ve <head> öncesi inline script bu key'i okuyup tema class'ını daha
 * React hydration olmadan uygular (next-themes'in anti-flash script'i gibi).
 */

type ThemeName = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const THEME_KEY_PREFIX = 'ma:theme';
const THEME_ACTIVE_SCOPE_KEY = 'ma:theme:active-scope';

type ThemeContextValue = {
  theme: ThemeName;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

function systemPref(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveScope(pathname: string | null, userId: string | null): string {
  const area = pathname?.startsWith('/admin') ? 'admin' : 'storefront';
  return `${area}:${userId ?? 'guest'}`;
}

// next-themes'in SSR script uyarısındaki false-positive'i React 19'da filtreleriz.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag while rendering React component')
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

const ANTI_FLASH_SCRIPT = `(function(){try{
  var active=localStorage.getItem('${THEME_ACTIVE_SCOPE_KEY}');
  if(!active)return;
  var v=localStorage.getItem('${THEME_KEY_PREFIX}:'+active)||'system';
  var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  var r=v==='system'?(dark?'dark':'light'):v;
  var d=document.documentElement;
  d.classList.remove('light','dark');
  d.classList.add(r);
}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userId = useAuthStore((state) => state.user?.id ?? null);

  // SSR (pathname/user bilinmez) ile hydration ilk renderı aynı kalsın diye gerçek
  // scope yalnızca mount sonrası çözülür.
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => setClientReady(true), []);

  const storageKey = useMemo(
    () =>
      clientReady
        ? `${THEME_KEY_PREFIX}:${resolveScope(pathname, userId)}`
        : null,
    [clientReady, pathname, userId],
  );

  const [theme, setThemeState] = useState<ThemeName>('system');
  const [pref, setPref] = useState<ResolvedTheme>('light');

  // Scope değişince o scope'un kayıtlı temasını oku (ve active-scope işaretini tazele).
  useEffect(() => {
    if (!storageKey) return;
    let saved: ThemeName = 'system';
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === 'light' || raw === 'dark' || raw === 'system') saved = raw;
      window.localStorage.setItem(THEME_ACTIVE_SCOPE_KEY, storageKey);
    } catch {
      // localStorage kapalıysa tema hafızada yaşar — app yine çalışır.
    }
    setThemeState(saved);
  }, [storageKey]);

  // `system` iken OS tema değişikliğini takip et.
  useEffect(() => {
    if (!clientReady || theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setPref(mq.matches ? 'dark' : 'light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [clientReady, theme]);

  // Seçilen temayı <html> üzerine uygula.
  const resolvedTheme = theme === 'system' ? pref : theme;
  useEffect(() => {
    if (!clientReady) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [clientReady, resolvedTheme]);

  const setTheme = useCallback(
    (next: ThemeName) => {
      setThemeState(next);
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // yukarıdaki ile aynı — storage yoksa sessizce devam.
        }
      }
    },
    [storageKey],
  );

  // Aynı scope'u açan başka sekme tema değiştirdiğinde senkronize ol.
  useEffect(() => {
    const onChange = (event: StorageEvent) => {
      if (
        event.key === storageKey &&
        (event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system')
      ) {
        setThemeState(event.newValue);
      }
    };
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, [storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}