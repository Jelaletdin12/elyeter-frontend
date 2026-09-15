'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, LogOut, User, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { useLogoutMutation } from '@/features/auth/api/mutations';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AuthDialog } from '@/features/auth/components/AuthDialog';
import { MobileSearchSheet } from '@/features/home/components/MobileSearchSheet';
import { SearchBar } from '@/features/home/components/SearchBar';
import logo from '@/public/logo.png';

/**
 * Nav bar — shadcn semantic token'ları kullanıyor (bg-primary vb.), custom
 * @theme token'ları (bg-sidebar-primary, bg-saffron, text-foreground, rounded-md) kaldırıldı.
 *
 * Login/Register artık ayrı route değil — AuthDialog (Dialog + Tabs) ile
 * modal olarak açılıyor; açık/kapalı durumu ui-store'da (account guard'ı da
 * aynı dialog'u açabilir). Arama masaüstünde inline, mobilde Sheet ile.
 *
 * isHydrating true iken auth alanı boş — sayfa yenilendiğinde AuthHydrator
 * silent-refresh'i bitirmeden "Sign in" yazıp sonra kullanıcı adına
 * değişmesin diye (flash of wrong state).
 */
export function SiteHeader({ locale }: { locale: string }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const logout = useLogoutMutation();

  const authDialogOpen = useUiStore((s) => s.authDialogOpen);
  const setAuthDialogOpen = useUiStore((s) => s.setAuthDialogOpen);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);
  const authDialogTab = useUiStore((s) => s.authDialogTab);
  
  const pathname = usePathname();

const languages = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'tk', label: 'TK' },
] as const;

const switchLocale = (nextLocale: string) => {
  return pathname.replace(
    /^\/(en|ru|tk)(?=\/|$)/,
    `/${nextLocale}`,
  );
};

  return (
    <header className="bg-sidebar-primary text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
        <Link href={`/${locale}`} className="shrink-0">
          <Image src={logo} alt="Logo" width={140} height={40} className="h-9 w-auto" />
        </Link>

        {/* SEARCH — sadece masaüstü */}
        <div className="hidden flex-1 md:block">
          <SearchBar locale={locale} />
        </div>

        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-2">
          <Button
            asChild
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/${locale}/discounted`}>Sale</Link>
          </Button>
			<div className="hidden items-center sm:flex">
  <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5">
    <Globe size={14} className="ml-2 mr-1 text-white/60" />

    {languages.map((language) => (
      <Link
        key={language.value}
        href={switchLocale(language.value)}
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
          language.value === locale
            ? 'bg-white text-black'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
      >
        {language.label}
      </Link>
    ))}
  </div>
</div>
          <ThemeToggle variant="dark" />

          <MobileSearchSheet locale={locale} />

          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Wishlist"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/${locale}/account/wishlist`}>
              <Heart size={20} strokeWidth={1.75} />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/${locale}/cart`}>
              <ShoppingBag size={20} strokeWidth={1.75} />
            </Link>
          </Button>

          {isHydrating ? (
            <div className="w-20" />
          ) : isAuthenticated ? (
            <div className="ml-1 flex items-center gap-2">
              <Link
                href={`/${locale}/account`}
                className="hidden items-center gap-1.5 text-white/75 sm:flex"
              >
                <User size={16} strokeWidth={1.75} />
                {user?.fullName}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => logout.mutate()}
                aria-label="Sign out"
                className="text-white/75 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={18} strokeWidth={1.75} />
              </Button>
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => openAuthDialog('login')}
                className="text-white/80 hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => openAuthDialog('register')}
                className="rounded-full font-medium"
              >
                Register
              </Button>
            </div>
          )}
        </nav>
      </div>

      <AuthDialog
        locale={locale}
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDialogTab}
      />
    </header>
  );
}
