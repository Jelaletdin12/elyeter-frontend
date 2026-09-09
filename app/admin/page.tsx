'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Users, ShoppingCart, TrendingUp, Plus, ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ProductListResponse } from '@/features/products/types';
import type { UserListResponse } from '@/features/users/types';

/**
 * Admin'in "eve giriş" sayfası — sidebar'daki "Overview" burası. Sadece
 * GERÇEK/onaylı endpoint'lerden (GET /products, GET /users) gelen sayıları
 * gösteriyor; orders/revenue gibi response şekli henüz doğrulanmamış
 * endpoint'ler için sahte sayı göstermek yerine "Coming soon" gösteriyor.
 *
 * Not: ayrı bir "StatCard" shared component'i YOK — shadcn'in Card'ı zaten
 * yeterli, 4 kart için ekstra soyutlama katmanı over-engineering olurdu.
 * Bunun yerine SADECE bu dosyaya özel, export edilmeyen küçük bir yerel
 * fonksiyon (StatBlock) tekrarı önlüyor — paylaşılan bir component değil.
 */

function StatBlock({
  label,
  icon: Icon,
  value,
  href,
  accent,
}: {
  label: string;
  icon: LucideIcon;
  value?: number | string;
  href?: string;
  accent: 'saffron' | 'teal';
}) {
  const card = (
    <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={
          accent === 'saffron'
            ? 'flex h-9 w-9 items-center justify-center rounded-card bg-saffron/15 text-saffron-dark'
            : 'flex h-9 w-9 items-center justify-center rounded-card bg-teal/10 text-teal'
        }
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm text-ink-muted">{label}</p>
      {value === undefined ? (
        <p className="mt-1 font-display text-lg italic text-ink-muted/60">Coming soon</p>
      ) : (
        <p className="mt-1 font-display text-3xl italic text-ink">{value}</p>
      )}
      {href && (
        <ArrowUpRight
          size={16}
          className="absolute right-4 top-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function AdminDashboardPage() {
  const { user, can } = useAuth();

  const { data: productData } = useQuery({
    queryKey: ['admin-dashboard', 'products-count'],
    queryFn: () => authorizedFetch<ProductListResponse>('/products?limit=1'),
    staleTime: 60_000,
  });

  const { data: userData } = useQuery({
    queryKey: ['admin-dashboard', 'users-count'],
    queryFn: () => authorizedFetch<UserListResponse>('/users?limit=1'),
    staleTime: 60_000,
    enabled: can('user.manage'),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl italic text-ink">
          {greeting}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s what&apos;s happening in your store.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBlock label="Products" icon={Package} value={productData?.meta.total} href="/admin/products" accent="teal" />
        <StatBlock label="Orders" icon={ShoppingCart} accent="saffron" />
        {can('user.manage') ? (
          <StatBlock label="Staff & customers" icon={Users} value={userData?.meta.total} href="/admin/users" accent="teal" />
        ) : (
          <StatBlock label="Staff & customers" icon={Users} accent="teal" />
        )}
        <StatBlock label="Revenue" icon={TrendingUp} accent="saffron" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {can('product.create') && (
          <Card>
            <CardHeader>
              <CardTitle>Add a product</CardTitle>
              <CardDescription>List a new item in your catalog.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" className="bg-saffron text-ink hover:bg-saffron-dark">
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
