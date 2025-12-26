'use client';

import { Space_Grotesk, Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import QueryProvider from "../providers/QueryProvider";

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
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans bg-[#0a0a0a] text-white antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {/* Background gradient mesh */}
            <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-50" />
            
            <div className="relative min-h-screen">
              {!isLandingPage && !isAuthPage && <Navbar />}
              <main className={(isLandingPage || isAuthPage) ? "" : "container mx-auto px-4 py-8"}>
                {children}
              </main>
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#8b5cf6',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
