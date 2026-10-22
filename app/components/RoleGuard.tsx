'use client';

import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/hooks/useRole';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { role, hasRole } = useRole();

  const isAllowed = Boolean(role && (allowedRoles.includes(role) || allowedRoles.some((r) => hasRole(r))));

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

