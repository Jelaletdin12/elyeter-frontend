import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';

export const dynamic = 'force-dynamic';

/**
 * Müşteri girişinden (app/[locale]/login) tamamen ayrı, bilinçli olarak
 * sade/"araç" hissi veren bir sayfa — bkz. DESIGN_NOTES.md.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8">
        <p className="font-serif text-2xl italic text-foreground">Admin panel</p>
        <p className="mt-1 text-sm text-muted-foreground">Staff sign-in only.</p>

        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
