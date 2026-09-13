'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * shadcn'in standart tema pattern'i. next-themes kendi anti-flash script'ini
 * <html> etiketine otomatik enjekte ediyor (attribute="class" ile) — elle
 * yazdığımız ThemeScript.tsx artık gereksiz, kaldırıldı.
 *
 * Tip, 'next-themes/dist/types' gibi bir iç (internal) yoldan İMPORT EDİLMEZ —
 * paketin versiyonları arasında bu iç dosya yapısı değişebiliyor (tam olarak
 * yaşadığımız hata). Bunun yerine ComponentProps<typeof NextThemesProvider>
 * kullanmak, paketin kendi export ettiği component'ten tipi türetir — hangi
 * next-themes sürümü kurulu olursa olsun çalışır.
 */
type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

// React 19 / Next.js ile next-themes'in SSR anti-flash <script> etiketi
// için konsola bastığı false-positive uyarıyı development ortamında filtreliyoruz.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag while rendering React component')
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
