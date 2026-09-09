import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from './config';

/**
 * FRONTEND_AGENTS.md #4 / STANDARDS #11: backend'in i18n key'leri (errors.*)
 * ile frontend'in kendi UI key'leri (common.*, products.*) AYNI namespace'te
 * karışmaz. Backend hata key'leri lib/i18n/error-messages/{locale}.json'da,
 * UI metinleri messages/{locale}.json'da ayrı tutulur.
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
