'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tag, Image as ImageIcon, ShoppingCart, Users, LogOut } from 'lucide-react';
import { useAdminLogoutMutation } from '@/features/auth/api/mutations';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import type { Action } from '../hooks/useAuth';

const NAV_ITEMS: { href: string; label: string; icon: typeof Package; requires?: Action }[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users, requires: 'user.manage' },
];

function isNavItemActive(pathname: string, href: string): boolean {
  // "/admin" tam eşleşmeli, yoksa her alt sayfada da (startsWith yüzünden)
  // aktif görünür. Diğer nav item'lar için startsWith doğru (nested route'lar
  // — örn. /admin/products/123 hâlâ "Products"u aktif göstermeli).
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const logout = useAdminLogoutMutation();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between p-4">
        <Link href="/admin" className="font-display text-lg italic text-ink">
          Bazaar admin
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !item.requires || can(item.requires)).map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? 'flex items-center gap-2 rounded-card bg-teal px-3 py-2 text-sm font-medium text-white transition-colors'
                  : 'flex items-center gap-2 rounded-card px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-paper hover:text-ink'
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-line p-4 text-sm">
        <div className="truncate">
          <p className="truncate font-medium text-ink">{user?.fullName}</p>
          <p className="truncate text-xs text-ink-muted">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          aria-label="Sign out"
          className="shrink-0 text-ink-muted transition-colors hover:text-ink"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
