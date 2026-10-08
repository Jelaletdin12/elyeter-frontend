import { useTranslations } from 'next-intl';
import { AccountNav } from '@/features/account/components/AccountNav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('account');
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-foreground text-xl font-semibold">{t('title')}</h1>
      <div className="mt-4">
        <AccountNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
