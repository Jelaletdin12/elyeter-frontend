import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';

export const dynamic = 'force-dynamic';

/**
 * Müşteri girişinden (app/[locale]/login) tamamen ayrı, bilinçli olarak
 * sade/"araç" hissi veren bir sayfa — bkz. DESIGN_NOTES.md.
 */
export default function AdminLoginPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="border-border bg-card w-full max-w-sm rounded-md border p-8">
        <p className="text-foreground font-serif text-2xl italic">Admin panel</p>
        <p className="text-muted-foreground mt-1 text-sm">Staff sign-in only.</p>

        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
