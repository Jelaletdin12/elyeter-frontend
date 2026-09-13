'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Heart, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hesap bölümü sekmeleri: Profil / Favoriler / Siparişler. next-intl locale
 * ile elle prefix ekleriz (projedeki Link deseni) — pathname'e göre aktif
 * vurgusu yapılır. Siparişlerde alt sayfa (/account/orders/:id) da aktif
 * sayılmalıdır; Profil ve Favoriler tam eşleşme ister.
 */
const NAV_ITEMS = [
  { href: 'account', label: 'Profil', icon: User, exact: true },
  { href: 'account/wishlist', label: 'Favoriler', icon: Heart, exact: true },
  { href: 'account/orders', label: 'Siparişler', icon: Package, exact: false },
] as const;

export function AccountNav() {
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <nav aria-label="Hesap" className="flex flex-wrap gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
