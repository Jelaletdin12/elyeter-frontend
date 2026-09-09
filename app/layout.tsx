import type { Metadata } from 'next';
import { Fraunces, Public_Sans } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

/**
 * <html>/<body> SADECE burada bulunur — hem /[locale]/* (public) hem de
 * /admin/* (private) bu tek root'un altındadır. next-intl'in
 * NextIntlClientProvider'ı app/[locale]/layout.tsx'te, global provider'lar
 * (TanStack, tema, toast) burada.
 *
 * 🔴 AuthHydrator BİLEREK BURADA DEĞİL. Admin ve müşteri oturumları AYRI
 * cookie'ler kullanıyor (bkz. lib/auth/refresh-session.ts'teki not) — bu
 * yüzden her biri kendi bölümüne özel hydrate edilir:
 *   - Müşteri: app/[locale]/layout.tsx → providers/AuthHydrator.tsx
 *   - Admin:   app/admin/layout.tsx → features/auth/components/AdminAuthHydrator.tsx
 * Root'ta TEK bir hydrator olsaydı, hangi cookie'yi okuyacağını bilemezdi ve
 * (asıl bug) admin oturumu müşteri tarafına sızabilirdi.
 *
 * Fraunces (başlıklar) + Public Sans (UI/gövde metni) — DESIGN_NOTES.md'deki
 * tipografi kararı. CSS değişkenleri (--font-fraunces/--font-public-sans)
 * app/globals.css'teki @theme bloğunda font-display/font-sans'a bağlanıyor.
 *
 * suppressHydrationWarning <html>'de ZORUNLU: next-themes class'ı client'ta
 * (script ile, hydration'dan önce) <html>'e ekliyor — server'ın render ettiği
 * ile client'ın ilk paint'i farklı olacak, bu FARK BEKLENEN bir şey, React'in
 * bunun için uyarı vermesini istemiyoruz.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${fraunces.variable} ${publicSans.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
