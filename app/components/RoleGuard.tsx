'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRole, UserRole } from '@/hooks/useRole';
import { ShieldAlert, ArrowRightLeft, Home, LayoutDashboard, Shield, LogIn } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

const roleDisplayNames: Record<string, string> = {
  admin: 'Admin',
  organizer: 'Organizer',
  photographer: 'Photographer',
  user: 'Guest',
  guest: 'Guest',
};

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user, loading: authLoading, switchRole } = useAuth();
  const { role: activeRole, roles, hasRole } = useRole();
  const router = useRouter();

  // 1. Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-600 dark:border-white/10 dark:border-t-violet-400" />
        </div>
        <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">Verifying permissions…</p>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white p-8 text-center shadow-2xl shadow-zinc-900/5 dark:border-white/10 dark:bg-[#12141f] dark:shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
            <LogIn size={26} />
          </div>
          <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Sign In Required
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            Authentication Required
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please log in to your Roopixo account to view this page.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500"
            >
              Log in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check account-level permission
  const hasAccountRole = allowedRoles.some((r) => hasRole(r));

  // Case A: User does NOT have the required role at all (e.g. Admin or Guest trying to open Organizer)
  if (!hasAccountRole) {
    if (fallback) return <>{fallback}</>;

    const requiredNames = allowedRoles.map((r) => roleDisplayNames[r] || r).join(' or ');
    const userRoleNames = roles.map((r) => roleDisplayNames[r] || r).join(', ');

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-zinc-200/90 bg-white p-8 text-center shadow-2xl shadow-zinc-900/5 dark:border-white/10 dark:bg-[#12141f] dark:shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <ShieldAlert size={28} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
            <span>404 • Access Denied</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Access Restricted
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You do not have permission to access this section. This area requires an{' '}
            <span className="font-semibold text-zinc-900 dark:text-white">{requiredNames}</span> account.
          </p>

          <div className="mt-5 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3.5 text-left text-xs dark:border-white/5 dark:bg-white/[0.03]">
            <p className="text-zinc-500 dark:text-zinc-400">
              Signed in as: <span className="font-medium text-zinc-900 dark:text-zinc-200">{user.email}</span>
            </p>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Account roles: <span className="font-medium text-violet-600 dark:text-violet-400">{userRoleNames}</span>
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500"
            >
              <LayoutDashboard size={16} />
              <span>Back to Dashboard</span>
            </Link>
            {hasRole('admin') && (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                <Shield size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <Home size={16} />
              <span>Explore Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case B: User HAS the role, but their ACTIVE role is currently mismatched
  // (e.g. Organizer viewing as Guest or Admin)
  const isActiveRoleAllowed = allowedRoles.includes(activeRole);
  if (!isActiveRoleAllowed) {
    if (fallback) return <>{fallback}</>;

    const targetRole = allowedRoles.find((r) => hasRole(r)) || allowedRoles[0];
    const targetRoleName = roleDisplayNames[targetRole] || targetRole;
    const activeRoleName = roleDisplayNames[activeRole] || activeRole;

    const handleSwitchRole = () => {
      if (switchRole) {
        switchRole(targetRole);
      } else {
        localStorage.setItem('activeRole', targetRole);
        window.location.reload();
      }
    };

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/80 p-8 text-center shadow-2xl shadow-violet-500/10 dark:border-violet-500/20 dark:from-[#17132a] dark:via-[#100e1f] dark:to-[#0c1022] dark:shadow-black/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
            <ArrowRightLeft size={24} />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <span>Role Switch Required</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Switch to {targetRoleName} Mode
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You have <span className="font-semibold text-zinc-900 dark:text-white">{targetRoleName}</span> access, but you are currently browsing Roopixo in{' '}
            <span className="font-semibold text-violet-600 dark:text-violet-400">{activeRoleName}</span> mode.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            To view your {targetRoleName.toLowerCase()} events and keep your navigation unified, please switch your active role.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleSwitchRole}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500"
            >
              <ArrowRightLeft size={16} />
              <span>Switch to {targetRoleName} View</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <span>Back to {activeRoleName} Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case C: Authorized and viewing in matching active role
  return <>{children}</>;
}
