'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  Award,
  Image as ImageIcon,
  ShoppingCart,
  Users,
  TicketPercent,
  ScrollText,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { useAdminLogoutMutation } from '@/features/auth/api/mutations';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import type { Action } from '../hooks/useAuth';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof Package;
  requires?: Action;
  requiresRole?: 'SUPER_ADMIN';
}[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/brands', label: 'Brands', icon: Award },
  {
    href: '/admin/catalog',
    label: 'Catalog',
    icon: FileSpreadsheet,
    requires: 'catalog.export',
  },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { href: '/admin/users', label: 'Users', icon: Users, requires: 'user.manage' },
  // Audit log backend'de SADECE SUPER_ADMIN (@Roles) — role bazlı gizleme,
  // action değil (bkz. features/auth/hooks/useAuth.ts NOT: UX, güvenlik backend'de).
  { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText, requiresRole: 'SUPER_ADMIN' },
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
    <aside className="border-border bg-card sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-4">
        <Link href="/admin" className="group flex items-center gap-2.5">
          <span className="bg-sidebar-primary flex h-9 w-9 items-center justify-center rounded-lg font-serif text-lg text-white italic shadow-sm transition-transform group-hover:scale-105">
            B
          </span>
          <span className="text-foreground font-serif text-lg leading-none italic">
            Bazaar
            <span className="text-sidebar-primary block text-xs tracking-widest uppercase">
              Admin
            </span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 scrollbar-thin space-y-0.5 overflow-y-auto overscroll-contain px-3 py-2">
        {NAV_ITEMS.filter(
          (item) =>
            (!item.requires || can(item.requires)) &&
            (!item.requiresRole || user?.role === item.requiresRole),
        ).map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? 'bg-sidebar-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors'
                  : 'text-muted-foreground hover:bg-sidebar-primary/5 hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors'
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-border flex items-center gap-3 border-t p-4">
        <div className="bg-sidebar-primary/10 text-sidebar-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
          {user?.fullName?.charAt(0) ?? 'A'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{user?.fullName}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          aria-label="Sign out"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-lg p-2 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
