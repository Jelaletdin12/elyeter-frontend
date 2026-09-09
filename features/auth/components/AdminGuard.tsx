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
    return <div className="p-8 text-sm text-ink-muted">Loading…</div>;
  }

  if (!isAuthenticated || !can('admin.access')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
