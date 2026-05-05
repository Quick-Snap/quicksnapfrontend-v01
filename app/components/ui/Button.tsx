import React from 'react';

import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40',
    secondary:
      'border border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
    ghost:
      'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white',
    destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20',
    outline:
      'border border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/20 dark:text-gray-300 dark:hover:border-white/30 dark:hover:bg-white/5 dark:hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
