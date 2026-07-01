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

const CATEGORY_SPECIFIC_FALLBACKS: Record<
  string,
  { rationale: string; mainGap: string; recommendation: string }
> = {
  'Business Need Clarity': {
    rationale: 'Business need clarity was not evaluated separately in the AI response.',
    mainGap: 'Business problem, goals or success criteria need clearer definition.',
    recommendation: 'Document the business problem, outcomes and measurable success criteria.',
  },
  'Scope Clarity': {
    rationale: 'Scope clarity was not evaluated separately in the AI response.',
    mainGap: 'In-scope and out-of-scope boundaries are not defined clearly enough.',
    recommendation: 'Publish an explicit scope list with phase boundaries.',
  },
  'User Roles and Permissions': {
    rationale: 'User roles and permissions were not evaluated separately in the AI response.',
    mainGap: 'Actors, roles, permissions or access rules are missing or unclear.',
    recommendation: 'Define a role and permission matrix for all user types.',
  },
  'Functional Requirements': {
    rationale: 'Functional requirements were not evaluated separately in the AI response.',
    mainGap: 'User flows, features or expected behavior are incomplete.',
    recommendation: 'Document numbered functional requirements linked to user goals.',
  },
  'Non-Functional Requirements': {
    rationale: 'Non-functional requirements were not evaluated separately in the AI response.',
    mainGap: 'Performance, security, audit, availability or usability targets are missing.',
    recommendation: 'Add measurable non-functional requirements with acceptance thresholds.',
  },
  'Business Rules': {
    rationale: 'Business rules were not evaluated separately in the AI response.',
    mainGap: 'Rules, statuses, validations or process logic are not documented.',
    recommendation: 'Capture business rules including status transitions and validations.',
  },
  'Data and Integrations': {
    rationale: 'Data and integrations were not evaluated separately in the AI response.',
    mainGap: 'Data entities, source systems, APIs or integration contracts are unclear.',
    recommendation: 'Produce a data model and integration specification.',
  },
  'Acceptance Criteria Testability': {
    rationale: 'Acceptance criteria testability was not evaluated separately in the AI response.',
    mainGap: 'Requirements are not written in a testable form.',
    recommendation: 'Rewrite acceptance criteria as Given/When/Then with expected results.',
  },
  'Risks and Assumptions': {
    rationale: 'Risks and assumptions were not evaluated separately in the AI response.',
    mainGap: 'Explicit risks, hidden assumptions or mitigation plans are missing.',
    recommendation: 'Maintain a risk and assumption register with owners and mitigations.',
  },
  'Development Handoff Readiness': {
    rationale: 'Development handoff readiness was not evaluated separately in the AI response.',
    mainGap: 'Developers lack enough detail to begin refinement or build confidently.',
    recommendation: 'Complete a refinement workshop and close open decisions before handoff.',
  },
};

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

function getCategoryFallback(name: string) {
  return (
    CATEGORY_SPECIFIC_FALLBACKS[name] ?? {
      rationale: 'This category was not evaluated in the AI response.',
      mainGap: 'Missing category-specific evaluation.',
      recommendation: 'Re-run the review or manually assess this category.',
    }
  );
}

function normalizeField(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

function deduplicateCategoryContent(categories: QualityCategory[]): QualityCategory[] {
  const seenRationale = new Set<string>();
  const seenMainGap = new Set<string>();
  const seenRecommendation = new Set<string>();

  return categories.map((category) => {
    const fallback = getCategoryFallback(category.name);
    let rationale = category.rationale.trim();
    let mainGap = category.mainGap.trim();
    let recommendation = category.recommendation.trim();

    const rationaleKey = normalizeCategoryName(rationale);
    if (!rationale || seenRationale.has(rationaleKey)) {
      rationale = fallback.rationale;
    }
    seenRationale.add(normalizeCategoryName(rationale));

    const mainGapKey = normalizeCategoryName(mainGap);
    if (!mainGap || seenMainGap.has(mainGapKey)) {
      mainGap = fallback.mainGap;
    }
    seenMainGap.add(normalizeCategoryName(mainGap));

    const recommendationKey = normalizeCategoryName(recommendation);
    if (!recommendation || seenRecommendation.has(recommendationKey)) {
      recommendation = fallback.recommendation;
    }
    seenRecommendation.add(normalizeCategoryName(recommendation));

    return {
      ...category,
      rationale,
      mainGap,
      recommendation,
    };
  });
}

/** Guarantee exactly 10 Quality Gate categories in canonical order. */
export function normalizeQualityCategories(categories: QualityCategory[]): QualityCategory[] {
  const usedIndices = new Set<number>();

  const mapped = QUALITY_GATE_CATEGORIES.map((canonical) => {
    const matchIndex = categories.findIndex((item, itemIndex) => {
      if (usedIndices.has(itemIndex)) return false;
      return categoryNamesMatch(canonical.name, item.name);
    });

    const fallback = getCategoryFallback(canonical.name);

    if (matchIndex >= 0) {
      usedIndices.add(matchIndex);
      const item = categories[matchIndex];

      return {
        id: item.id?.trim() || canonical.id,
        name: canonical.name,
        score: normalizeCategoryScore(item.score),
        rationale: normalizeField(item.rationale, fallback.rationale),
        mainGap: normalizeField(item.mainGap, fallback.mainGap),
        recommendation: normalizeField(item.recommendation, fallback.recommendation),
      };
    }

    return {
      id: canonical.id,
      name: canonical.name,
      score: 0,
      rationale: fallback.rationale,
      mainGap: fallback.mainGap,
      recommendation: fallback.recommendation,
    };
  });

  return deduplicateCategoryContent(mapped);
}
