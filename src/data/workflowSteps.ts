export const WORKFLOW_STEPS = [
  { path: '/input', label: 'Input', shortLabel: 'Input' },
  { path: '/review', label: 'Review', shortLabel: 'Review' },
  { path: '/quality-gate', label: 'Quality Gate', shortLabel: 'Quality' },
  { path: '/risk-radar', label: 'Risk Radar', shortLabel: 'Risks' },
  { path: '/handoff', label: 'Handoff Pack', shortLabel: 'Handoff' },
  { path: '/figma-prompt', label: 'Figma Prompt', shortLabel: 'Figma' },
] as const;

export const EXECUTIVE_SUMMARY =
  'The analysis has a clear business direction, but it is not ready for development handoff. Key delivery details are still missing: role permissions, application status transition rules, CRM integration scope, measurable non-functional requirements and testable acceptance criteria.';
