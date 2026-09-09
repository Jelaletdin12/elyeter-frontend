// Backend ile birebir: schema.prisma'daki CategoryTranslation/ProductTranslation.locale
// alanlarıyla aynı üç dil. Yeni bir locale eklenirse bu dosya + messages/{locale}.json
// + backend'in kendi locale listesi birlikte güncellenir.
export const locales = ['en', 'ru', 'tk'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
