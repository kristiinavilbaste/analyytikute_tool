import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { HandoffSection, BulletList } from '../components/HandoffSection';
import type { HandoffBadge } from '../components/HandoffSection';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';
import { handoffToMarkdown } from '../utils/handoffToMarkdown';

const SECTION_BADGES: Record<string, HandoffBadge[]> = {
  'Feature Summary': ['ai-assumption'],
  Scope: ['ai-assumption'],
  'Out of Scope': ['ai-assumption'],
  'User Roles': ['needs-clarification'],
  'Functional Requirements': ['ai-assumption'],
  'Non-Functional Requirements': ['needs-clarification', 'ai-assumption'],
  'Business Rules': ['needs-clarification'],
  'Data & Integrations': ['needs-clarification'],
  'User Stories': ['ai-assumption'],
  'Acceptance Criteria': ['needs-clarification'],
  'Edge Cases': ['ai-assumption'],
  Risks: ['needs-clarification'],
  'Open Questions': ['needs-clarification'],
  'Technical Notes': ['ai-assumption'],
};

export function HandoffPage() {
  const { handoffPack, reviewResult, generateHandoff, isHandoffLoading } = useApp();

  useEffect(() => {
    if (reviewResult && !handoffPack && !isHandoffLoading) {
      generateHandoff();
    }
  }, [reviewResult, handoffPack, isHandoffLoading, generateHandoff]);

  if (!reviewResult) {
    return (
      <EmptyState message="Run the Review Board first to generate a developer handoff pack." />
    );
  }

  if (!handoffPack) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-ng-red" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm text-ng-muted">Generating handoff pack...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Developer Handoff Pack"
          subtitle="Structured refinement-ready input for the development team"
          align="left"
        />
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <CopyButton text={handoffToMarkdown(handoffPack)} label="Copy Markdown" variant="secondary" />
          <Link to="/review" className="btn-neutral">
            Back to Review Overview
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-ng-orange/30 bg-ng-orange-soft px-4 py-3 text-sm text-ng-dark">
        This pack is refinement-ready input based on the analysis and review findings — not final
        development documentation. Sections marked with badges may need stakeholder validation.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HandoffSection title="Feature Summary" variant="highlight" badges={SECTION_BADGES['Feature Summary']}>
          <p className="text-sm leading-relaxed text-ng-text">{handoffPack.featureSummary}</p>
        </HandoffSection>

        <HandoffSection title="Business Goal">
          <p className="text-sm leading-relaxed text-ng-text">{handoffPack.businessGoal}</p>
        </HandoffSection>

        <HandoffSection title="Scope" badges={SECTION_BADGES.Scope}>
          <BulletList items={handoffPack.scope} />
        </HandoffSection>

        <HandoffSection title="Out of Scope" badges={SECTION_BADGES['Out of Scope']}>
          <BulletList items={handoffPack.outOfScope} />
        </HandoffSection>

        <HandoffSection title="User Roles" badges={SECTION_BADGES['User Roles']}>
          <BulletList items={handoffPack.userRoles} />
        </HandoffSection>

        <HandoffSection title="Functional Requirements" badges={SECTION_BADGES['Functional Requirements']}>
          <BulletList items={handoffPack.functionalRequirements} />
        </HandoffSection>

        <HandoffSection title="Non-Functional Requirements" badges={SECTION_BADGES['Non-Functional Requirements']}>
          <BulletList items={handoffPack.nonFunctionalRequirements} />
        </HandoffSection>

        <HandoffSection title="Business Rules" badges={SECTION_BADGES['Business Rules']}>
          <BulletList items={handoffPack.businessRules} />
        </HandoffSection>

        <HandoffSection title="Data & Integrations" badges={SECTION_BADGES['Data & Integrations']}>
          <BulletList items={handoffPack.dataAndIntegrations} />
        </HandoffSection>

        <HandoffSection title="User Stories" badges={SECTION_BADGES['User Stories']}>
          <BulletList items={handoffPack.userStories} />
        </HandoffSection>

        <HandoffSection title="Acceptance Criteria" badges={SECTION_BADGES['Acceptance Criteria']}>
          <BulletList items={handoffPack.acceptanceCriteria} />
        </HandoffSection>

        <HandoffSection title="Edge Cases" badges={SECTION_BADGES['Edge Cases']}>
          <BulletList items={handoffPack.edgeCases} />
        </HandoffSection>

        <HandoffSection title="Risks" variant="warning" badges={SECTION_BADGES.Risks}>
          <BulletList items={handoffPack.risks} />
        </HandoffSection>

        <HandoffSection title="Open Questions" variant="warning" badges={SECTION_BADGES['Open Questions']}>
          <BulletList items={handoffPack.openQuestions} />
        </HandoffSection>

        <HandoffSection title="Technical Notes" badges={SECTION_BADGES['Technical Notes']}>
          <BulletList items={handoffPack.technicalNotes} />
        </HandoffSection>
      </div>

      <div className="rounded-2xl border border-ng-red/20 bg-ng-red-soft p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ng-black">
          <span className="ng-asterisk text-xs">*</span>
          Recommendation for Refinement
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ng-text">
          {handoffPack.recommendationForRefinement}
        </p>
      </div>
    </div>
  );
}
