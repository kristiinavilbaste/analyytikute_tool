import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { RiskCard } from '../components/RiskCard';
import { SeverityBadge } from '../components/StatusBadge';
import { PageHeader, SectionTitle } from '../components/PageHeader';

export function RiskRadarPage() {
  const { reviewResult } = useApp();

  if (!reviewResult) {
    return (
      <EmptyState message="Run the Review Board first to see risks and assumptions." />
    );
  }

  const { topRisks, hiddenAssumptions, criticalQuestions } = reviewResult;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Risk Radar"
        subtitle="Risks, hidden assumptions, and critical questions"
      />

      <section>
        <SectionTitle className="mb-4 text-lg">Top Risks</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {topRisks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle className="mb-4 text-lg">Hidden Assumptions</SectionTitle>
        <div className="rounded-2xl border border-ng-border bg-ng-bg-soft p-6">
          <ul className="space-y-3">
            {hiddenAssumptions.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm text-ng-text">
                <span className="font-bold text-ng-red">→</span>
                {a.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionTitle className="mb-4 text-lg">Critical Questions</SectionTitle>
        <div className="space-y-3">
          {criticalQuestions.map((q) => (
            <div
              key={q.id}
              className="flex items-start gap-3 rounded-2xl border border-ng-border bg-ng-yellow-soft p-5"
            >
              <SeverityBadge severity={q.priority} />
              <p className="text-sm leading-relaxed text-ng-text">{q.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-ng-border pt-6">
        <Link to="/review" className="btn-neutral">
          ← Back to Review Overview
        </Link>
      </div>
    </div>
  );
}
