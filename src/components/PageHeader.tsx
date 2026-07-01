import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  align = 'center',
}: {
  title: string;
  subtitle: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <h2 className="text-2xl font-bold tracking-tight text-ng-black">{title}</h2>
      <p className="mt-2 text-ng-muted">{subtitle}</p>
    </div>
  );
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`ng-section-title ${className}`}>
      <span className="ng-asterisk" aria-hidden="true">*</span>
      {children}
    </h3>
  );
}

export function RedAccentLine() {
  return <div className="mb-3 h-0.5 w-8 rounded-full bg-ng-red" aria-hidden="true" />;
}
