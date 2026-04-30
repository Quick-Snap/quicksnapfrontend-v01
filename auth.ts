import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { exchangeGoogleIdToken } from '@/lib/auth/backend-google';
import { BackendAuthError } from '@/lib/auth/errors';
import type { UserRole } from '@/types';

const normalizeRole = (role: string): UserRole => {
  if (role === 'student' || role === 'guest') return 'user';
  return role as UserRole;
};

function mapBackendUser(
  u: Record<string, unknown>
): {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: UserRole[];
} {
  const rolesRaw = (u.roles as string[] | undefined) || [String(u.role || 'user')];
  return {
    id: String(u._id ?? u.id ?? ''),
    email: String(u.email ?? ''),
    name: String(u.name ?? ''),
    image: (u.avatar as string | undefined) || (u.image as string | undefined),
    roles: rolesRaw.map((r) => normalizeRole(r)),
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'google') {
        const idToken = account.id_token;
        if (!idToken) {
          throw new BackendAuthError(
            'Google did not return an ID token. Please try signing in again.'
          );
        }
        try {
          const data = await exchangeGoogleIdToken(idToken);
          token.accessToken = data.token;
          token.backendUser = data.user;
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : 'Could not reach our sign-in service. Please try again later.';
          throw new BackendAuthError(message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.error) {
        session.error = token.error as string;
      }
      const bu = token.backendUser as Record<string, unknown> | undefined;
      if (bu && session.user) {
        const mapped = mapBackendUser(bu);
        session.user.id = mapped.id;
        if (mapped.email) session.user.email = mapped.email;
        if (mapped.name) session.user.name = mapped.name;
        if (mapped.image) session.user.image = mapped.image;
        session.user.roles = mapped.roles;
      }
      return session;
    },
  },
});
