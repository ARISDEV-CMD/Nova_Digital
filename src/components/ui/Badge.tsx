import type { HTMLAttributes, ReactNode } from 'react';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-[#464554] bg-[#262a33] text-[#dfe2ee]',
  accent: 'border-[#8083ff]/30 bg-[#8083ff]/10 text-[#c0c1ff]',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  danger: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
};

export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium leading-none ${toneClasses[tone]} ${className}`} {...props}>
      {children}
    </span>
  );
}
