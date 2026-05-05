'use client';

import { Space_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import { usePathname } from "next/navigation";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import { AuthSessionProvider } from "./components/providers/AuthSessionProvider";
import QueryProvider from "../providers/QueryProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { ThemedToaster } from "./components/ui/ThemedToaster";

const themeInitScript = `
(function(){
  try {
    var k = 'quicksnap-theme';
    var t = localStorage.getItem(k);
    var root = document.documentElement;
    if (t === 'light') root.classList.remove('dark');
    else if (t === 'dark') root.classList.add('dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) {}
})();
`;

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname?.startsWith('/reset-password');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <Script id="quicksnap-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <QueryProvider>
          <AuthSessionProvider>
          <AuthProvider>
            <ThemeProvider>
            {/* Background gradient mesh — softer on light */}
            <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-[0.35] dark:opacity-50" />

            <div className="relative min-h-screen">
              {!isLandingPage && !isAuthPage && <Navbar />}
              <main className={(isLandingPage || isAuthPage) ? "" : "container mx-auto px-4 py-8"}>
                {children}
              </main>
            </div>
            <ThemedToaster />
            </ThemeProvider>
          </AuthProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
