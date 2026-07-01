import { ensureQualityCategories } from './constants/qualityGateCategories';

type Severity = 'Low' | 'Medium' | 'High';

type ReadinessStatus =
  | 'Not ready'
  | 'Needs clarification'
  | 'Ready for refinement'
  | 'Ready for development';

interface RawReviewResult {
  qualityScore?: number;
  readinessStatus?: string;
  executiveSummary?: string;
  roleFindings?: Array<{
    role?: string;
    severity?: string;
    findings?: string[];
  }>;
  qualityCategories?: Array<{
    id?: string;
    name?: string;
    category?: string;
    score?: number;
    rationale?: string;
    mainGap?: string;
    recommendation?: string;
  }>;
  qualityGate?: Array<{
    id?: string;
    category?: string;
    name?: string;
    score?: number;
    rationale?: string;
    mainGap?: string;
    recommendation?: string;
  }>;
  topRisks?: Array<{
    id?: string;
    title?: string;
    description?: string;
    whyItMatters?: string;
    severity?: string;
    impact?: string;
    mitigation?: string;
    questionToAsk?: string;
  }>;
  risks?: Array<{
    id?: string;
    title?: string;
    description?: string;
    whyItMatters?: string;
    severity?: string;
    impact?: string;
    mitigation?: string;
    questionToAsk?: string;
  }>;
  hiddenAssumptions?: Array<string | { id?: string; text?: string }>;
  criticalQuestions?: Array<string | { id?: string; text?: string; priority?: string }>;
}

function asSeverity(value: unknown, fallback: Severity = 'Medium'): Severity {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  return fallback;
}

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

function clampOverallScore(score: unknown): number {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCategoryScore(score: unknown): number {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;

  let normalized = value;
  if (normalized > 10 && normalized <= 100) {
    normalized = normalized / 10;
  }

  normalized = Math.max(0, Math.min(10, normalized));
  return Math.round(normalized * 10) / 10;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

export function normalizeReviewResult(raw: RawReviewResult) {
  const qualityScore = clampOverallScore(raw.qualityScore);
  const readinessStatus = asReadinessStatus(qualityScore, raw.readinessStatus);
  const qualitySource = raw.qualityCategories ?? raw.qualityGate ?? [];
  const riskSource = raw.topRisks ?? raw.risks ?? [];

  return {
    qualityScore,
    readinessStatus,
    executiveSummary: asString(
      raw.executiveSummary,
      'Executive summary was not provided by the AI response.',
    ),
    roleFindings: (raw.roleFindings ?? []).map((item, index) => ({
      role: asString(item.role, `Reviewer ${index + 1}`),
      severity: asSeverity(item.severity),
      findings: asStringArray(item.findings),
    })),
    qualityCategories: ensureQualityCategories(qualitySource, normalizeCategoryScore),
    topRisks: riskSource.map((item, index) => ({
      id: asString(item.id, `r-${index + 1}`),
      title: asString(item.title, `Risk ${index + 1}`),
      description: asString(item.description ?? item.whyItMatters),
      severity: asSeverity(item.severity),
      impact: asString(item.impact),
      mitigation: asString(item.mitigation),
      questionToAsk: asString(item.questionToAsk),
    })),
    hiddenAssumptions: (raw.hiddenAssumptions ?? []).map((item, index) => ({
      id: typeof item === 'object' && item?.id ? asString(item.id) : `a-${index + 1}`,
      text:
        typeof item === 'string'
          ? item
          : asString(item?.text, 'Unspecified assumption'),
    })),
    criticalQuestions: (raw.criticalQuestions ?? []).map((item, index) => ({
      id: typeof item === 'object' && item?.id ? asString(item.id) : `q-${index + 1}`,
      text:
        typeof item === 'string'
          ? item
          : asString(item?.text, 'Clarification needed'),
      priority: asSeverity(
        typeof item === 'object' ? item?.priority : undefined,
        'High',
      ),
    })),
  };
}

interface RawHandoffPack {
  featureSummary?: string;
  businessGoal?: string;
  scope?: string[];
  outOfScope?: string[];
  userRoles?: string[];
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  businessRules?: string[];
  dataAndIntegrations?: string[];
  userStories?: Array<string | { title?: string; story?: string; acceptanceCriteria?: string[] }>;
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  risks?: string[];
  openQuestions?: string[];
  technicalNotes?: string[];
  recommendationForRefinement?: string;
}

export function normalizeHandoffPack(raw: RawHandoffPack) {
  const userStories = (raw.userStories ?? []).map((item) => {
    if (typeof item === 'string') return item;
    const title = asString(item.title);
    const story = asString(item.story);
    const criteria = asStringArray(item.acceptanceCriteria);
    if (title && story) {
      return criteria.length > 0
        ? `${title}: ${story} (Acceptance: ${criteria.join('; ')})`
        : `${title}: ${story}`;
    }
    return title || story;
  });

  return {
    featureSummary: asString(raw.featureSummary),
    businessGoal: asString(raw.businessGoal),
    scope: asStringArray(raw.scope),
    outOfScope: asStringArray(raw.outOfScope),
    userRoles: asStringArray(raw.userRoles),
    functionalRequirements: asStringArray(raw.functionalRequirements),
    nonFunctionalRequirements: asStringArray(raw.nonFunctionalRequirements),
    businessRules: asStringArray(raw.businessRules),
    dataAndIntegrations: asStringArray(raw.dataAndIntegrations),
    userStories,
    acceptanceCriteria: asStringArray(raw.acceptanceCriteria),
    edgeCases: asStringArray(raw.edgeCases),
    risks: asStringArray(raw.risks),
    openQuestions: asStringArray(raw.openQuestions),
    technicalNotes: asStringArray(raw.technicalNotes),
    recommendationForRefinement: asString(raw.recommendationForRefinement),
  };
}

export function normalizeFigmaPrompt(raw: { prompt?: string }): { prompt: string } {
  return {
    prompt: asString(
      raw.prompt,
      'Figma prompt was not generated. Please retry or use the mocked result.',
    ),
  };
}
