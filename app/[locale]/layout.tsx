import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/lib/i18n/config';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { AuthHydrator } from '@/providers/AuthHydrator';
import { AuthDialogTrigger } from '@/components/auth/AuthDialogTrigger';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // ISR sayfalarının doğru locale ile statik üretilmesi için gerekli
  // (next-intl server bileşenleri arasında senkron locale erişimi sağlar).
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthHydrator>
        <div className="flex min-h-screen flex-col">
          <SiteHeader locale={locale} />
          <AuthDialogTrigger />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
        </div>
      </AuthHydrator>
    </NextIntlClientProvider>
  );
}
