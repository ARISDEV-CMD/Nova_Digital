import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, eyebrow, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-2xl space-y-2">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4cd7f6]">{eyebrow}</p>}
        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {description && <p className="text-sm leading-6 text-[#c7c4d7]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
