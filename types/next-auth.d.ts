import type { UserRole } from '@/types';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: DefaultSession['user'] & {
      id?: string;
      roles?: UserRole[];
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    backendUser?: Record<string, unknown>;
    error?: string;
  }
}
