import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-md bg-[#262a33] motion-safe:animate-pulse ${className}`} />;
}

export function SkeletonStatus({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function PageSkeleton({ label = 'Chargement de la page' }: { label?: string }) {
  return (
    <SkeletonStatus label={label} className="mx-auto max-w-7xl space-y-7 px-4 py-8 lg:px-6">
      <div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-4 w-full max-w-2xl" /></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="space-y-4 rounded-xl border border-[#262a33] bg-[#181c24] p-5"><Skeleton className="h-6 w-36" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-4 h-12 w-52 rounded-lg" /></div>
        <Skeleton className="aspect-[16/10] rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
    </SkeletonStatus>
  );
}

export function ProductCardSkeleton({ compact = false, horizontal = false }: { compact?: boolean; horizontal?: boolean }) {
  return (
    <article aria-hidden="true" className={`overflow-hidden rounded-lg border border-[#31353e]/70 bg-[#181c24] ${horizontal ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
      <Skeleton className={`w-full shrink-0 ${horizontal ? 'aspect-video sm:aspect-auto sm:w-56' : compact ? 'aspect-[16/8]' : 'aspect-[16/9]'}`} />
      <div className={`flex min-w-0 flex-1 flex-col justify-between ${compact ? 'gap-3 p-3' : 'gap-4 p-4'}`}>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-5 w-4/5" />
          <div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#31353e] pt-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8, compact = false, horizontal = false }: { count?: number; compact?: boolean; horizontal?: boolean }) {
  return (
    <SkeletonStatus label="Chargement des formations" className={horizontal ? 'flex flex-col gap-4' : `grid grid-cols-1 gap-5 ${compact ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
      {Array.from({ length: count }, (_, index) => <ProductCardSkeleton key={index} compact={compact} horizontal={horizontal} />)}
    </SkeletonStatus>
  );
}

export function LearningCardSkeleton() {
  return (
    <article aria-hidden="true" className="overflow-hidden rounded-xl border border-[#262a33] bg-[#181c24]">
      <Skeleton className="aspect-[16/8] rounded-none bg-[#10141d]" />
      <div className="space-y-4 p-4">
        <div className="space-y-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-3 w-2/5" /></div>
        <div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-2 w-2/3" /></div>
        <div className="space-y-2 rounded-lg border border-[#31353e] bg-[#10141d] p-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /></div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </article>
  );
}
