interface CompactUserStory {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
}

export interface CompactHandoffResponse {
  handoffSummary?: string;
  scope?: string[];
  outOfScope?: string[];
  userStories?: CompactUserStory[];
  apiAndIntegrationNotes?: string[];
  dataNotes?: string[];
  openQuestions?: string[];
  developerRisks?: string[];
  testingNotes?: string[];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, max);
}

export function mapCompactHandoffToPack(compact: CompactHandoffResponse) {
  const handoffSummary = asString(
    compact.handoffSummary,
    'Handoff summary was not provided by the AI response.',
  );

  const scope = asStringArray(compact.scope, 5);
  const outOfScope = asStringArray(compact.outOfScope, 5);
  const apiNotes = asStringArray(compact.apiAndIntegrationNotes, 5);
  const dataNotes = asStringArray(compact.dataNotes, 5);
  const openQuestions = asStringArray(compact.openQuestions, 5);
  const developerRisks = asStringArray(compact.developerRisks, 5);
  const testingNotes = asStringArray(compact.testingNotes, 5);

  const stories = (compact.userStories ?? []).slice(0, 5);
  const userStories = stories.map((story) => {
    const title = asString(story.title, 'User story');
    const description = asString(story.description);
    const criteria = asStringArray(story.acceptanceCriteria, 5);

    if (description && criteria.length > 0) {
      return `${title}: ${description} (Acceptance: ${criteria.join('; ')})`;
    }
    if (description) {
      return `${title}: ${description}`;
    }
    return title;
  });

  const acceptanceCriteria = stories.flatMap((story) =>
    asStringArray(story.acceptanceCriteria, 5),
  );

  const functionalRequirements = stories.map((story) => {
    const title = asString(story.title, 'Requirement');
    const description = asString(story.description);
    return description ? `${title}: ${description}` : title;
  });

  const dataAndIntegrations = [...dataNotes, ...apiNotes];
  const technicalNotes = [...apiNotes, ...dataNotes, ...testingNotes];

  return {
    featureSummary: handoffSummary,
    businessGoal: handoffSummary,
    scope,
    outOfScope,
    userRoles: ['Confirm user roles with stakeholders before development.'],
    functionalRequirements:
      functionalRequirements.length > 0
        ? functionalRequirements
        : ['Define functional requirements during refinement.'],
    nonFunctionalRequirements:
      testingNotes.length > 0
        ? testingNotes
        : ['Define non-functional requirements during refinement.'],
    businessRules: ['Document business rules during refinement workshop.'],
    dataAndIntegrations:
      dataAndIntegrations.length > 0
        ? dataAndIntegrations
        : ['Confirm data model and integrations with stakeholders.'],
    userStories:
      userStories.length > 0
        ? userStories
        : ['Draft user stories during refinement.'],
    acceptanceCriteria:
      acceptanceCriteria.length > 0
        ? acceptanceCriteria.slice(0, 10)
        : ['Add acceptance criteria during refinement.'],
    edgeCases:
      testingNotes.length > 0
        ? testingNotes
        : ['Identify edge cases during refinement.'],
    risks:
      developerRisks.length > 0
        ? developerRisks
        : ['Review risks with the delivery team.'],
    openQuestions:
      openQuestions.length > 0
        ? openQuestions
        : ['Confirm open questions with stakeholders.'],
    technicalNotes:
      technicalNotes.length > 0
        ? technicalNotes
        : ['Add technical notes during solution design.'],
    recommendationForRefinement:
      openQuestions[0] ??
      'Complete refinement workshop to validate scope, user stories, and open questions before development.',
  };
}
