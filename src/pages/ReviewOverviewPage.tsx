import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { RoleFindingCard } from '../components/RoleFindingCard';
import { PageHeader, SectionTitle, RedAccentLine } from '../components/PageHeader';
import type { ReviewResult } from '../types';

function MetricCard({
  label,
  children,
  accent,
}: {
  label: string;
  children: ReactNode;
  accent?: 'red' | 'default';
}) {
  return (
    <div className="rounded-2xl border border-ng-border bg-ng-bg px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ng-muted">{label}</p>
      <div className={`mt-1 ${accent === 'red' ? 'text-ng-red' : 'text-ng-black'}`}>{children}</div>
    </div>
  );
}

function MetricsRow({ result }: { result: ReviewResult }) {
  const highRiskCount = result.topRisks.filter((r) => r.severity === 'High').length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard label="Quality Score" accent="red">
        <p className="text-2xl font-bold tabular-nums">
          {result.qualityScore}
          <span className="text-sm font-semibold text-ng-muted">/100</span>
        </p>
      </MetricCard>
      <MetricCard label="Readiness Status">
        <StatusBadge status={result.readinessStatus} />
      </MetricCard>
      <MetricCard label="High Risks" accent="red">
        <p className="text-2xl font-bold tabular-nums">{highRiskCount}</p>
      </MetricCard>
      <MetricCard label="Open Questions">
        <p className="text-2xl font-bold tabular-nums">{result.criticalQuestions.length}</p>
      </MetricCard>
      <MetricCard label="Hidden Assumptions">
        <p className="text-2xl font-bold tabular-nums">{result.hiddenAssumptions.length}</p>
      </MetricCard>
    </div>
  );
}

export function ReviewOverviewPage() {
  const { reviewResult } = useApp();

  if (!reviewResult) {
    return <EmptyState message="No review has been generated yet." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review Overview"
        subtitle="Executive summary and review board findings"
      />

      <MetricsRow result={reviewResult} />

      <div className="ng-card p-6">
        <RedAccentLine />
        <SectionTitle className="text-base">Executive Summary</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-ng-text">{reviewResult.executiveSummary}</p>
      </div>

      <div>
        <SectionTitle className="mb-4 text-lg">Review Board Findings</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {reviewResult.roleFindings.map((finding, i) => (
            <RoleFindingCard key={finding.role} finding={finding} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
