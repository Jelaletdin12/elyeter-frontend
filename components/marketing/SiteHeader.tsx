'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Heart, ShoppingBag, User, Globe, Zap, ChevronDown, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AuthDialog } from '@/features/auth/components/AuthDialog';

import { MobileSearchSheet } from '@/features/home/components/MobileSearchSheet';
import { SearchBar } from '@/features/home/components/SearchBar';

import { CategoryMegaMenu } from '@/features/categories/components/CategoryMegaMenu';
import type { CategoryTreeNode } from '@/features/categories/types';

import { NotificationBell } from '@/features/notifications/components/NotificationBell';

import logo from '@/public/logo.png';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SiteHeaderProps = {
  locale: string;
  categories?: CategoryTreeNode[] | null;
};

/**
 * Elýeter main site header.
 *
 * Features:
 * - Logo
 * - Desktop search
 * - Sale
 * - Categories mega menu
 * - Brands
 * - Language switcher
 * - Theme toggle
 * - Mobile search
 * - Wishlist
 * - Cart
 * - Authentication state
 *
 * Authentication:
 * AuthHydrator finishes silent refresh before showing
 * the authenticated / unauthenticated UI to avoid
 * wrong-state flashing after page refresh.
 */
export function SiteHeader({ locale, categories }: SiteHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  const authDialogOpen = useUiStore((state) => state.authDialogOpen);

  const setAuthDialogOpen = useUiStore((state) => state.setAuthDialogOpen);

  const openAuthDialog = useUiStore((state) => state.openAuthDialog);

  const authDialogTab = useUiStore((state) => state.authDialogTab);

  const pathname = usePathname();

  const t = useTranslations('header');

  const languages = [
    {
      value: 'en',
      label: 'EN',
    },
    {
      value: 'ru',
      label: 'RU',
    },
    {
      value: 'tk',
      label: 'TK',
    },
  ] as const;

  /**
   * Replace only the locale prefix.
   *
   * Example:
   * /en/products/iphone
   * -> /ru/products/iphone
   */
  const switchLocale = (nextLocale: string) => {
    const replacedPath = pathname.replace(/^\/(en|ru|tk)(?=\/|$)/, `/${nextLocale}`);

    /**
     * If pathname doesn't contain locale for some reason,
     * make sure we still return a valid localized route.
     */
    if (replacedPath === pathname) {
      return `/${nextLocale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
    }

    return replacedPath;
  };

  return (
    <header className="border-border/70 bg-background/85 text-foreground supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4">
        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
          href={`/${locale}`}
          className="shrink-0 transition-opacity hover:opacity-85"
          aria-label={t('home')}
        >
          <Image src={logo} alt="Elýeter" width={140} height={40} priority className="h-9 w-auto" />
        </Link>

        {/* =================================================
              CATEGORIES
          ================================================== */}
        <div className="hidden md:block">
          <CategoryMegaMenu locale={locale} categories={categories} />
        </div>

        {/* =====================================================
            DESKTOP SEARCH
        ====================================================== */}
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar locale={locale} />
        </div>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}
        <nav className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* =================================================
              SALE
          ================================================== */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-accent hover:text-foreground hidden h-9 gap-1.5 rounded-md px-2.5 transition-colors sm:flex"
          >
            <Link href={`/${locale}/discounted`}>
              <Zap size={15} strokeWidth={2.2} className="text-primary" />

              <span>{t('sale')}</span>
            </Link>
          </Button>

          {/* =================================================
              BRANDS
          ================================================== */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-accent hover:text-foreground hidden h-9 rounded-md px-2.5 transition-colors sm:flex"
          >
            <Link href={`/${locale}/brands`}>{t('brands')}</Link>
          </Button>

          {/* =================================================
              LANGUAGE
          ================================================== */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('changeLanguage')}
                className="text-muted-foreground hover:bg-accent hover:text-foreground h-9 gap-1.5 rounded-md px-2.5 transition-colors"
              >
                <Globe size={15} strokeWidth={1.8} />

                <span className="text-xs font-medium uppercase">{locale}</span>

                <ChevronDown size={13} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="border-border/70 bg-popover min-w-30 rounded-xl p-1.5 shadow-xl"
            >
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.value}
                  asChild
                  className="cursor-pointer justify-between rounded-lg"
                >
                  <Link href={switchLocale(language.value)}>
                    <span>{language.label}</span>

                    {language.value === locale && <Check size={14} className="text-primary" />}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* =================================================
              THEME
          ================================================== */}
          <ThemeToggle variant="dark" />

          {/* =================================================
              MOBILE SEARCH
          ================================================== */}
          <MobileSearchSheet locale={locale} />

          {/* =================================================
              WISHLIST
          ================================================== */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t('wishlist')}
            className="text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Link href={`/${locale}/account/wishlist`}>
              <Heart size={19} strokeWidth={1.8} />
            </Link>
          </Button>

          {/* =================================================
              NOTIFICATIONS (live stock + order status)
          ================================================== */}
          <NotificationBell />

          {/* =================================================
              CART
          ================================================== */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t('cart')}
            className="text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Link href={`/${locale}/cart`}>
              <ShoppingBag size={19} strokeWidth={1.8} />
            </Link>
          </Button>

          {/* =================================================
              AUTH
          ================================================== */}
          {isHydrating ? (
            <div className="bg-muted ml-1 h-9 w-20 animate-pulse rounded-lg" aria-hidden="true" />
          ) : isAuthenticated ? (
            <div className="ml-1 flex items-center">
              <Link
                href={`/${locale}/account`}
                className="text-muted-foreground hover:bg-accent hover:text-foreground hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors sm:flex"
              >
                <User size={16} strokeWidth={1.8} />

                <span className="max-w-25 truncate">{user?.fullName}</span>
              </Link>
            </div>
          ) : (
            <div className="ml-1 hidden items-center gap-1.5 sm:flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openAuthDialog('login')}
                className="text-muted-foreground hover:bg-accent hover:text-foreground h-9 rounded-lg px-3"
              >
                {t('signIn')}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openAuthDialog('register')}
                className="h-9 rounded-full px-4 font-medium"
              >
                {t('register')}
              </Button>
            </div>
          )}
        </nav>
      </div>

      {/* =======================================================
          AUTH DIALOG
      ======================================================== */}
      <AuthDialog
        locale={locale}
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDialogTab}
      />
    </header>
  );
}
