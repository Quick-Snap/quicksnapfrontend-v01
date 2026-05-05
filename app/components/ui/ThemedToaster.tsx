'use client';

import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/stores/appStore';

export function ThemedToaster() {
  const theme = useAppStore((s) => s.ui.theme);
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: isDark
          ? {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            }
          : {
              background: '#ffffff',
              color: '#18181b',
              border: '1px solid rgba(24,24,27,0.08)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.12)',
            },
        success: {
          iconTheme: {
            primary: '#8b5cf6',
            secondary: isDark ? '#fff' : '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#fff' : '#fff',
          },
        },
      }}
    />
  );
}
