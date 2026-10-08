'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, Heart, Loader2, LogOut, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { useLogoutMutation } from '@/features/auth/api/mutations';

/**
 * Hesap bölümü sekmeleri: Profil / Favoriler / Siparişler + sağda "Çıkış yap".
 * next-intl locale ile elle prefix ekleriz (projedeki Link deseni) — pathname'e
 * göre aktif vurgusu yapılır. Siparişlerde alt sayfa (/account/orders/:id) da aktive
 * sayılmalıdır; Profil ve Favoriler tam eşleşme ister.
 */
const NAV_ITEMS = [
  { href: 'account', labelKey: 'profile', icon: User, exact: true },
  { href: 'account/wishlist', labelKey: 'wishlist', icon: Heart, exact: true },
  { href: 'account/notifications', labelKey: 'notifications', icon: Bell, exact: false },
  { href: 'account/orders', labelKey: 'orders', icon: Package, exact: false },
] as const;

export function AccountNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogoutMutation();
  const t = useTranslations('account');
  const tCommon = useTranslations('common');

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      router.push('/');
    } catch {
      toast.error(tCommon('logoutFailed'));
    }
  }

  return (
    <nav aria-label={t('navLabel')} className="flex flex-wrap items-center gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon, exact }) => {
        const fullHref = `/${locale}/${href}`;
        const active = isActive(fullHref, exact);
        return (
          <Link
            key={fullHref}
            href={fullHref}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon size={14} />
            {t(labelKey)}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {logout.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
        {tCommon('logout')}
      </button>
    </nav>
  );
}
