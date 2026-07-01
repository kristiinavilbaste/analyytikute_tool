import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { TextScoreDisplay } from '../components/ScoreCard';
import { PageHeader } from '../components/PageHeader';
import type { QualityCategory } from '../types';

function CategoryScoreBar({ score }: { score: number }) {
  const color =
    score >= 7 ? 'bg-ng-green' : score >= 5 ? 'bg-ng-orange' : 'bg-ng-red';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ng-bg-soft">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`w-12 text-right text-sm font-bold tabular-nums ${score < 5 ? 'text-ng-red' : 'text-ng-black'}`}>
        {score}/10
      </span>
    </div>
  );
}

function QualityCategoryCard({ category }: { category: QualityCategory }) {
  return (
    <div className="rounded-2xl border border-ng-border bg-ng-bg p-5">
      <h3 className="font-bold text-ng-black">{category.name}</h3>
      <div className="mt-3">
        <CategoryScoreBar score={category.score} />
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-muted">Rationale</p>
          <p className="mt-1 text-ng-text">{category.rationale}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-red">Main gap</p>
          <p className="mt-1 text-ng-text">{category.mainGap}</p>
        </div>
        <div className="rounded-lg bg-ng-bg-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ng-green">Recommendation</p>
          <p className="mt-1 text-ng-dark">{category.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

export function QualityGatePage() {
  const { reviewResult } = useApp();

  if (!reviewResult) {
    return (
      <EmptyState message="Run the Review Board first to see the quality breakdown." />
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Quality Gate"
        subtitle="Detailed scoring breakdown across 10 categories"
      />

      <div className="ng-card flex flex-col items-center gap-6 p-8">
        <TextScoreDisplay score={reviewResult.qualityScore} />
        <StatusBadge status={reviewResult.readinessStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reviewResult.qualityCategories.map((category) => (
          <QualityCategoryCard key={category.id} category={category} />
        ))}
      </div>

      <div className="border-t border-ng-border pt-6">
        <Link to="/review" className="btn-neutral">
          ← Back to Review Overview
        </Link>
      </div>
    </div>
  );
}
