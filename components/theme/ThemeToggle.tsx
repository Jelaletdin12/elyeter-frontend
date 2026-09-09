'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

/**
 * useTheme() next-themes'ten. `mounted` kontrolü şart — next-themes server'da
 * hangi temanın aktif olduğunu bilemez (localStorage server'da yok), bu yüzden
 * ilk render'da hep aynı ikonu göstermek hydration mismatch'e yol açar.
 */
export function ThemeToggle({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="inline-block h-5 w-5" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-ink-muted hover:text-ink'}
    >
      {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
    </button>
  );
}
