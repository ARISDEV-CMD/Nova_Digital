import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({ label, children, className = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-[#c7c4d7] transition-colors duration-200 hover:bg-[#262a33] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cd7f6] disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
