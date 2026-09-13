'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';

/**
 * FRONTEND_AGENTS.md #9: rol bazlı UI kontrolü `useAuth().can(action)`
 * üzerinden. Gerçek yetki sınırı backend RolesGuard'dadır — bu sadece
 * yetkisiz kullanıcıya boş/kırık admin ekranı göstermemek için.
 *
 * ÖNEMLİ: /admin/login BU GUARD'IN DIŞINDA tutulmalı — aksi halde
 * "giriş yapmamışsın → /admin/login'e yönlendir" ile "/admin/login zaten
 * /admin altında, guard onu da sarıyor → tekrar yönlendir" sonsuz döngüsü
 * oluşur. app/admin/layout.tsx tüm /admin/* için tek layout olduğundan
 * (route group ile ayırmak yerine) pathname kontrolüyle burada dışlıyoruz.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrating, isAuthenticated, can } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage || isHydrating) return;
    if (!isAuthenticated || !can('admin.access')) {
      router.replace('/admin/login');
    }
  }, [isLoginPage, isHydrating, isAuthenticated, can, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isHydrating) {
    return <div className="text-muted-foreground p-8 text-sm">Loading…</div>;
  }

  if (!isAuthenticated || !can('admin.access')) {
    return null;
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
