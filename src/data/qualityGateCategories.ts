import type { QualityCategory } from '../types';
import { normalizeCategoryScore } from '../utils/qualityScoreUtils';

export interface QualityGateCategoryDefinition {
  id: string;
  name: string;
}

export const QUALITY_GATE_CATEGORIES: QualityGateCategoryDefinition[] = [
  { id: 'qc-1', name: 'Business Need Clarity' },
  { id: 'qc-2', name: 'Scope Clarity' },
  { id: 'qc-3', name: 'User Roles and Permissions' },
  { id: 'qc-4', name: 'Functional Requirements' },
  { id: 'qc-5', name: 'Non-Functional Requirements' },
  { id: 'qc-6', name: 'Business Rules' },
  { id: 'qc-7', name: 'Data and Integrations' },
  { id: 'qc-8', name: 'Acceptance Criteria Testability' },
  { id: 'qc-9', name: 'Risks and Assumptions' },
  { id: 'qc-10', name: 'Development Handoff Readiness' },
];

export const QUALITY_GATE_CATEGORY_NAMES = QUALITY_GATE_CATEGORIES.map((c) => c.name);

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Business Need Clarity': ['business need clarity', 'business need'],
  'Scope Clarity': ['scope clarity'],
  'User Roles and Permissions': [
    'user roles and permissions',
    'user role definition',
    'user roles',
    'user role clarity',
  ],
  'Functional Requirements': [
    'functional requirements',
    'functional requirement quality',
  ],
  'Non-Functional Requirements': [
    'non-functional requirements',
    'non functional requirements',
    'non-functional requirement coverage',
    'nfr coverage',
  ],
  'Business Rules': ['business rules', 'business rule completeness'],
  'Data and Integrations': [
    'data and integrations',
    'data and integration clarity',
    'data integrations',
  ],
  'Acceptance Criteria Testability': [
    'acceptance criteria testability',
    'acceptance criteria',
  ],
  'Risks and Assumptions': [
    'risks and assumptions',
    'risk and assumption visibility',
    'risk visibility',
    'risk and assumptions',
  ],
  'Development Handoff Readiness': [
    'development handoff readiness',
    'handoff readiness',
    'development handoff',
  ],
};

function normalizeCategoryName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getAliasKeys(canonicalName: string): string[] {
  const normalizedCanonical = normalizeCategoryName(canonicalName);
  const aliases = CATEGORY_ALIASES[canonicalName] ?? [];
  return [normalizedCanonical, ...aliases.map(normalizeCategoryName)];
}

function categoryNamesMatch(canonicalName: string, candidateName: string): boolean {
  const normalizedCandidate = normalizeCategoryName(candidateName);
  if (!normalizedCandidate) return false;

  return getAliasKeys(canonicalName).some(
    (alias) =>
      normalizedCandidate === alias ||
      normalizedCandidate.includes(alias) ||
      alias.includes(normalizedCandidate),
  );
}

const FALLBACK_RATIONALE = 'This category was not evaluated in the AI response.';
const FALLBACK_MAIN_GAP = 'Missing evaluation.';
const FALLBACK_RECOMMENDATION =
  'Re-run the review or manually assess this category.';

/** Guarantee exactly 10 Quality Gate categories in canonical order. */
export function normalizeQualityCategories(categories: QualityCategory[]): QualityCategory[] {
  const usedIndices = new Set<number>();

  return QUALITY_GATE_CATEGORIES.map((canonical) => {
    const matchIndex = categories.findIndex((item, itemIndex) => {
      if (usedIndices.has(itemIndex)) return false;
      return categoryNamesMatch(canonical.name, item.name);
    });

    if (matchIndex >= 0) {
      usedIndices.add(matchIndex);
      const item = categories[matchIndex];

      return {
        id: item.id?.trim() || canonical.id,
        name: canonical.name,
        score: normalizeCategoryScore(item.score),
        rationale: item.rationale?.trim() || FALLBACK_RATIONALE,
        mainGap: item.mainGap?.trim() || FALLBACK_MAIN_GAP,
        recommendation: item.recommendation?.trim() || FALLBACK_RECOMMENDATION,
      };
    }

    return {
      id: canonical.id,
      name: canonical.name,
      score: 0,
      rationale: FALLBACK_RATIONALE,
      mainGap: FALLBACK_MAIN_GAP,
      recommendation: FALLBACK_RECOMMENDATION,
    };
  });
}
