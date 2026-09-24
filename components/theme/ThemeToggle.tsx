'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/theme-context';
import { Moon, Sun } from 'lucide-react';

/**
 * useTheme() theme-context'ten (kullanıcıya özel tema — next-themes değil).
 * `mounted` kontrolü şart — provider server'da hangi temanın aktif olduğunu
 * bilemez (localStorage server'da yok), bu yüzden ilk render'da hep aynı
 * ikonu göstermek hydration mismatch'e yol açar.
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
      className={variant === 'dark' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'}
    >
      {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
    </button>
  );
}
