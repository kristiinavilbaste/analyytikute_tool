import type { ReactNode } from 'react';

export type HandoffBadge = 'needs-clarification' | 'ai-assumption';

const badgeStyles: Record<HandoffBadge, string> = {
  'needs-clarification': 'bg-ng-orange-soft text-ng-orange ring-ng-orange/20',
  'ai-assumption': 'bg-ng-bg-soft text-ng-muted ring-ng-border',
};

const badgeLabels: Record<HandoffBadge, string> = {
  'needs-clarification': 'Needs clarification',
  'ai-assumption': 'AI assumption',
};

export function HandoffBadge({ type }: { type: HandoffBadge }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeStyles[type]}`}
    >
      {badgeLabels[type]}
    </span>
  );
}

interface HandoffSectionProps {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
  badges?: HandoffBadge[];
}

export function HandoffSection({ title, children, variant = 'default', badges = [] }: HandoffSectionProps) {
  const bg =
    variant === 'highlight'
      ? 'bg-ng-red-soft border-ng-red/15'
      : variant === 'warning'
        ? 'bg-ng-orange-soft/80 border-ng-orange/20'
        : 'bg-ng-bg border-ng-border';

  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ng-black">
          <span className="ng-asterisk text-xs">*</span>
          {title}
        </h3>
        {badges.map((badge) => (
          <HandoffBadge key={badge} type={badge} />
        ))}
      </div>
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-ng-text">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ng-red/60" />
          {item}
        </li>
      ))}
    </ul>
  );
}
