'use client';

/**
 * Admin panel `t()` — react-i18next İMİTASYONU DEĞİL, basit bir yardımcıdır.
 *
 * Arka plan: public sayfalar next-intl kullanır (`lib/i18n/` + messages/*.json),
 * admin ise `app/admin` altında — `[locale]` route'u DEĞİL, yani next-intl
 * kapsamı dışında. Admin product sayfaları (`app/admin/products/*`) daha önce
 * `react-i18next`'ten `useTranslation` import ediyordu ama react-i18next hiçbir
 * yerde initialize EDİLMEMİŞ (initReactI18next/I18nextProvider yok). Sonuç:
 * t(key, default, {count}) hep İngilizce default string'e düşüyor ve
 * `{{count}}` gibi placeholder'lar literal kalıyordu.
 *
 * Admin metinleri zaten İngilizce hardcoded geldiği için (diğer admin
 * sayfaları — categories/brands/users/orders — da t() kullanmıyor), bu hook
 * react-i18next'in `t(key, defaultValue, options)` imzasıyla uyumlu minimum
 * bir `t` döndürür: defaultValue'daki `{{name}}` (i18next) ve `{name}`
 * (ICU/next-intl) placeholder'larını options'tan doldurur.
 */
export type AdminTFunction = (
  key: string,
  defaultValue?: string,
  options?: Record<string, unknown>,
) => string;

function interpolate(defaultValue: string, options?: Record<string, unknown>): string {
  if (!options) return defaultValue;
  let out = defaultValue;
  for (const [k, v] of Object.entries(options)) {
    const value = String(v ?? '');
    out = out.split(`{{${k}}}`).join(value);
    out = out.split(`{${k}}`).join(value);
  }
  return out;
}

export function useTranslation(): { t: AdminTFunction } {
  return {
    t: (key, defaultValue, options) => interpolate(defaultValue ?? key, options),
  };
}
