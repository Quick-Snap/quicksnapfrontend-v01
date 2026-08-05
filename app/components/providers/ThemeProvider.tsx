'use client';

import { useLayoutEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';

const STORAGE_KEY = 'roopixo-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.ui.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    }
    setHydrated(true);
  }, [setTheme]);

  useLayoutEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hydrated]);

  return <>{children}</>;
}
