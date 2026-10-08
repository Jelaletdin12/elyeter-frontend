'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAdminLogoutMutation } from '@/features/auth/api/mutations';
import { useAuth } from '../hooks/useAuth';

// ─── Breadcrumb labels (URL segment → title) ──────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
  brands: 'Brands',
  catalog: 'Catalog',
  banners: 'Banners',
  orders: 'Orders',
  coupons: 'Coupons',
  users: 'Users',
  'audit-log': 'Audit log',
  new: 'New',
  edit: 'Edit',
};

type Crumb = { title: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean).slice(1); // "admin"i at
  if (segments.length === 0) return [{ title: 'Overview', href: '/admin' }];

  let href = '/admin';
  return segments.map((seg) => {
    href += `/${seg}`;
    // Bilinmeyen segment = dinamik id (ör. /products/123)
    return { title: SEGMENT_LABELS[seg] ?? 'Details', href };
  });
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useAdminLogoutMutation();

  const crumbs = buildCrumbs(pathname);
  const last = crumbs[crumbs.length - 1] ?? { title: 'Overview', href: '/admin' };
  const initial = (user?.fullName ?? 'A').charAt(0).toUpperCase();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between gap-3 rounded-t-md border-b px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:bg-accent hover:text-foreground -ml-1 transition-colors" />
        <div className="bg-border/60 hidden h-4 w-px sm:block" />

        <Breadcrumb className="text-muted-foreground min-w-0 truncate text-sm">
          <BreadcrumbList>
            {/* Mobil: sadece son sayfa */}
            <BreadcrumbItem className="sm:hidden">
              <BreadcrumbPage className="block max-w-[160px] truncate">{last.title}</BreadcrumbPage>
            </BreadcrumbItem>

            {/* Tablet+: tam breadcrumb */}
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <Fragment key={crumb.href}>
                  {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                  <BreadcrumbItem className="hidden sm:flex">
                    {isLast ? (
                      <BreadcrumbPage className="block max-w-[200px] truncate">
                        {crumb.title}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} className="block max-w-[120px] truncate">
                          {crumb.title}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle variant="ghost" />

        {/* Profile */}
        <div className="border-border/60 ml-1 border-l pl-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hover:bg-accent text-foreground flex cursor-pointer items-center gap-2 rounded-lg p-1 pr-2 pl-1.5 transition-colors outline-none"
              >
                <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {initial}
                </div>
                <span className="text-foreground hidden max-w-32 truncate text-xs font-medium md:block">
                  {user?.fullName ?? 'Admin'}
                </span>
                <ChevronDown size={13} className="text-muted-foreground hidden shrink-0 sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-semibold">
                    {user?.fullName ?? 'Admin'}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={logout.isPending}
                onSelect={() => logout.mutate()}
                className="cursor-pointer text-xs font-medium"
              >
                <LogOut size={14} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
