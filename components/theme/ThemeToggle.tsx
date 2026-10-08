'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/theme-context';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * useTheme() theme-context'ten (kullanıcıya özel tema — next-themes değil).
 * `mounted` kontrolü şart — provider server'da hangi temanın aktif olduğunu
 * bilemez (localStorage server'da yok), bu yüzden ilk render'da hep aynı
 * ikonu göstermek hydration mismatch'e yol açar.
 *
 * variant:
 *  - 'light' / 'dark': eski düz ikon stilleri (login sayfası vb. için, değişmedi)
 *  - 'ghost': admin header — 32x32 hover:bg-accent buton
 */
export function ThemeToggle({ variant = 'light' }: { variant?: 'light' | 'dark' | 'ghost' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isGhost = variant === 'ghost';

  if (!mounted) {
    return <span className={cn('inline-block', isGhost ? 'h-8 w-8' : 'h-5 w-5')} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        variant === 'dark' && 'text-primary hover:text-primary/80',
        variant === 'light' && 'text-muted-foreground hover:text-foreground',
        isGhost &&
          'text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
      )}
    >
      {isDark ? (
        <Sun size={isGhost ? 15 : 18} strokeWidth={1.75} />
      ) : (
        <Moon size={isGhost ? 15 : 18} strokeWidth={1.75} />
      )}
    </button>
  );
}
