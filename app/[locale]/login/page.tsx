import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl italic">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">Welcome back.</p>

      <div className="mt-8">
        <LoginForm locale={locale} />
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        New here?{' '}
        <Link href={`/${locale}/register`} className="font-medium text-ink underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
