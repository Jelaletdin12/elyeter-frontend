'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginMutation } from '../api/mutations';

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const login = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.push(`/${locale}`) });
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
        <p className="text-sm text-danger">
          {login.error instanceof Error ? login.error.message : 'Something went wrong.'}
        </p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full">
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
