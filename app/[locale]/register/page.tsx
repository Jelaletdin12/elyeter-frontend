import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl italic">Create an account</h1>
      <p className="mt-2 text-sm text-ink-muted">Join to save your cart and track orders.</p>

      <div className="mt-8">
        <RegisterForm locale={locale} />
      </div>

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{' '}
        <Link href={`/${locale}/login`} className="font-medium text-ink underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
