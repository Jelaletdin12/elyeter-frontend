import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import tk from '@/messages/tk.json';
import { isValidLocale } from '@/lib/i18n/config';

/**
 * FRONTEND_AGENTS.md #4: Backend hata mesajları i18n key olarak gelir (örn.
 * "errors.product_not_found"). Key'ler messages/{locale}.json → "errors"
 * namespace'inde 3 dilde tutulur; bu modül aktif locale'e göre çözer.
 *
 * QueryProvider (app/layout.tsx altında, next-intl'in locale sınırının DIŞINDA
 * — hem /admin hem /[locale]/* için tek instance) useLocale() çağıramaz; bu
 * yüzden aktif locale pathname'in ilk segment'inden okunur. Bulunamazsa 'en'
 * (admin dahil). Bilinmeyen bir key gelirse key'i "insan diline" çevirip
 * (alt çizgileri boşluğa çevir, baş harfi büyült) fallback gösterir — hiçbir
 * zaman kullanıcıya çiğ "errors.xyz" string'i görünmez.
 */
const MESSAGES: Record<string, { errors?: Record<string, string> }> = { en, ru, tk };

function getActiveLocale(): string {
  if (typeof window === 'undefined') return 'en';
  const segment = window.location.pathname.split('/')[1] ?? '';
  return isValidLocale(segment) ? segment : 'en';
}

function humanizeKey(key: string): string {
  const withoutPrefix = key.replace(/^errors\./, '');
  const words = withoutPrefix.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function resolveErrorMessage(i18nKey: string, locale?: string): string {
  const active = locale ?? getActiveLocale();
  const shortKey = i18nKey.replace(/^errors\./, '');
  const messages = MESSAGES[active] ?? MESSAGES.en;
  const known = messages?.errors?.[shortKey] ?? MESSAGES.en?.errors?.[shortKey];
  return known ?? humanizeKey(i18nKey);
}
