import type {
  ReviewResult,
  HandoffPack,
  RoleFinding,
  Risk,
  Assumption,
  CriticalQuestion,
  QualityCategory,
} from '../types';
import { EXECUTIVE_SUMMARY } from '../data/workflowSteps';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_ROLE_FINDINGS: RoleFinding[] = [
  {
    role: 'Business Analyst',
    severity: 'High',
    findings: [
      'Business process flow is described at a high level but lacks step-by-step workflow definition.',
      'Stakeholder roles (administrator vs processor) are mentioned but responsibilities are not differentiated.',
      'Success metrics and KPIs for the self-service portal are not defined.',
    ],
  },
  {
    role: 'System Analyst',
    severity: 'High',
    findings: [
      'Status transition rules are missing — no state machine or lifecycle diagram provided.',
      'Required fields per application type are not specified.',
      'Data model and entity relationships are not documented.',
    ],
  },
  {
    role: 'QA Engineer',
    severity: 'High',
    findings: [
      'Acceptance criteria are too generic to derive test cases.',
      'Edge cases for concurrent submissions and notification failures are missing.',
      'No test data strategy or environment requirements specified.',
    ],
  },
  {
    role: 'Solution Architect',
    severity: 'Medium',
    findings: [
      'CRM integration approach is undecided — sync direction and data ownership unclear.',
      'Authentication mechanism (SSO, local accounts) is not specified.',
      'Scalability and availability targets are absent.',
    ],
  },
  {
    role: 'Risk Officer',
    severity: 'High',
    findings: [
      'Role permissions are not defined — potential data exposure risk.',
      'Document upload rules and virus scanning requirements are missing.',
      'Audit trail and compliance requirements are not addressed.',
    ],
  },
  {
    role: 'Product Owner',
    severity: 'Medium',
    findings: [
      'MVP scope vs future phases is not delineated.',
      'User onboarding and help content requirements are not mentioned.',
      'Priority of notification channels (email vs SMS) is unclear.',
    ],
  },
  {
    role: 'Developer',
    severity: 'Medium',
    findings: [
      'API contract and integration endpoints are not defined.',
      'Non-functional requirements are not measurable (response times, uptime).',
      'Error handling and retry logic for notifications are unspecified.',
    ],
  },
];

const MOCK_RISKS: Risk[] = [
  {
    id: 'r1',
    title: 'Undefined role permissions',
    description: 'Without clear RBAC, users may access applications they should not see.',
    severity: 'High',
    impact: 'Data breach, compliance violations, and loss of user trust.',
    mitigation: 'Define a role-permission matrix and validate with security review before build.',
    questionToAsk: 'What exact permissions does each role have for viewing, editing, and deleting applications?',
  },
  {
    id: 'r2',
    title: 'Missing status transition rules',
    description: 'Ambiguous workflow states will cause inconsistent application handling.',
    severity: 'High',
    impact: 'Applications stuck in limbo, duplicate processing, and customer complaints.',
    mitigation: 'Document a state machine diagram with allowed transitions and actor permissions.',
    questionToAsk: 'What are all status values and which roles can trigger each transition?',
  },
  {
    id: 'r3',
    title: 'CRM integration undecided',
    description: 'Delayed integration decisions may block development and cause rework.',
    severity: 'High',
    impact: 'Sprint delays, integration rework, and inconsistent customer data.',
    mitigation: 'Hold an integration workshop to decide CRM system, sync direction, and data mapping.',
    questionToAsk: 'Which CRM system integrates, what data syncs bidirectionally, and who owns conflicts?',
  },
  {
    id: 'r4',
    title: 'Notification logic unclear',
    description: 'Channel selection, triggers, and failure handling are not specified.',
    severity: 'Medium',
    impact: 'Users miss critical updates; support tickets increase.',
    mitigation: 'Define notification event matrix with channel rules and retry/fallback logic.',
    questionToAsk: 'Which events trigger email vs SMS, and what happens when delivery fails?',
  },
  {
    id: 'r5',
    title: 'Non-measurable NFRs',
    description: 'Performance and availability targets cannot be validated without metrics.',
    severity: 'Medium',
    impact: 'No objective acceptance criteria for performance testing or SLA agreements.',
    mitigation: 'Set specific targets for response time, uptime, and concurrent user load.',
    questionToAsk: 'What are the measurable performance, availability, and scalability requirements?',
  },
];

const MOCK_ASSUMPTIONS: Assumption[] = [
  { id: 'a1', text: 'Users will authenticate via an existing identity provider.' },
  { id: 'a2', text: 'Application data will be stored in a relational database.' },
  { id: 'a3', text: 'Email notifications are the primary channel; SMS is optional.' },
  { id: 'a4', text: 'Document uploads will be limited to common formats (PDF, JPG, PNG).' },
  { id: 'a5', text: 'The portal will be a responsive web application, not a native mobile app.' },
];

const MOCK_QUALITY_CATEGORIES: QualityCategory[] = [
  {
    id: 'qc1',
    name: 'Business need clarity',
    score: 6,
    rationale: 'The core business problem and desired outcome are stated at a high level.',
    mainGap: 'Success metrics and KPIs are not defined.',
    recommendation: 'Add measurable goals such as reduction in manual processing time or application turnaround.',
  },
  {
    id: 'qc2',
    name: 'Scope clarity',
    score: 4,
    rationale: 'Main features are listed but boundaries are vague.',
    mainGap: 'MVP vs future phases is not delineated.',
    recommendation: 'Create an explicit in-scope / out-of-scope list with phase labels.',
  },
  {
    id: 'qc3',
    name: 'User role definition',
    score: 3,
    rationale: 'Three roles are mentioned but responsibilities overlap.',
    mainGap: 'Permission matrix is completely missing.',
    recommendation: 'Define role capabilities in a RACI or permission table.',
  },
  {
    id: 'qc4',
    name: 'Functional requirement quality',
    score: 5,
    rationale: 'Key capabilities are described in narrative form.',
    mainGap: 'Requirements lack unique IDs and traceability.',
    recommendation: 'Convert to numbered functional requirements linked to user stories.',
  },
  {
    id: 'qc5',
    name: 'Non-functional requirement coverage',
    score: 2,
    rationale: 'NFRs are acknowledged as undefined.',
    mainGap: 'No measurable performance, security, or availability targets.',
    recommendation: 'Add specific NFRs with numeric thresholds and test methods.',
  },
  {
    id: 'qc6',
    name: 'Business rule completeness',
    score: 3,
    rationale: 'Some implicit rules exist (users see own applications).',
    mainGap: 'Status transition rules and validation rules are missing.',
    recommendation: 'Document all business rules including edge cases and exceptions.',
  },
  {
    id: 'qc7',
    name: 'Data and integration clarity',
    score: 3,
    rationale: 'CRM integration is mentioned but not specified.',
    mainGap: 'Data model, entity relationships, and sync logic are absent.',
    recommendation: 'Produce a data model diagram and integration specification.',
  },
  {
    id: 'qc8',
    name: 'Acceptance criteria testability',
    score: 4,
    rationale: 'Some criteria can be inferred from user stories.',
    mainGap: 'Criteria are too generic for automated or manual test derivation.',
    recommendation: 'Rewrite as Given/When/Then with specific data and expected outcomes.',
  },
  {
    id: 'qc9',
    name: 'Risk and assumption visibility',
    score: 5,
    rationale: 'Several gaps are acknowledged in the analysis text.',
    mainGap: 'Risks are not formally documented with impact and mitigation.',
    recommendation: 'Maintain a risk register with owners and mitigation plans.',
  },
  {
    id: 'qc10',
    name: 'Development handoff readiness',
    score: 4,
    rationale: 'Enough context exists to understand the product vision.',
    mainGap: 'Too many open decisions block confident sprint planning.',
    recommendation: 'Complete refinement workshop before development kickoff.',
  },
];

const MOCK_QUESTIONS: CriticalQuestion[] = [
  {
    id: 'q1',
    text: 'What are the exact role definitions and permission matrix for users, processors, and administrators?',
    priority: 'High',
  },
  {
    id: 'q2',
    text: 'What is the complete application status lifecycle and who can trigger each transition?',
    priority: 'High',
  },
  {
    id: 'q3',
    text: 'Which CRM system will be integrated, and what data syncs in each direction?',
    priority: 'High',
  },
  {
    id: 'q4',
    text: 'What are the measurable non-functional requirements (response time, uptime, concurrent users)?',
    priority: 'Medium',
  },
  {
    id: 'q5',
    text: 'What notification events trigger email vs SMS, and what is the fallback if delivery fails?',
    priority: 'Medium',
  },
];

const MOCK_HANDOFF_PACK: HandoffPack = {
  featureSummary:
    'Self-service portal enabling end users to submit applications, track status, and receive notifications, with administrative tools for processors and administrators to manage the application pipeline.',
  businessGoal:
    'Reduce manual processing overhead by automating application intake and status communication, while giving users transparency into their submissions.',
  scope: [
    'User registration and authentication',
    'Application submission with document upload',
    'Application status tracking dashboard',
    'Email and SMS notification delivery',
    'Administrator and processor management views',
    'Role-based access control',
  ],
  outOfScope: [
    'Native mobile applications',
    'Payment processing',
    'Multi-language support (phase 1)',
    'Advanced analytics and reporting',
    'Third-party API for external integrations',
  ],
  userRoles: [
    'Applicant — submits and tracks own applications',
    'Processor — reviews and updates application status',
    'Administrator — manages users, roles, and system configuration',
  ],
  functionalRequirements: [
    'Users can create and submit applications with required attachments',
    'Users can view a list of their own applications and current status',
    'Processors can view and action applications assigned to them',
    'Administrators can manage user accounts and role assignments',
    'System sends notifications on status changes via email or SMS',
    'Users can only access their own application data',
  ],
  nonFunctionalRequirements: [
    'Page load time under 3 seconds on standard broadband',
    '99.5% uptime during business hours',
    'Support 500 concurrent users',
    'WCAG 2.1 AA accessibility compliance',
    'Data encrypted at rest and in transit',
  ],
  businessRules: [
    'An application must have all required fields before submission',
    'Only the assigned processor or an administrator can change application status',
    'Users cannot edit applications after submission',
    'Notifications must be sent within 5 minutes of a status change',
    'Document uploads limited to 10 MB per file, 50 MB total per application',
  ],
  dataAndIntegrations: [
    'Application entity: id, userId, type, status, submittedAt, documents[], history[]',
    'User entity: id, email, phone, role, createdAt',
    'CRM integration (TBD): sync application status and contact details',
    'Email service provider (e.g. SendGrid) for transactional email',
    'SMS gateway (e.g. Twilio) for text notifications',
  ],
  userStories: [
    'As an applicant, I want to submit an application online so that I do not need to visit an office.',
    'As an applicant, I want to track my application status so that I know when action is needed.',
    'As an applicant, I want to receive notifications when my status changes so that I stay informed.',
    'As a processor, I want to see a queue of pending applications so that I can work efficiently.',
    'As an administrator, I want to assign roles to users so that access is properly controlled.',
  ],
  acceptanceCriteria: [
    'Given a logged-in user, when they submit a complete application, then it appears in their dashboard with status "Submitted".',
    'Given a processor, when they update an application status, then the applicant receives a notification within 5 minutes.',
    'Given a user with applicant role, when they view the application list, then they only see their own applications.',
    'Given an administrator, when they assign a processor role, then the user gains access to the processor queue.',
  ],
  edgeCases: [
    'User submits application while session expires mid-form',
    'Notification delivery fails — retry logic and user fallback',
    'Concurrent status updates by two processors on the same application',
    'Document upload exceeds size limit',
    'CRM sync fails during status update',
  ],
  risks: [
    'Undefined RBAC may lead to unauthorized data access',
    'CRM integration scope creep if not decided early',
    'Notification delivery reliability depends on third-party services',
    'Missing edge case coverage may cause production defects',
  ],
  openQuestions: [
    'Which CRM system and what is the integration contract?',
    'What authentication provider will be used?',
    'What are the exact status values and transition rules?',
    'Is SMS mandatory for all users or opt-in?',
    'What audit and compliance requirements apply?',
  ],
  technicalNotes: [
    'Recommend REST API with JWT authentication',
    'Consider event-driven architecture for notification dispatch',
    'State machine pattern recommended for application status management',
    'File storage should use object storage (S3-compatible) with virus scanning',
    'Prepare for future OpenAI-assisted analysis refinement integration',
  ],
  recommendationForRefinement:
    'Before development handoff, conduct a workshop to finalize the role permission matrix, application status state machine, CRM integration scope, and measurable non-functional requirements. Produce updated user stories with specific acceptance criteria and a data model diagram.',
};

/**
 * Mock review board service.
 *
 * Future OpenAI integration: Replace the mock data return with an API call
 * to a backend endpoint or direct OpenAI SDK call. Keep this function signature
 * and return type unchanged so components remain decoupled from the data source.
 */
export async function runReviewBoard(_input: string): Promise<ReviewResult> {
  await delay(1200);

  return {
    qualityScore: 41,
    readinessStatus: 'Needs clarification',
    executiveSummary: EXECUTIVE_SUMMARY,
    roleFindings: MOCK_ROLE_FINDINGS,
    qualityCategories: MOCK_QUALITY_CATEGORIES,
    topRisks: MOCK_RISKS,
    hiddenAssumptions: MOCK_ASSUMPTIONS,
    criticalQuestions: MOCK_QUESTIONS,
  };
}

/**
 * Mock handoff pack generator.
 *
 * Future OpenAI integration: Replace with a structured prompt that takes the
 * analysis input and review results, returning a typed HandoffPack response.
 */
export async function generateHandoffPack(_input: string): Promise<HandoffPack> {
  await delay(1000);
  return MOCK_HANDOFF_PACK;
}

const MOCK_FIGMA_PROMPT = `FIGMA PROTOTYPE PROMPT — Self-Service Application Portal
========================================================

PRODUCT CONTEXT
---------------
Design a clickable web prototype for a self-service application portal. End users submit applications, track status, and receive notifications. Administrators and processors manage the application pipeline. The experience should feel automated, trustworthy, and efficient — reducing manual office visits and phone follow-ups.

TARGET USERS
------------
• Applicant — submits applications, uploads documents, tracks own submissions only
• Processor — reviews assigned applications, updates status, requests additional info
• Administrator — manages users, roles, system settings, and oversees all applications

MAIN SCREENS
------------
1. Login / Authentication
2. Applicant Dashboard — list of my applications with status badges
3. New Application — multi-step form with document upload
4. Application Detail — timeline, status history, documents, actions
5. Notifications Center — email/SMS preference and notification history
6. Processor Queue — filterable table of pending applications
7. Processor Application Review — detail view with status update controls
8. Admin User Management — role assignment, user list
9. Admin Settings — notification templates, status configuration (read-only placeholders)

USER FLOWS
----------
Flow A — Submit Application:
  Login → Dashboard → "New Application" → Fill form → Upload documents → Review summary → Submit → Confirmation screen → Dashboard (status: Submitted)

Flow B — Track Status:
  Login → Dashboard → Select application → View detail + status timeline → (optional) View notification history

Flow C — Processor Review:
  Login → Processor Queue → Filter by status → Open application → Review documents → Update status (e.g. In Review → Approved / Rejected / Needs Info) → Confirmation toast

Flow D — Admin Management:
  Login → Admin panel → Users list → Assign role (Applicant / Processor / Admin) → Save

KEY UI COMPONENTS
---------------
• Top navigation bar with logo, user menu, role indicator
• Status badge component (color-coded pills)
• Application card (title, reference number, date, status, progress indicator)
• Data table with sorting, filtering, pagination (processor queue)
• Multi-step form wizard with progress stepper
• File upload dropzone with file list and size indicator
• Status timeline (vertical stepper showing history)
• Toast notifications for success/error feedback
• Modal dialogs for confirmations (status change, delete document)
• Empty state illustrations
• Loading skeletons for lists and detail views

FORM FIELDS (New Application)
-------------------------------
Step 1 — Personal Info:
  • Full name (text, required)
  • Email (email, required)
  • Phone (tel, required)
  • Date of birth (date picker)

Step 2 — Application Details:
  • Application type (dropdown: Type A, Type B, Type C)
  • Description (textarea, required)
  • Preferred contact method (radio: Email / SMS)

Step 3 — Documents:
  • Identity document (file upload, PDF/JPG/PNG, max 10 MB)
  • Supporting documents (multi-file upload, max 50 MB total)

Step 4 — Review & Submit:
  • Summary of all entered data
  • Terms acceptance checkbox
  • Submit button

APPLICATION STATUSES
--------------------
• Draft — grey badge, editable
• Submitted — red accent badge, read-only
• In Review — amber badge, processor action pending
• Needs Info — orange badge, applicant may upload additional docs
• Approved — green badge, final
• Rejected — red badge, final with reason field

Show status transitions visually on the timeline. Processor can only change status via dropdown + confirm modal.

NOTIFICATION BEHAVIOR
---------------------
• Trigger notifications on status change (Submitted, In Review, Needs Info, Approved, Rejected)
• Notification preference toggle: Email / SMS / Both
• In-app notification bell with unread count
• Notification list item: icon, message, timestamp, read/unread state
• Show a "notification sent" confirmation after processor status update (demo prototype)

PERMISSION CONSIDERATIONS
-------------------------
• Applicants see ONLY their own applications — no access to other users' data
• Processors see assigned queue only — no admin settings access
• Administrators see all applications and user management
• Visually indicate current role in header (e.g. badge: "Processor")
• Hide navigation items based on role (applicant nav vs processor nav vs admin nav)

EMPTY STATES
------------
• Dashboard with no applications: illustration + "Submit your first application" CTA
• Processor queue with no pending items: "All caught up" message
• Notifications empty: "No notifications yet"
• Search/filter with no results: "No applications match your filters"

ERROR STATES
------------
• Form validation errors inline below fields (red text + border)
• File upload too large: error message with size limit info
• Failed submission: error banner with retry button
• Session expired: modal prompting re-login
• Unauthorized access: full-page "Access denied" with back link

LOADING STATES
--------------
• Skeleton loaders for dashboard cards (3 placeholder cards)
• Spinner on submit button during form submission
• Shimmer effect on processor queue table rows
• Loading overlay on status update action

RESPONSIVE DESIGN REQUIREMENTS
------------------------------
• Desktop (1280px+): three-column dashboard layout, side navigation
• Tablet (768–1279px): two-column layout, collapsible sidebar
• Mobile (< 768px): single column, bottom tab navigation, stacked form steps
• Touch-friendly tap targets (min 44px)
• Tables become card lists on mobile

VISUAL STYLE DIRECTION
----------------------
• Clean, professional, government/enterprise-friendly aesthetic
• Color palette: near-black primary (#101010), red accent (#FF3B30), warm neutral backgrounds
• Status colors: grey (draft), red accent (submitted), amber (in review), orange (needs info), green (approved), red (rejected)
• Typography: modern sans-serif (Inter or similar), clear hierarchy
• Generous whitespace, subtle shadows, rounded corners (8–12px)
• Accessible contrast ratios (WCAG 2.1 AA)
• Consistent 8px spacing grid

OPEN QUESTIONS FOR UX CLARIFICATION
------------------------------------
• Should SMS be opt-in or default-on for all users?
• What happens when an application is in "Needs Info" — does the applicant get an editable form or upload-only?
• Is there a dashboard for administrators showing aggregate stats, or only user management?
• Should document preview be inline or download-only?
• What branding/logo should appear — client-provided or generic placeholder?
• Are there multiple application types with different form fields, or one standard form?
• Should the processor queue support bulk actions (approve multiple)?

DELIVERABLE
-----------
Create a clickable prototype with all main screens linked via hotspots. Use realistic placeholder content. Include at least one complete flow (submit → track → processor review → notification). Label frames clearly by screen name and user role.`;

/**
 * Mock Figma prompt generator.
 *
 * Future OpenAI integration: Replace with a structured prompt that takes the
 * analysis input and review results, returning a Figma-ready design brief.
 */
export async function generateFigmaPrompt(
  _input: string,
  _reviewResult?: ReviewResult,
): Promise<string> {
  await delay(800);
  return MOCK_FIGMA_PROMPT;
}
