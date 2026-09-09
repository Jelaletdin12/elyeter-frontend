'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterMutation } from '../api/mutations';

export function RegisterForm({ locale }: { locale: string }) {
  const router = useRouter();
  const register = useRegisterMutation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate({ fullName, email, password }, { onSuccess: () => router.push(`/${locale}`) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-ink-muted">At least 8 characters.</p>
      </div>

      {register.isError && (
        <p className="text-sm text-danger">
          {register.error instanceof Error ? register.error.message : 'Something went wrong.'}
        </p>
      )}

      <Button type="submit" disabled={register.isPending} className="w-full">
        {register.isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
