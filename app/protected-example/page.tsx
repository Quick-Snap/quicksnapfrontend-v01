import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * Example of a server-protected route (App Router). For this project, the
 * v4/v5-style `getServerSession` API is `auth()` from `@/auth`.
 */
export default async function ProtectedExamplePage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect('/login?callbackUrl=/protected-example');
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 text-white/90">
      <h1 className="text-2xl font-light tracking-wide">Protected example</h1>
      <p className="text-white/60 text-sm">
        This page uses{' '}
        <code className="text-violet-400/90">await auth()</code> (Auth.js / NextAuth v5) on
        the server. Middleware also guards{' '}
        <code className="text-violet-400/90">/protected-example</code>.
      </p>
      <dl className="space-y-2 text-sm border border-white/10 rounded-lg p-4 bg-white/5">
        <div>
          <dt className="text-white/40">Email</dt>
          <dd>{session.user?.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-white/40">Name</dt>
          <dd>{session.user?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-white/40">Backend JWT</dt>
          <dd className="truncate font-mono text-xs text-white/50">
            {session.accessToken.slice(0, 24)}…
          </dd>
        </div>
      </dl>
      <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}
