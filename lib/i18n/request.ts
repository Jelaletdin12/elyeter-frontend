import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from './config';

/**
 * FRONTEND_AGENTS.md #4 / STANDARDS #11: backend'in i18n key'leri (errors.*)
 * ile frontend'in kendi UI key'leri (common.*, products.*) aynı
 * messages/{locale}.json içinde ayrı namespace'lerde tutulur (errors ns backend
 * anahtarları, geri kalanı UI metinleri).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isValidLocale(requested) ? requested : undefined;

  if (!locale) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
