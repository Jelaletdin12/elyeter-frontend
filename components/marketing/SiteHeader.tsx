'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useLogoutMutation } from '@/features/auth/api/mutations';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/**
 * Nav bar — koyu çam yeşili zemin. Auth durumuna göre sağ üstte
 * Login/Register (misafir) ya da kullanıcı adı + Logout (giriş yapılmış)
 * gösterir. isHydrating true iken hiçbir şey göstermiyoruz — sayfa
 * yenilendiğinde AuthHydrator silent-refresh'i bitirmeden "Login" yazıp
 * sonra "Hoş geldin X" diye değişmesin diye (flash of wrong state).
 */
export function SiteHeader({ locale }: { locale: string }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const logout = useLogoutMutation();

  return (
    <header className="bg-teal text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={`/${locale}`} className="font-display text-xl italic">
          Bazaar
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <ThemeToggle variant="dark" />
          <Link href={`/${locale}/wishlist`} aria-label="Wishlist">
            <Heart size={20} strokeWidth={1.75} />
          </Link>
          <Link href={`/${locale}/cart`} aria-label="Cart">
            <ShoppingBag size={20} strokeWidth={1.75} />
          </Link>

          {isHydrating ? null : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-white/80">{user?.fullName}</span>
              <button
                type="button"
                onClick={() => logout.mutate()}
                aria-label="Sign out"
                className="text-white/80 hover:text-white"
              >
                <LogOut size={18} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/login`} className="text-white/80 hover:text-white">
                Sign in
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-card bg-saffron px-3 py-1.5 font-medium text-ink"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
