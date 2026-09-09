import { AdminGuard } from '@/features/auth/components/AdminGuard';
import { AdminAuthHydrator } from '@/features/auth/components/AdminAuthHydrator';

/**
 * STANDARDS.md #4: Admin panel — CSR (tüm ağaç), root layout force-dynamic,
 * Next Data Cache hiçbir zaman kullanılmaz.
 *
 * ÖNEMLİ: <html>/<body> burada TEKRARLANMAZ — tek root o etiketleri zaten
 * app/layout.tsx'te tanımlıyor (Next.js App Router'da tüm ağaçta tek bir
 * <html> olabilir). Auth guard + admin shell (sidebar) client tarafına
 * (AdminGuard) taşındı çünkü hook kullanımı 'use client' gerektiriyor ve
 * 'force-dynamic' segment config'i sadece Server Component'lerde etkilidir.
 *
 * AdminAuthHydrator BİLEREK burada, müşteri tarafının AuthHydrator'ından AYRI
 * — admin_refresh_token cookie'sini okur, müşterinin refresh_token'ına hiç
 * dokunmaz (bkz. lib/auth/refresh-admin-session.ts).
 */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthHydrator>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthHydrator>
  );
}
