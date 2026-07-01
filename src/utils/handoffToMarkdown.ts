import type { HandoffPack } from '../types';

export function handoffToMarkdown(pack: HandoffPack): string {
  const section = (title: string, items: string[]) =>
    `## ${title}\n\n${items.map((i) => `- ${i}`).join('\n')}`;

  return [
    '# Developer Handoff Pack',
    '',
    '## Feature Summary',
    '',
    pack.featureSummary,
    '',
    '## Business Goal',
    '',
    pack.businessGoal,
    '',
    section('Scope', pack.scope),
    '',
    section('Out of Scope', pack.outOfScope),
    '',
    section('User Roles', pack.userRoles),
    '',
    section('Functional Requirements', pack.functionalRequirements),
    '',
    section('Non-Functional Requirements', pack.nonFunctionalRequirements),
    '',
    section('Business Rules', pack.businessRules),
    '',
    section('Data & Integrations', pack.dataAndIntegrations),
    '',
    section('User Stories', pack.userStories),
    '',
    section('Acceptance Criteria', pack.acceptanceCriteria),
    '',
    section('Edge Cases', pack.edgeCases),
    '',
    section('Risks', pack.risks),
    '',
    section('Open Questions', pack.openQuestions),
    '',
    section('Technical Notes', pack.technicalNotes),
    '',
    '## Recommendation for Refinement',
    '',
    pack.recommendationForRefinement,
  ].join('\n');
}
