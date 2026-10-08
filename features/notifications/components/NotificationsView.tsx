'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellRing, ChevronLeft, ChevronRight, Heart, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { stockNotificationListOptions, unreadNotificationCountOptions } from '../api/queries';
import {
  useMarkStockNotificationsReadMutation,
  useUnsubscribeFromStockMutation,
} from '../api/mutations';
import type { StockNotificationItem } from '../types';

/**
 * /account/notifications içeriği. Liste hem "bekliyor" (stoğu olmayan varyant)
 * hem "stoğa geldi" aboneliklerini gösterir; okunmamış sadece `readyAt` dolu
 * satırlardır (backend `unreadOnly` filtresiyle aynı kural).
 */
export function NotificationsView() {
  const locale = useLocale();
  const t = useTranslations('notifications');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);

  const [page, setPage] = useState(1);

  const list = useQuery({
    ...stockNotificationListOptions(storeId, { page }),
    enabled: isAuthenticated,
  });
  const { data: unreadCount = 0 } = useQuery({
    ...unreadNotificationCountOptions(storeId),
    enabled: isAuthenticated,
  });

  const markRead = useMarkStockNotificationsReadMutation(storeId);
  const unsubscribe = useUnsubscribeFromStockMutation(storeId);

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Bell}
        title={t('signIn')}
        action={
          <button
            type="button"
            onClick={() => openAuthDialog('login')}
            className="text-sm underline"
          >
            {t('signInAction')}
          </button>
        }
      />
    );
  }

  if (list.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = list.data?.items ?? [];
  const meta = list.data?.meta;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t('empty')}
        description={t('emptyDescription')}
        action={
          <Link href={`/${locale}`} className="text-sm underline">
            {t('browseProducts')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {t('countSummary', { count: meta?.total ?? items.length })}
        </p>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markRead.isPending}
            onClick={() => markRead.mutate()}
          >
            {markRead.isPending && <Loader2 size={14} className="animate-spin" />}
            {t('markAllRead')}
          </Button>
        )}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            locale={locale}
            onView={() => {
              // Tek bir kart açılınca sadece o satır okundu sayılır
              // (backend PATCH /notifications/stock/read ile aynı semantics).
              if (item.readyAt && !item.readAt) {
                markRead.mutate(item.productVariantId);
              }
            }}
            onCancel={() => unsubscribe.mutate(item.productVariantId)}
            isCancelling={unsubscribe.isPending && unsubscribe.variables === item.productVariantId}
          />
        ))}
      </ul>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
            {t('previous')}
          </Button>

          <span className="text-muted-foreground text-sm tabular-nums">
            {page} / {meta.totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages || list.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('next')}
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  locale,
  onView,
  onCancel,
  isCancelling,
}: {
  item: StockNotificationItem;
  locale: string;
  onView: () => void;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const t = useTranslations('notifications');

  const translation =
    item.productVariant.product.translations.find((tr) => tr.locale === locale) ??
    item.productVariant.product.translations[0];

  const name = translation?.name ?? item.productVariant.sku;
  const slug = translation?.slug;
  const isReady = item.readyAt !== null;

  return (
    <li className="border-border bg-card/50 flex items-start gap-3 rounded-2xl border p-4">
      <span
        className={
          isReady
            ? 'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full'
        }
      >
        {isReady ? <BellRing size={16} /> : <Bell size={16} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={isReady ? 'success' : 'neutral'}>
            {isReady ? t('restocked') : t('waiting')}
          </StatusBadge>

          <span className="text-foreground truncate text-sm font-medium">{name}</span>
        </div>

        <p className="text-muted-foreground mt-1.5 text-xs">
          {item.productVariant.sku}
          {' · '}
          {new Date(isReady ? (item.readyAt as string) : item.createdAt).toLocaleDateString()}
        </p>
      </div>

      {isReady ? (
        slug ? (
          <Link
            href={`/${locale}/products/${slug}`}
            onClick={onView}
            className="text-muted-foreground hover:text-foreground shrink-0 text-sm underline transition-colors"
          >
            {t('viewProduct')}
          </Link>
        ) : null
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isCancelling}
          onClick={onCancel}
          className="text-muted-foreground hover:text-destructive h-8 shrink-0 px-2"
        >
          {isCancelling ? <Loader2 size={14} className="animate-spin" /> : t('cancelSubscription')}
        </Button>
      )}
    </li>
  );
}
