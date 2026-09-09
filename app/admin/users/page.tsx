'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { userListOptions } from '@/features/users/api/queries';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/features/users/api/mutations';
import { UserFormDialog } from '@/features/users/components/UserFormDialog';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import type { User, UserRole } from '@/features/users/types';

const ROLE_TONE: Record<UserRole, 'success' | 'neutral' | 'warning'> = {
  SUPER_ADMIN: 'success',
  ADMIN: 'neutral',
  OPERATOR: 'warning',
  CLIENT: 'neutral',
};

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * ✅ Şema doğrulandı (curl, 2026-09-05): POST/GET /users, GET/PATCH/DELETE
 * /users/{id}. Sadece SUPER_ADMIN'in erişebildiği varsayılıyor (useAuth().can
 * ROLE_ACTION_MAP'te 'user.manage'/'user.create' sadece SUPER_ADMIN'de) —
 * backend'in RolesGuard'ı zaten bunu asıl garanti eden yer.
 */
export default function AdminUsersPage() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { can } = useAuth();

  const [page] = useState(1);
  const { data, isLoading } = useQuery(userListOptions(storeId, page));

  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);

  const createUser = useCreateUserMutation(storeId);
  const updateUser = useUpdateUserMutation(storeId);
  const deleteUser = useDeleteUserMutation(storeId);

  const users = data?.items ?? [];
  const canManage = can('user.manage');

  function openCreate() {
    setEditingUser(null);
    setDialogMode('create');
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setDialogMode('edit');
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingUser(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteUser) return;
    await deleteUser.mutateAsync(pendingDeleteUser.id, {
      onSuccess: () => toast.success(`${pendingDeleteUser.fullName} was removed.`),
    });
    setPendingDeleteUser(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Staff & customers</h1>
          <p className="mt-1 text-sm text-ink-muted">{data?.meta.total ?? 0} accounts total</p>
        </div>
        {can('user.create') && (
          <Button onClick={openCreate}>
            <Plus size={16} /> New staff account
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable<User>
          isLoading={isLoading}
          rows={users}
          getRowId={(row) => row.id}
          emptyTitle="No users yet"
          emptyDescription="Staff accounts you create will show up here."
          emptyIcon={UsersIcon}
          columns={[
            {
              header: 'Name',
              cell: (row) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-xs font-semibold text-teal">
                    {initials(row.fullName)}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{row.fullName}</p>
                    <p className="text-xs text-ink-muted">{row.email}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Role',
              cell: (row) => <StatusBadge tone={ROLE_TONE[row.role]}>{row.role}</StatusBadge>,
            },
            {
              header: 'Status',
              cell: (row) => (
                <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                  {row.isActive ? 'Active' : 'Disabled'}
                </StatusBadge>
              ),
            },
            {
              header: '',
              className: 'text-right',
              cell: (row) =>
                canManage ? (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDeleteUser(row)}
                      aria-label="Delete"
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ) : null,
            },
          ]}
        />
      </div>

      <UserFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        initialUser={editingUser ?? undefined}
        isSubmitting={createUser.isPending || updateUser.isPending}
        onCancel={closeDialog}
        onSubmitCreate={(values) =>
          createUser.mutate(values, {
            onSuccess: () => {
              toast.success('Staff account created.');
              closeDialog();
            },
          })
        }
        onSubmitEdit={(values) => {
          if (!editingUser) return;
          updateUser.mutate(
            { userId: editingUser.id, input: values },
            {
              onSuccess: () => {
                toast.success('User updated.');
                closeDialog();
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={pendingDeleteUser !== null}
        title={`Delete ${pendingDeleteUser?.fullName ?? 'this user'}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteUser(null)}
      />
    </div>
  );
}
