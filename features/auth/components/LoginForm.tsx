'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiStore } from '@/stores/ui-store';
import { useLoginMutation } from '../api/mutations';

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const login = useLoginMutation();
  const authRedirect = useUiStore((s) => s.authRedirect);
  const setAuthRedirect = useUiStore((s) => s.setAuthRedirect);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          // Giriş bekleyen hedef varsa (middleware ?redirect=), oraya gider;
          // yoksa header davranışı korunur (restore edilen bilgiler, anasayfa).
          const target = authRedirect ?? `/${locale}`;
          setAuthRedirect(null);
          router.push(target);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {login.isError && (
        <p className="text-destructive text-sm">
          {login.error instanceof Error ? login.error.message : 'Something went wrong.'}
        </p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full">
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
