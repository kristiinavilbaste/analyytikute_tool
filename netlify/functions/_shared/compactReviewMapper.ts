import { QUALITY_GATE_CATEGORIES } from './constants/qualityGateCategories';

type Severity = 'Low' | 'Medium' | 'High';

type ReadinessStatus =
  | 'Not ready'
  | 'Needs clarification'
  | 'Ready for refinement'
  | 'Ready for development';

export interface CompactReviewResponse {
  qualityScore?: number;
  readinessStatus?: string;
  executiveSummary?: string;
  topIssues?: string[];
  topRisks?: string[];
  hiddenAssumptions?: string[];
  questions?: string[];
  recommendations?: string[];
}

interface CategoryEvaluationTemplate {
  rationale: string;
  mainGap: string;
  recommendation: string;
  scoreOffset: number;
  issueKeywords: string[];
}

const REVIEWER_ROLES = [
  'Business Analyst',
  'System Analyst',
  'QA Engineer',
  'Solution Architect',
  'Risk Officer',
  'Product Owner',
  'Developer',
];

const CATEGORY_EVALUATION: Record<string, CategoryEvaluationTemplate> = {
  'Business Need Clarity': {
    rationale:
      'The stated business need is present but goals and success criteria need sharper definition.',
    mainGap: 'Business problem, target outcomes and measurable success criteria are incomplete.',
    recommendation:
      'Document the business problem, desired outcomes and KPIs before solution design.',
    scoreOffset: 0.4,
    issueKeywords: ['business', 'goal', 'kpi', 'success', 'need', 'outcome', 'value'],
  },
  'Scope Clarity': {
    rationale: 'Core capabilities are mentioned but scope boundaries remain ambiguous.',
    mainGap: 'In-scope and out-of-scope items, plus MVP vs later phases, are not explicit.',
    recommendation: 'Publish a scope list with phase labels and explicit out-of-scope items.',
    scoreOffset: -0.2,
    issueKeywords: ['scope', 'mvp', 'phase', 'boundary', 'out of scope', 'in scope'],
  },
  'User Roles and Permissions': {
    rationale: 'User types are referenced but access control detail is thin.',
    mainGap: 'Actors, role responsibilities, permissions and access rules are not defined.',
    recommendation: 'Create a role and permission matrix covering all user types and actions.',
    scoreOffset: -0.8,
    issueKeywords: ['role', 'permission', 'access', 'actor', 'user type', 'admin'],
  },
  'Functional Requirements': {
    rationale: 'Expected capabilities are described narratively rather than as requirements.',
    mainGap: 'User flows, features and system behavior lack numbered, traceable requirements.',
    recommendation: 'Convert capabilities into numbered functional requirements linked to user goals.',
    scoreOffset: 0.1,
    issueKeywords: ['functional', 'feature', 'flow', 'behavior', 'requirement', 'user story'],
  },
  'Non-Functional Requirements': {
    rationale: 'Operational quality targets are largely absent from the analysis.',
    mainGap: 'Performance, security, audit, availability and usability targets are missing.',
    recommendation: 'Add measurable NFRs with thresholds and verification methods.',
    scoreOffset: -1.2,
    issueKeywords: ['performance', 'security', 'availability', 'nfr', 'uptime', 'usability', 'audit'],
  },
  'Business Rules': {
    rationale: 'Some process logic is implied but formal business rules are not captured.',
    mainGap: 'Status transitions, validations and exception handling rules are undocumented.',
    recommendation: 'Document business rules including statuses, validations and edge cases.',
    scoreOffset: -0.6,
    issueKeywords: ['rule', 'status', 'validation', 'transition', 'workflow', 'process'],
  },
  'Data and Integrations': {
    rationale: 'Integrations and data needs are mentioned at a high level only.',
    mainGap: 'Data entities, CRM/API contracts, ownership and sync logic are unclear.',
    recommendation: 'Produce a data model and integration specification with API contracts.',
    scoreOffset: -0.9,
    issueKeywords: ['data', 'integration', 'crm', 'api', 'entity', 'sync', 'database'],
  },
  'Acceptance Criteria Testability': {
    rationale: 'Requirements can be understood but are hard to test as written.',
    mainGap: 'Acceptance criteria are too generic to derive manual or automated tests.',
    recommendation: 'Rewrite criteria as Given/When/Then with specific data and expected results.',
    scoreOffset: -0.4,
    issueKeywords: ['acceptance', 'test', 'testable', 'criteria', 'verify', 'qa'],
  },
  'Risks and Assumptions': {
    rationale: 'Some risks are inferable but not formally tracked with mitigations.',
    mainGap: 'Explicit risks, hidden assumptions and mitigation ownership are missing.',
    recommendation: 'Maintain a risk and assumption register with owners and mitigations.',
    scoreOffset: 0.0,
    issueKeywords: ['risk', 'assumption', 'mitigation', 'dependency', 'unknown'],
  },
  'Development Handoff Readiness': {
    rationale: 'Enough context exists to understand intent but refinement blockers remain.',
    mainGap: 'Open decisions and missing detail would slow confident development start.',
    recommendation: 'Run a refinement workshop and close open decisions before handoff.',
    scoreOffset: -0.3,
    issueKeywords: ['handoff', 'refinement', 'development', 'open', 'decision', 'detail'],
  },
};

function asReadinessStatus(score: number, provided?: string): ReadinessStatus {
  const normalized = String(provided ?? '').toLowerCase();
  const map: Record<string, ReadinessStatus> = {
    'not ready': 'Not ready',
    'needs clarification': 'Needs clarification',
    'ready for refinement': 'Ready for refinement',
    'ready for development': 'Ready for development',
  };

  for (const [key, value] of Object.entries(map)) {
    if (normalized.includes(key)) return value;
  }

  if (score <= 39) return 'Not ready';
  if (score <= 59) return 'Needs clarification';
  if (score <= 79) return 'Ready for refinement';
  return 'Ready for development';
}

function clampOverallScore(score: unknown, fallback = 45): number {
  const value = Number(score);
  if (Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCategoryScore(score: number): number {
  const normalized = Math.max(0, Math.min(10, score));
  return Math.round(normalized * 10) / 10;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, max);
}

function pickMatchingLine(items: string[], keywords: string[]): string | null {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());

  for (const item of items) {
    const lower = item.toLowerCase();
    if (normalizedKeywords.some((keyword) => lower.includes(keyword))) {
      return item;
    }
  }

  return null;
}

function deriveCategoryScore(overallScore: number, scoreOffset: number): number {
  const base = overallScore / 10;
  return normalizeCategoryScore(base + scoreOffset);
}

function buildQualityCategoriesFromCoreReview(
  overallScore: number,
  topIssues: string[],
  recommendations: string[],
) {
  return QUALITY_GATE_CATEGORIES.map((category) => {
    const template =
      CATEGORY_EVALUATION[category.name] ?? CATEGORY_EVALUATION['Business Need Clarity'];
    const matchedIssue = pickMatchingLine(topIssues, template.issueKeywords);
    const matchedRecommendation = pickMatchingLine(recommendations, template.issueKeywords);

    return {
      id: category.id,
      name: category.name,
      score: deriveCategoryScore(overallScore, template.scoreOffset),
      rationale: template.rationale,
      mainGap: matchedIssue ?? template.mainGap,
      recommendation: matchedRecommendation ?? template.recommendation,
    };
  });
}

function buildRoleFindings(topIssues: string[]) {
  if (topIssues.length === 0) {
    return [
      {
        role: 'Business Analyst',
        severity: 'Medium' as Severity,
        findings: ['The analysis requires further review against standard quality criteria.'],
      },
    ];
  }

  return topIssues.map((issue, index) => ({
    role: REVIEWER_ROLES[index % REVIEWER_ROLES.length],
    severity: (index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low') as Severity,
    findings: [issue],
  }));
}

function buildTopRisks(
  topRisks: string[],
  recommendations: string[],
  questions: string[],
) {
  if (topRisks.length === 0) {
    return [
      {
        id: 'r-1',
        title: 'Analysis completeness risk',
        description: 'Important analysis details may still be missing or unclear.',
        severity: 'Medium' as Severity,
        impact: 'Delivery delays or rework during refinement.',
        mitigation: recommendations[0] ?? 'Clarify open items with stakeholders.',
        questionToAsk: questions[0] ?? 'Which gaps must be closed before development?',
      },
    ];
  }

  return topRisks.map((risk, index) => {
    const title = risk.length > 80 ? `${risk.slice(0, 77)}...` : risk;

    return {
      id: `r-${index + 1}`,
      title: title || `Risk ${index + 1}`,
      description: risk,
      severity: (index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low') as Severity,
      impact: risk,
      mitigation: recommendations[index] ?? 'Define mitigation with stakeholders.',
      questionToAsk: questions[index] ?? 'What is the mitigation plan?',
    };
  });
}

export function createFallbackCompactReview(): CompactReviewResponse {
  return {
    qualityScore: 45,
    readinessStatus: 'Needs clarification',
    executiveSummary:
      'Automated review could not be parsed. A baseline assessment is shown using standard quality criteria.',
    topIssues: [
      'Business goals and success criteria need clearer definition.',
      'Scope boundaries and MVP phasing are not explicit.',
      'Roles, permissions and access rules require a permission matrix.',
    ],
    topRisks: [
      'Missing non-functional requirements may cause rework during build.',
      'Integration and data ownership details are not specified.',
    ],
    hiddenAssumptions: [
      'Stakeholders share the same understanding of scope and priorities.',
      'Existing systems can support required integrations.',
    ],
    questions: [
      'What are the measurable success criteria for this initiative?',
      'Which items are in MVP scope versus later phases?',
      'What is the complete role and permission model?',
    ],
    recommendations: [
      'Document business goals, KPIs and explicit scope boundaries.',
      'Define roles, permissions and integration contracts before refinement.',
      'Add testable acceptance criteria and measurable NFRs.',
    ],
  };
}

export function mapCompactReviewToResult(compact: CompactReviewResponse) {
  const qualityScore = clampOverallScore(compact.qualityScore);
  const readinessStatus = asReadinessStatus(qualityScore, compact.readinessStatus);
  const executiveSummary = asString(
    compact.executiveSummary,
    'Executive summary was not provided by the AI response.',
  );

  const topIssues = asStringArray(compact.topIssues, 5);
  const topRisks = asStringArray(compact.topRisks, 5);
  const hiddenAssumptions = asStringArray(compact.hiddenAssumptions, 5);
  const questions = asStringArray(compact.questions, 5);
  const recommendations = asStringArray(compact.recommendations, 5);

  return {
    qualityScore,
    readinessStatus,
    executiveSummary,
    roleFindings: buildRoleFindings(topIssues),
    qualityCategories: buildQualityCategoriesFromCoreReview(
      qualityScore,
      topIssues,
      recommendations,
    ),
    topRisks: buildTopRisks(topRisks, recommendations, questions),
    hiddenAssumptions: hiddenAssumptions.map((text, index) => ({
      id: `a-${index + 1}`,
      text,
    })),
    criticalQuestions: questions.map((text, index) => ({
      id: `q-${index + 1}`,
      text,
      priority: (index === 0 ? 'High' : 'Medium') as Severity,
    })),
  };
}

export function parseCompactReviewJson(content: string): CompactReviewResponse | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText) as CompactReviewResponse;
  } catch {
    return null;
  }
}
