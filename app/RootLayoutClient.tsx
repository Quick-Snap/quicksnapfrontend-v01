'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import { AuthSessionProvider } from './components/providers/AuthSessionProvider';
import QueryProvider from '../providers/QueryProvider';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { ThemedToaster } from './components/ui/ThemedToaster';

const themeInitScript = `
(function(){
  try {
    var k = 'roopixo-theme';
    var t = localStorage.getItem(k);
    var root = document.documentElement;
    if (t === 'light') root.classList.remove('dark');
    else if (t === 'dark') root.classList.add('dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {}
})();
`;

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname?.startsWith('/reset-password');
  const isRegisterFace = pathname === '/register-face';
  const isDashboard = pathname === '/dashboard';

  return (
    <>
      <Script id="roopixo-theme-init" strategy="beforeInteractive">
        {themeInitScript}
      </Script>
      <QueryProvider>
        <AuthSessionProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-[0.35] dark:opacity-50" />

              <div className="relative min-h-screen">
                {!isLandingPage && !isAuthPage && <Navbar />}
                <main
                  className={
                    isLandingPage || isAuthPage || isRegisterFace
                      ? isRegisterFace
                        ? 'min-h-[100dvh] px-0 py-0'
                        : ''
                      : isDashboard
                        ? 'mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8'
                        : 'container mx-auto px-4 py-8'
                  }
                >
                  {children}
                </main>
              </div>
              <ThemedToaster />
            </ThemeProvider>
          </AuthProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </>
  );
}
