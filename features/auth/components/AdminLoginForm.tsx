'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminLoginMutation, useAdminLogoutMutation } from '../api/mutations';

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']);

/**
 * Backend login endpoint'i CLIENT/ADMIN/OPERATOR/SUPER_ADMIN ayırt etmeden
 * herkesi login ediyor — "bu admin girişi mi" ayrımı backend'de değil,
 * burada frontend'de yapılıyor: login başarılı olsa bile role staff değilse
 * hemen logout edip hata gösteriyoruz. Gerçek yetki sınırı yine backend'deki
 * @Roles()/RolesGuard'dır (bkz. FRONTEND_AGENTS.md #8).
 */
export function AdminLoginForm() {
  const router = useRouter();
  const login = useAdminLoginMutation();
  const logout = useAdminLogoutMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rejectedMessage, setRejectedMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRejectedMessage(null);

    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (!STAFF_ROLES.has(data.user.role)) {
            logout.mutate();
            setRejectedMessage('This account does not have access to the admin panel.');
            return;
          }
          router.push('/admin');
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

      {(rejectedMessage || login.isError) && (
        <p className="text-destructive text-sm">
          {rejectedMessage ??
            (login.error instanceof Error ? login.error.message : 'Something went wrong.')}
        </p>
      )}

      <Button
        type="submit"
        disabled={login.isPending}
        className="bg-sidebar-primary hover:bg-sidebar-primary-light w-full text-white"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
