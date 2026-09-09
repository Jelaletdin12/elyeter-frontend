import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';

export const dynamic = 'force-dynamic';

/**
 * Müşteri girişinden (app/[locale]/login) tamamen ayrı, bilinçli olarak
 * sade/"araç" hissi veren bir sayfa — bkz. DESIGN_NOTES.md.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8">
        <p className="font-display text-2xl italic text-ink">Admin panel</p>
        <p className="mt-1 text-sm text-ink-muted">Staff sign-in only.</p>

        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
