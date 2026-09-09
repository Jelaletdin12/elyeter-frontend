import { create } from 'zustand';

/**
 * DİKKAT — FRONTEND_STANDARDS.md #3 ve #8:
 * Bu store server state'in KAYNAĞI değildir, login/refresh response'undan
 * yazılan bir client yansımasıdır. `user` bilgisi asla burada elle
 * düzenlenmez; her zaman backend response'undan set edilir.
 *
 * accessToken KESİNLİKLE persist edilmez (localStorage/sessionStorage yok —
 * XSS riski, bkz. FRONTEND_AGENTS.md #10). Sayfa yenilendiğinde bu store
 * sıfırlanır; app/api/auth/refresh/route.ts httpOnly cookie'yi okuyup yeni
 * bir access token alır ve setAccessToken ile buraya yazılır (silent refresh).
 *
 * activeStoreId: B2B geçişi için bugünden bırakılan seam (bkz.
 * FRONTEND_STANDARDS.md #9) — backend tek mağaza döndürse bile buradadır.
 */

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'CLIENT';
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  activeStoreId: string;
  isAuthenticated: boolean;
  isHydrating: boolean;

  setSession: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setHydrating: (isHydrating: boolean) => void;
  clearSession: () => void;
};

// Backend şu an tek mağaza döndürüyor; ileride multi-store olduğunda
// bu default değer login/me response'undan gelen gerçek storeId ile değişir.
const DEFAULT_STORE_ID = 'default';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  activeStoreId: DEFAULT_STORE_ID,
  isAuthenticated: false,
  // App açılışında silent-refresh route'u dönene kadar true — bu sırada
  // guard/UI "yükleniyor" göstermeli, erken "giriş yapılmamış" varsaymamalı.
  isHydrating: true,

  setSession: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true, isHydrating: false }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setHydrating: (isHydrating) => set({ isHydrating }),

  clearSession: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false }),
}));
