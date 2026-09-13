'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { User, UserRole } from '../types';

const ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'CLIENT'];

type UserFormValues = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

type UserFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialUser?: User;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (values: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) => void;
  onSubmitEdit: (values: {
    email?: string;
    fullName?: string;
    role?: UserRole;
    isActive?: boolean;
  }) => void;
};

const emptyForm: UserFormValues = {
  email: '',
  password: '',
  fullName: '',
  role: 'OPERATOR',
  isActive: true,
};

export function UserFormDialog({
  open,
  mode,
  initialUser,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserFormValues>(emptyForm);

  useEffect(() => {
    if (mode === 'edit' && initialUser) {
      setForm({
        email: initialUser.email,
        password: '',
        fullName: initialUser.fullName,
        role: initialUser.role,
        isActive: initialUser.isActive,
      });
    } else {
      setForm(emptyForm);
    }
  }, [mode, initialUser, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'create') {
      onSubmitCreate({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
      });
    } else {
      onSubmitEdit({
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        isActive: form.isActive,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New staff account' : 'Edit user'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select value={form.role} onValueChange={(value) => setForm((f) => ({ ...f, role: value as UserRole }))}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Active
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
