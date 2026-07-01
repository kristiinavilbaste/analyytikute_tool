import { QUALITY_GATE_CATEGORIES } from './constants/qualityGateCategories';

type Severity = 'Low' | 'Medium' | 'High';

type ReadinessStatus =
  | 'Not ready'
  | 'Needs clarification'
  | 'Ready for refinement'
  | 'Ready for development';

interface CompactIssue {
  title?: string;
  severity?: string;
  description?: string;
}

interface CompactRisk {
  title?: string;
  severity?: string;
  description?: string;
}

export interface CompactReviewResponse {
  qualityScore?: number;
  readinessStatus?: string;
  executiveSummary?: string;
  issues?: CompactIssue[];
  risks?: CompactRisk[];
  hiddenAssumptions?: string[];
  questions?: string[];
  recommendations?: string[];
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

function categoryScoreFromOverall(qualityScore: number): number {
  const normalized = qualityScore / 10;
  return Math.max(0, Math.min(10, Math.round(normalized * 10) / 10));
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean).slice(0, max);
}

export function mapCompactReviewToResult(compact: CompactReviewResponse) {
  const qualityScore = clampOverallScore(compact.qualityScore);
  const readinessStatus = asReadinessStatus(qualityScore, compact.readinessStatus);
  const executiveSummary = asString(
    compact.executiveSummary,
    'Executive summary was not provided by the AI response.',
  );

  const issues = (compact.issues ?? []).slice(0, 5);
  const risks = (compact.risks ?? []).slice(0, 5);
  const hiddenAssumptions = asStringArray(compact.hiddenAssumptions, 5);
  const questions = asStringArray(compact.questions, 5);
  const recommendations = asStringArray(compact.recommendations, 5);

  const roleFindings = issues.map((issue) => ({
    role: asString(issue.title, 'Issue'),
    severity: asSeverity(issue.severity),
    findings: [asString(issue.description, 'No description provided.')],
  }));

  const topRisks = risks.map((risk, index) => ({
    id: `r-${index + 1}`,
    title: asString(risk.title, `Risk ${index + 1}`),
    description: asString(risk.description),
    severity: asSeverity(risk.severity),
    impact: asString(risk.description, 'Impact requires clarification.'),
    mitigation: recommendations[index] ?? 'Define mitigation with stakeholders.',
    questionToAsk: questions[index] ?? 'What is the mitigation plan?',
  }));

  const categoryScore = categoryScoreFromOverall(qualityScore);
  const qualityCategories = QUALITY_GATE_CATEGORIES.map((category, index) => ({
    id: category.id,
    name: category.name,
    score: categoryScore,
    rationale: executiveSummary,
    mainGap:
      issues[index % Math.max(issues.length, 1)]?.description ??
      'See review findings for details.',
    recommendation:
      recommendations[index % Math.max(recommendations.length, 1)] ??
      'Continue analysis refinement.',
  }));

  return {
    qualityScore,
    readinessStatus,
    executiveSummary,
    roleFindings,
    qualityCategories,
    topRisks,
    hiddenAssumptions: hiddenAssumptions.map((text, index) => ({
      id: `a-${index + 1}`,
      text,
    })),
    criticalQuestions: questions.map((text, index) => ({
      id: `q-${index + 1}`,
      text,
      priority: 'High' as Severity,
    })),
  };
}
