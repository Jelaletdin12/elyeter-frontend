import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';

/**
 * FRONTEND_AGENTS.md #8: Bu guard SADECE UX içindir. Sadece bir cookie/flag'in
 * var olup olmadığına bakar, yanlış sayfaya yönlendirmeyi önler. Gerçek yetki
 * sınırı backend'deki @Roles()/RolesGuard'dır. Bu dosya asla tek güvenlik
 * katmanı olarak görülmez — burada bypass edilse bile her admin endpoint'i
 * backend'de zaten korunuyor.
 */

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';
const ADMIN_REFRESH_COOKIE_NAME = process.env.ADMIN_REFRESH_COOKIE_NAME ?? 'admin_refresh_token';

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isPrivateLocalePath(pathnameWithoutLocale: string): boolean {
  return (
    pathnameWithoutLocale.startsWith('/account') ||
    pathnameWithoutLocale.startsWith('/cart') ||
    pathnameWithoutLocale.startsWith('/checkout')
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin locale-prefix'li değil (route group dışında) — next-intl'e sokmadan
  // önce ayrı ele alınır. 🔴 Admin_refresh_token'a bakılır — REFRESH_COOKIE_NAME
  // (müşteri) DEĞİL. Bunlar karışırsa: sadece müşteri olarak giriş yapmış biri
  // admin guard'ını "session var" sanıp geçebilir, ya da tersine sadece admin'e
  // giriş yapmış biri "session yok" sanılıp /admin/login'e geri atılır.
  if (isAdminPath(pathname)) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const hasSessionFlag = request.cookies.has(ADMIN_REFRESH_COOKIE_NAME);
    if (!hasSessionFlag) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  const response = intlMiddleware(request);

  // Locale-prefixli private sayfalar (cart/checkout/account) için de aynı
  // UX-only kontrol — cookie yoksa login'e yönlendir, cookie backend'e karşı
  // burada DOĞRULANMAZ (bu iş silent-refresh route handler'ının işi).
  const segments = pathname.split('/').filter(Boolean);
  const pathWithoutLocale = '/' + segments.slice(1).join('/');

  if (isPrivateLocalePath(pathWithoutLocale) && !request.cookies.has(REFRESH_COOKIE_NAME)) {
    const locale = segments[0] ?? defaultLocale;
    // Giriş route'ları yok (AuthDialog'la değiştirildi) — ölü /login yerine
    // anasayfaya ?auth=login&redirect=… at; client'taki AuthDialogTrigger
    // bu parametreyi görüp dialog'u açar (bkz. ui-store.authDialogOpen).
    return NextResponse.redirect(
      new URL(`/${locale}?auth=login&redirect=${encodeURIComponent(pathname)}`, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
