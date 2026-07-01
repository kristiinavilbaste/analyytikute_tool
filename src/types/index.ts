export type Severity = 'Low' | 'Medium' | 'High';

export type ReadinessStatus =
  | 'Not ready'
  | 'Needs clarification'
  | 'Ready for refinement'
  | 'Ready for development';

export interface RoleFinding {
  role: string;
  findings: string[];
  severity: Severity;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  impact: string;
  mitigation: string;
  questionToAsk: string;
}

export interface Assumption {
  id: string;
  text: string;
}

export interface CriticalQuestion {
  id: string;
  text: string;
  priority: Severity;
}

export interface QualityCategory {
  id: string;
  name: string;
  /** Category score on a 0–10 scale (not 0–100). */
  score: number;
  rationale: string;
  mainGap: string;
  recommendation: string;
}

export interface ReviewResult {
  qualityScore: number;
  readinessStatus: ReadinessStatus;
  executiveSummary: string;
  roleFindings: RoleFinding[];
  qualityCategories: QualityCategory[];
  topRisks: Risk[];
  hiddenAssumptions: Assumption[];
  criticalQuestions: CriticalQuestion[];
}

export interface HandoffPack {
  featureSummary: string;
  businessGoal: string;
  scope: string[];
  outOfScope: string[];
  userRoles: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  businessRules: string[];
  dataAndIntegrations: string[];
  userStories: string[];
  acceptanceCriteria: string[];
  edgeCases: string[];
  risks: string[];
  openQuestions: string[];
  technicalNotes: string[];
  recommendationForRefinement: string;
}

export interface FigmaPromptResult {
  prompt: string;
}

export type FileExtractionStatus = 'pending' | 'extracting' | 'ready' | 'failed';

export interface UploadedAnalysisFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: FileExtractionStatus;
  error?: string;
  extractedText?: string;
}

export interface FileExtractionResult {
  fileName: string;
  text: string;
  error?: string;
}

export interface AppState {
  analysisInput: string;
  extractedText: string;
  uploadedFiles: UploadedAnalysisFile[];
  reviewResult: ReviewResult | null;
  handoffPack: HandoffPack | null;
  figmaPrompt: string;
}
