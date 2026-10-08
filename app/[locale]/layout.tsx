import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { locales, isValidLocale } from '@/lib/i18n/config';

import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

import { AuthHydrator } from '@/providers/AuthHydrator';
import { AuthDialogTrigger } from '@/components/auth/AuthDialogTrigger';
import { RealtimeProvider } from '@/providers/RealtimeProvider';

import { getPublicCategoryTree } from '@/features/categories/api/queries';

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  /**
   * next-intl:
   * ISR/static pages need the request locale
   * to be explicitly available on the server.
   */
  setRequestLocale(locale);

  /**
   * Load translations and public category tree
   * on the server.
   *
   * getPublicCategoryTree() already uses Next.js
   * Data Cache + ISR (revalidate: 300).
   */
  const [messages, categories] = await Promise.all([getMessages(), getPublicCategoryTree()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthHydrator>
        {/* Socket.IO canlı bildirim köprüsü — NextIntlClientProvider (locale) +
            QueryProvider (root, queryClient) altında olduğu için olayları
            invalidation + çevrilmiş toast'a çevirebilir. */}
        <RealtimeProvider />

        <div className="flex min-h-screen flex-col">
          <SiteHeader locale={locale} categories={categories} />

          <AuthDialogTrigger />

          <main className="flex-1">{children}</main>

          <SiteFooter locale={locale} />
        </div>
      </AuthHydrator>
    </NextIntlClientProvider>
  );
}
