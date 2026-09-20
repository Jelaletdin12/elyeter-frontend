'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, User, Globe, Zap, ChevronDown, Check } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    return pathname.replace(/^\/(en|ru|tk)(?=\/|$)/, `/${nextLocale}`);
  };

  return (
    <header className="border-border/70 bg-background/85 text-foreground supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link href={`/${locale}`} className="shrink-0">
          <Image src={logo} alt="Logo" width={140} height={40} className="h-9 w-auto" />
        </Link>

        {/* SEARCH — sadece masaüstü */}
        <div className="hidden w-full  flex-1 md:block">
          <SearchBar locale={locale} />
        </div>

        <nav className="ml-auto flex items-center gap-1 text-base sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-accent hover:text-foreground gap-1.5"
          >
            <Link href={`/${locale}/discounted`}>
              <Zap size={15} strokeWidth={2.2} className="text-primary" />
              <span>Sale</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Link href={`/${locale}/brands`}>Brands</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-accent hover:text-foreground h-9 gap-1.5 rounded-md px-2.5"
              >
                <Globe size={15} strokeWidth={1.8} />

                <span className="text-xs font-medium uppercase">{locale}</span>

                <ChevronDown size={13} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="bg-accent min-w-30">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.value}
                  asChild
                  className="cursor-pointer justify-between"
                >
                  <Link href={switchLocale(language.value)}>
                    <span>{language.label}</span>

                    {language.value === locale && <Check size={14} className="text-primary" />}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle variant="dark" />

          <MobileSearchSheet locale={locale} />

          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Wishlist"
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Link href={`/${locale}/account/wishlist`}>
              <Heart size={19} strokeWidth={1.8} />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Link href={`/${locale}/cart`}>
              <ShoppingBag size={19} strokeWidth={1.8} />
            </Link>
          </Button>

          {isHydrating ? (
            <div className="w-20" />
          ) : isAuthenticated ? (
            <div className="ml-1 flex items-center gap-2">
              <Link
                href={`/${locale}/account`}
                className="text-muted-foreground hover:bg-accent hover:text-foreground hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors sm:flex"
              >
                <User size={16} strokeWidth={1.8} />

                <span className="max-w-25 truncate">{user?.fullName}</span>
              </Link>
              {/* <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => logout.mutate()}
                aria-label="Sign out"
                className="text-white/75 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={18} strokeWidth={1.75} />
              </Button> */}
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
