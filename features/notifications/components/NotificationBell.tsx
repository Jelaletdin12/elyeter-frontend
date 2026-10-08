'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { unreadNotificationCountOptions } from '../api/queries';

/**
 * Header zili. Rozet (okunmamış abonelik sayısı) sadece giriş yapılmış
 * istemcide çekilir; canlı `stock_notification.ready` olayı gelince
 * RealtimeProvider `notifications.all` invalidation'ı ile anında tazelenir.
 *
 * Misafirler de zili görür (favori ikonuyla aynı davranış — sayfada giriş
 * EmptyState'i karşılar), böylece header'da layout zıplamaz.
 */
export function NotificationBell() {
  const locale = useLocale();
  const t = useTranslations('notifications');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: unreadCount = 0 } = useQuery({
    ...unreadNotificationCountOptions(storeId),
    enabled: isAuthenticated,
  });

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={t('bellLabel')}
      className="text-muted-foreground hover:bg-accent hover:text-foreground relative transition-colors"
    >
      <Link href={`/${locale}/account/notifications`}>
        <Bell size={19} strokeWidth={1.8} />

        {unreadCount > 0 && (
          <span className="bg-destructive absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
