'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Eye,
  Search,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  statsOverviewOptions,
  productsByOperatorOptions,
  mostViewedProductsOptions,
  mostSearchedTermsOptions,
} from '@/features/stats/api/queries';
import type { ProductsByOperatorEntry } from '@/features/stats/types';
import { ORDER_STATUS_FLOW, type OrderStatus } from '@/features/orders/types';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ProductListResponse } from '@/features/products/types';
import type { UserListResponse } from '@/features/users/types';

// globals.css'deki --chart-1..5 tokenlarına eşleniyor — gerçek status key'leriyle (SCREAMING_SNAKE)
const STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  PENDING: 'var(--chart-4)',
  CONFIRMED: 'var(--chart-1)',
  PROCESSING: 'var(--chart-1)',
  SHIPPED: 'var(--chart-3)',
  DELIVERED: 'var(--chart-2)',
  CANCELLED: 'var(--chart-5)',
  RETURN_REQUESTED: 'var(--chart-4)',
  RETURNED: 'var(--muted-foreground)',
};

function StatBlock({
  label,
  icon: Icon,
  value,
  href,
}: {
  label: string;
  icon: LucideIcon;
  value?: number | string;
  href?: string;
}) {
  const card = (
    <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={19} strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      {value === undefined ? (
        <p className="mt-1 text-lg font-medium text-muted-foreground/60">Coming soon</p>
      ) : (
        <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      )}
      {href && (
        <ArrowUpRight
          size={16}
          className="absolute top-4 right-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function StatBlockSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="mt-4 h-4 w-20" />
      <Skeleton className="mt-2 h-7 w-14" />
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user, can } = useAuth();
  const storeId = useAuthStore((s) => s.activeStoreId);

  const canViewStats = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-dashboard', 'products-count'],
    queryFn: () => authorizedFetch<ProductListResponse>('/products?limit=1'),
    staleTime: 60_000,
  });

  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-dashboard', 'users-count'],
    queryFn: () => authorizedFetch<UserListResponse>('/users?limit=1'),
    staleTime: 60_000,
    enabled: can('user.manage'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    ...statsOverviewOptions(storeId),
    enabled: canViewStats,
  });

  const { data: operators } = useQuery({
    ...productsByOperatorOptions(storeId),
    enabled: canViewStats,
  });

  const { data: topProducts } = useQuery({
    ...mostViewedProductsOptions(storeId, 'en', 5),
    enabled: canViewStats,
  });

  const { data: topSearches } = useQuery({
    ...mostSearchedTermsOptions(storeId, 5),
    enabled: canViewStats,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statsCardsLoading = productsLoading || (can('user.manage') && usersLoading) || (canViewStats && statsLoading);

  const statusChartData = stats
    ? ORDER_STATUS_FLOW.map(({ status, label }) => ({
        name: label,
        value: stats.ordersByStatus[status] ?? 0,
        color: STATUS_CHART_COLORS[status],
      })).filter((d) => d.value > 0)
    : [];
  const totalStatusOrders = statusChartData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your store.</p>
      </div>

      {/* Stat cards */}
      {statsCardsLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatBlockSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Products" icon={Package} value={productData?.meta.total} href="/admin/products" />
          <StatBlock label="Orders" icon={ShoppingCart} value={stats?.totalOrders} href="/admin/orders" />
          <StatBlock label="Units sold" icon={TrendingUp} value={stats?.totalUnitsSold} />
          {can('user.manage') ? (
            <StatBlock label="Staff & customers" icon={Users} value={userData?.meta.total} href="/admin/users" />
          ) : (
            <StatBlock label="Staff & customers" icon={Users} />
          )}
        </div>
      )}

      {/* Orders by status */}
      {canViewStats && stats && totalStatusOrders > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Orders by status</CardTitle>
              <CardDescription>Current breakdown across the order lifecycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {ORDER_STATUS_FLOW.map(({ status, label, tone }) => (
                  <StatusBadge
                    key={status}
                    tone={tone}
                    className={stats.ordersByStatus[status] === 0 ? 'opacity-40' : ''}
                  >
                    {label} · {stats.ordersByStatus[status]}
                  </StatusBadge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribution</CardTitle>
              <CardDescription>{totalStatusOrders} total orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most viewed / most searched */}
      {(topProducts && topProducts.length > 0) || (topSearches && topSearches.length > 0) ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {topProducts && topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye size={16} className="text-muted-foreground" /> Most viewed products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{p.viewCount} views</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {topSearches && topSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search size={16} className="text-muted-foreground" /> Most searched terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topSearches.map((t) => (
                  <div key={t.term} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs">{t.term}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{t.searchCount} searches</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {canViewStats && operators && operators.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Products by operator</CardTitle>
            <CardDescription>How many products each admin &amp; operator manages.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<ProductsByOperatorEntry>
              isLoading={false}
              rows={operators}
              getRowId={(row) => row.operatorId}
              emptyTitle="No operators yet"
              columns={[
                {
                  header: 'Operator',
                  cell: (row) => (
                    <div>
                      <p className="text-sm font-medium">{row.operatorFullName}</p>
                      <p className="text-xs text-muted-foreground">{row.operatorEmail}</p>
                    </div>
                  ),
                },
                {
                  header: 'Products',
                  className: 'text-right',
                  cell: (row) => <span className="text-sm tabular-nums">{row.productCount}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {can('product.create') && (
          <Card>
            <CardHeader>
              <CardTitle>Add a product</CardTitle>
              <CardDescription>List a new item in your catalog.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href="/admin/products">
                  <Plus size={16} /> New product
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {can('user.create') && (
          <Card>
            <CardHeader>
              <CardTitle>Invite staff</CardTitle>
              <CardDescription>Give someone access to the admin panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">
                  <Plus size={16} /> New staff account
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}