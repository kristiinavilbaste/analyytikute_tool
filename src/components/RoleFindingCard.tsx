import type { RoleFinding } from '../types';
import { SeverityBadge } from './StatusBadge';

const roleMonograms: Record<string, string> = {
  'Business Analyst': 'BA',
  'System Analyst': 'SA',
  'QA Engineer': 'QA',
  'Solution Architect': 'AR',
  'Risk Officer': 'RO',
  'Product Owner': 'PO',
  Developer: 'DEV',
};

function RoleMonogram({ role }: { role: string }) {
  const monogram = roleMonograms[role] ?? role.slice(0, 2).toUpperCase();
  const isDev = monogram === 'DEV';

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ng-red-border bg-ng-red-soft font-bold uppercase text-ng-red"
      aria-hidden="true"
    >
      <span className={isDev ? 'text-[10px] tracking-tight' : 'text-xs tracking-wide'}>
        {monogram}
      </span>
    </div>
  );
}

interface RoleFindingCardProps {
  finding: RoleFinding;
  index?: number;
}

export function RoleFindingCard({ finding, index = 0 }: RoleFindingCardProps) {
  return (
    <div
      className="animate-fade-in rounded-2xl border border-ng-border bg-ng-bg p-5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-ng-border pb-3">
        <div className="flex items-center gap-3">
          <RoleMonogram role={finding.role} />
          <h3 className="font-bold text-ng-black">{finding.role}</h3>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>
      <ul className="space-y-2.5">
        {finding.findings.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ng-text">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ng-red" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
