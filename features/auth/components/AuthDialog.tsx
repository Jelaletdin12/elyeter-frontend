'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth-store';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthDialogProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog hangi sekmeyle açılsın — header'daki "Sign in" / "Register" ayrı tetikler */
  defaultTab?: 'login' | 'register';
}

export function AuthDialog({
  locale,
  open,
  onOpenChange,
  defaultTab = 'login',
}: AuthDialogProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // dialog her açıldığında istenen sekmeye resetle
  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  // login/register başarılı olup isAuthenticated true olduğunda dialog'u otomatik kapat
  useEffect(() => {
    if (isAuthenticated && open) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {tab === 'login' ? 'Sign in' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            {tab === 'login'
              ? 'Welcome back.'
              : 'Join to save your cart and track orders.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <LoginForm locale={locale} />
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <RegisterForm locale={locale} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}