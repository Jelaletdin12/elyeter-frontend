export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'CLIENT';

/**
 * ✅ DOĞRULANDI — gerçek backend response'u (POST/GET /users).
 */
export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserListResponse = {
  items: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/** CreateUserDto — email/password/fullName/role hepsi zorunlu. */
export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

/** UpdateUserDto — hepsi opsiyonel, sadece değişen alan gönderilir. */
export type UpdateUserInput = Partial<{
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}>;
