import { useAuthStore } from '@/stores/auth-store';

/**
 * FRONTEND_AGENTS.md #9: Rol bazlı UI gösterimi sayfa sayfa
 * `if (user.role === ...)` ile YAZILMAZ. Backend'deki ROLE_MANAGEMENT_MAP
 * ile birebir eşleşen bu tek dosya üzerinden yapılır — yeni bir rol
 * eklendiğinde (örn. STORE_OWNER, bkz. STANDARDS.md #9) sadece burası değişir.
 *
 * ÖNEMLİ: Bu, sadece UX'tir (buton gösterilsin/gizlensin). Gerçek yetki
 * kontrolü her zaman backend'deki @Roles()/RolesGuard'dadır — bu dosyadaki
 * matris backend'deki ROLE_MANAGEMENT_MAP ile senkron tutulmalıdır, aksi
 * halde frontend kullanıcıya olmayan bir yetkiyi varmış gibi gösterebilir
 * (kritik değil, çünkü backend zaten reddeder — ama kötü UX'tir).
 */

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'CLIENT';

export type Action =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'brand.create'
  | 'brand.update'
  | 'brand.delete'
  | 'banner.manage'
  | 'coupon.manage'
  | 'order.updateStatus'
  | 'order.viewAll'
  | 'user.manage'
  | 'user.create'
  | 'visualSearch.reindex'
  | 'admin.access'
  | 'catalog.export'
  | 'catalog.import';

// Backend'deki ROLE_MANAGEMENT_MAP'in frontend yansıması.
const ROLE_ACTION_MAP: Record<Role, Action[]> = {
  SUPER_ADMIN: [
    'product.create',
    'product.update',
    'product.delete',
    'category.create',
    'category.update',
    'category.delete',
    'brand.create',
    'brand.update',
    'brand.delete',
    'banner.manage',
    'coupon.manage',
    'order.updateStatus',
    'order.viewAll',
    'user.manage',
    'user.create',
    'visualSearch.reindex',
    'admin.access',
    'catalog.export',
    'catalog.import',
  ],
  ADMIN: [
    'product.create',
    'product.update',
    'product.delete',
    'category.create',
    'category.update',
    'category.delete',
    'brand.create',
    'brand.update',
    'brand.delete',
    'banner.manage',
    'coupon.manage',
    'order.updateStatus',
    'order.viewAll',
    'visualSearch.reindex',
    'admin.access',
    'catalog.export',
    'catalog.import',
  ],
  OPERATOR: [
    'product.update',
    'brand.create',
    'brand.update',
    'brand.delete',
    'order.updateStatus',
    'order.viewAll',
    'admin.access',
    'catalog.export',
    'catalog.import',
  ],
  CLIENT: [],
};

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  function can(action: Action): boolean {
    if (!user) return false;
    return ROLE_ACTION_MAP[user.role].includes(action);
  }

  return { user, isAuthenticated, isHydrating, can };
}
