'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  ChevronRight,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  ScrollText,
  ShoppingCart,
  Tag,
  TicketPercent,
  Users,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '../hooks/useAuth';
import type { Action } from '../hooks/useAuth';
import logo from 'public/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type Access = { requires?: Action; requiresRole?: 'SUPER_ADMIN' };
type NavLeaf = Access & { title: string; href: string };
type NavItem = Access & {
  title: string;
  icon: LucideIcon;
  href?: string; // leaf item
  items?: NavLeaf[]; // collapsible item
};
type NavGroup = { label?: string; items: NavItem[] };

// ─── Navigation config ────────────────────────────────────────────────────────
// NOT: UX amaçlı gizleme. Güvenlik backend'de (@Roles / guard).

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ title: 'Overview', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Store',
    items: [
      {
        title: 'Catalog',
        icon: Package,
        items: [
          { title: 'Products', href: '/admin/products' },
          { title: 'Categories', href: '/admin/categories' },
          { title: 'Brands', href: '/admin/brands' },
          { title: 'Catalog export', href: '/admin/catalog', requires: 'catalog.export' },
        ],
      },
      {
        title: 'Sales',
        icon: ShoppingCart,
        items: [
          { title: 'Orders', href: '/admin/orders' },
          { title: 'Coupons', href: '/admin/coupons' },
        ],
      },
      { title: 'Banners', href: '/admin/banners', icon: ImageIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users, requires: 'user.manage' },
      {
        title: 'Audit log',
        href: '/admin/audit-log',
        icon: ScrollText,
        requiresRole: 'SUPER_ADMIN',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActiveHref(pathname: string, href: string): boolean {
  // "/admin" tam eşleşmeli; yoksa her alt sayfada aktif görünür.
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href) return isActiveHref(pathname, item.href);
  return item.items?.some((s) => isActiveHref(pathname, s.href)) ?? false;
}

// ─── Collapsible item (2nd level) ─────────────────────────────────────────────

function NavCollapsibleItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const active = isItemActive(item, pathname);
  const [open, setOpen] = useState(active);

  // Rota değişince / sidebar açılınca aktif grubu otomatik aç (effect'siz).
  const [prevActive, setPrevActive] = useState(active);
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  if (active !== prevActive || collapsed !== prevCollapsed) {
    setPrevActive(active);
    setPrevCollapsed(collapsed);
    if (active && !collapsed) setOpen(true);
  }

  return (
    <Collapsible open={!collapsed && open} onOpenChange={(v) => !collapsed && setOpen(v)}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={active}
            tooltip={item.title}
            className={cn(
              'group/btn cursor-pointer rounded-md font-medium',
              'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
              'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground',
            )}
          >
            <item.icon className={cn('shrink-0', active && 'text-sidebar-primary')} />
            <span>{item.title}</span>
            <ChevronRight
              size={14}
              className={cn(
                'text-sidebar-foreground/40 ml-auto shrink-0 transition-transform duration-200',
                'group-data-[collapsible=icon]:hidden',
                open && !collapsed && 'rotate-90',
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </SidebarMenuItem>

      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <SidebarMenuSub className="border-sidebar-border/40 mt-0.5 ml-3 gap-0 border-l-2 pl-2">
          {item.items?.map((sub) => (
            <SidebarMenuSubItem key={sub.href}>
              <SidebarMenuSubButton
                asChild
                isActive={isActiveHref(pathname, sub.href)}
                className={cn(
                  'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground rounded-md',
                  'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium',
                )}
              >
                <Link href={sub.href}>
                  <span>{sub.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Group label ──────────────────────────────────────────────────────────────

function NavGroupLabel({ label }: { label: string }) {
  const { state } = useSidebar();
  if (state === 'collapsed') {
    return <div className="bg-sidebar-border/50 my-1 h-px" />;
  }
  return (
    <div className="px-2 pt-3 pb-1">
      <p className="text-sidebar-foreground/35 text-[10px] font-semibold tracking-widest uppercase select-none">
        {label}
      </p>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, can } = useAuth();

  const groups = useMemo(() => {
    const allowed = (a: Access) =>
      (!a.requires || can(a.requires)) && (!a.requiresRole || user?.role === a.requiresRole);

    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.flatMap<NavItem>((item) => {
        if (!allowed(item)) return [];
        if (!item.items) return [item];
        const subs = item.items.filter(allowed);
        return subs.length > 0 ? [{ ...item, items: subs }] : [];
      }),
    })).filter((group) => group.items.length > 0);
  }, [user, can]);

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="h-14 flex-row items-center gap-2.5 overflow-hidden px-3">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image src={logo} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sidebar-foreground truncate text-sm font-semibold tracking-tight">
              Elyeter
            </span>
            <span className="text-sidebar-foreground/40 truncate text-[10px]">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-2">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi}>
            {group.label && <NavGroupLabel label={group.label} />}
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                if (item.items) {
                  return <NavCollapsibleItem key={item.title} item={item} pathname={pathname} />;
                }
                const active = isActiveHref(pathname, item.href!);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        'rounded-md font-medium',
                        'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground',
                      )}
                    >
                      <Link href={item.href!}>
                        <item.icon className={cn('shrink-0', active && 'text-sidebar-primary')} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
