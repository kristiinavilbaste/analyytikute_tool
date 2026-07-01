import type { ReadinessStatus, Severity } from '../types';

const readinessStyles: Record<ReadinessStatus, string> = {
  'Not ready': 'bg-ng-red-soft text-ng-red ring-ng-red/20',
  'Needs clarification': 'bg-ng-orange-soft text-ng-orange ring-ng-orange/20',
  'Ready for refinement': 'bg-ng-yellow-soft text-ng-orange ring-ng-yellow/40',
  'Ready for development': 'bg-ng-green-soft text-ng-green ring-ng-green/20',
};

const readinessDot: Record<ReadinessStatus, string> = {
  'Not ready': 'bg-ng-red',
  'Needs clarification': 'bg-ng-orange',
  'Ready for refinement': 'bg-ng-yellow',
  'Ready for development': 'bg-ng-green',
};

const severityStyles: Record<Severity, string> = {
  Low: 'bg-ng-green-soft text-ng-green ring-ng-green/20',
  Medium: 'bg-ng-orange-soft text-ng-orange ring-ng-orange/20',
  High: 'bg-ng-red-soft text-ng-red ring-ng-red/20',
};

interface StatusBadgeProps {
  status: ReadinessStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${readinessStyles[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${readinessDot[status]}`} />
      {status}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  );
}
