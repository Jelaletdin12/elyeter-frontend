'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { stockNotificationListOptions } from '../api/queries';
import { useSubscribeToStockMutation, useUnsubscribeFromStockMutation } from '../api/mutations';

type NotifyMeButtonProps = {
  productVariantId: string;
};

/**
 * "Stoğa gelince haber ver" butonu — ürün sayfasında stokta OLMAYAN varyant
 * için gösterilir (bkz. ProductVariantPicker).
 *
 * Abone durumu `GET /notifications/stock` listesinden türetilir (ayrı bir
 * "bu varyanta abone miyim" endpoint'i yok); giriş yapılmamışsa auth
 * dialog'u açılır, çünkü backend abonelikleri sadece CLIENT oturumuyla kabul
 * eder.
 */
export function NotifyMeButton({ productVariantId }: NotifyMeButtonProps) {
  const t = useTranslations('notifications');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);

  const { data: subscriptions, isLoading } = useQuery({
    ...stockNotificationListOptions(storeId, { limit: 100 }),
    enabled: isAuthenticated,
  });

  const subscribed =
    subscriptions?.items.some((item) => item.productVariantId === productVariantId) ?? false;

  const subscribe = useSubscribeToStockMutation(storeId);
  const unsubscribe = useUnsubscribeFromStockMutation(storeId);
  const isPending = subscribe.isPending || unsubscribe.isPending;

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => openAuthDialog('login')}
        className="h-11 w-full rounded-xl text-sm font-medium"
      >
        <Bell size={15} />
        {t('notifyMe')}
      </Button>
    );
  }

  const handleClick = () => {
    if (subscribed) {
      unsubscribe.mutate(productVariantId, {
        onSuccess: () => toast.success(t('unsubscribed')),
      });
      return;
    }

    subscribe.mutate(productVariantId, {
      onSuccess: () => toast.success(t('subscribed')),
    });
  };

  return (
    <Button
      type="button"
      variant={subscribed ? 'secondary' : 'outline'}
      size="lg"
      disabled={isPending || isLoading}
      onClick={handleClick}
      aria-pressed={subscribed}
      title={subscribed ? t('cancelNotification') : undefined}
      className="h-11 w-full rounded-xl text-sm font-medium"
    >
      {isPending || isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : subscribed ? (
        <Check size={15} />
      ) : (
        <Bell size={15} />
      )}

      {subscribed ? t('notificationEnabled') : t('notifyMe')}
    </Button>
  );
}
