import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-phosphor text-ink-950 hover:bg-phosphor-bright disabled:bg-ink-700 disabled:text-paper-500',
  secondary: 'bg-ink-800 text-paper-100 border border-ink-600 hover:bg-ink-700 disabled:opacity-40',
  ghost: 'bg-transparent text-paper-300 hover:bg-ink-800 hover:text-paper-100 disabled:opacity-30',
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10 disabled:opacity-30',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
};

export function Button({ variant = 'secondary', size = 'md', icon, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}