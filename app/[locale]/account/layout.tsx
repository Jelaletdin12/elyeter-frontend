import { AccountNav } from '@/features/account/components/AccountNav';

/** STANDARDS.md #4: Hesap bölümü — CSR, cache yok. Sekmeler (Profil /
 *  Favoriler / Siparişler) alt sayfalarda ortak başlık olarak görünür. */
export const dynamic = 'force-dynamic';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-foreground text-xl font-semibold">Hesabım</h1>
      <div className="mt-4">
        <AccountNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
