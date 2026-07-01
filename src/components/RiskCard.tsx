import type { Risk } from '../types';
import { SeverityBadge } from './StatusBadge';

interface RiskCardProps {
  risk: Risk;
}

export function RiskCard({ risk }: RiskCardProps) {
  const isHigh = risk.severity === 'High';

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isHigh
          ? 'border-ng-red/20 bg-ng-red-soft'
          : 'border-ng-border bg-ng-bg'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-bold text-ng-black">{risk.title}</h3>
        <SeverityBadge severity={risk.severity} />
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-muted">Why it matters</p>
          <p className="mt-1 text-ng-text">{risk.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-muted">Impact</p>
          <p className="mt-1 text-ng-text">{risk.impact}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-muted">Mitigation</p>
          <p className="mt-1 text-ng-text">{risk.mitigation}</p>
        </div>
        <div className="rounded-lg border border-ng-border bg-ng-bg p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-red">Question to ask</p>
          <p className="mt-1 text-sm text-ng-dark">{risk.questionToAsk}</p>
        </div>
      </div>
    </div>
  );
}
