// Document Analysis Types
export interface DocumentAnalysisResult {
  documentId: string;
  analysisTimestamp: string;
  metadata: DocumentMetadata;
  qualityScore: OverallQualityScore;
  grammar: GrammarAnalysis;
  style: StyleAnalysis;
  technical: TechnicalAnalysis;
  compliance?: ComplianceAnalysis;
  suggestions: ImprovementSuggestion[];
  summary: string;
  isAnalysisSuccessful: boolean;
  errorMessage?: string;
}

export interface DocumentMetadata {
  fileName: string;
  documentType: string;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readabilityScore: number;
  readabilityLevel: string;
}

export interface OverallQualityScore {
  overall: number;
  grammar: number;
  style: number;
  clarity: number;
  technical: number;
  compliance: number;
  rating: QualityRating;
  explanation: string;
}

export interface GrammarAnalysis {
  totalIssues: number;
  issues: GrammarIssue[];
  issueTypeFrequency: Record<string, number>;
  accuracyScore: number;
}

export interface GrammarIssue {
  type: string;
  description: string;
  context: string;
  suggestion: string;
  startPosition: number;
  length: number;
  severity: Severity;
  confidence: number;
}

export interface StyleAnalysis {
  clarityScore: number;
  consistencyScore: number;
  concisionScore: number;
  professionalismScore: number;
  issues: StyleIssue[];
  statistics: WritingStatistics;
}

export interface StyleIssue {
  type: string;
  description: string;
  context: string;
  suggestion: string;
  severity: Severity;
}

export interface WritingStatistics {
  averageSentenceLength: number;
  averageWordsPerParagraph: number;
  passiveVoiceCount: number;
  complexSentenceCount: number;
  wordFrequency: Record<string, number>;
  technicalTerms: string[];
}

export interface TechnicalAnalysis {
  technicalAccuracyScore: number;
  terminologyConsistencyScore: number;
  structureScore: number;
  issues: TechnicalIssue[];
  identifiedStandards: string[];
  technicalTerms: string[];
  hasProperTechnicalStructure: boolean;
}

export interface TechnicalIssue {
  type: string;
  description: string;
  context: string;
  suggestion: string;
  severity: Severity;
  relatedStandards: string[];
}

export interface ComplianceAnalysis {
  complianceFramework: string;
  complianceScore: number;
  issues: ComplianceIssue[];
  requiredElements: string[];
  missingElements: string[];
  meetsMinimumRequirements: boolean;
}

export interface ComplianceIssue {
  standard: string;
  requirement: string;
  description: string;
  context: string;
  suggestion: string;
  severity: Severity;
  isMandatory: boolean;
}

export interface ImprovementSuggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  detailedExplanation: string;
  beforeExample: string;
  afterExample: string;
  priority: Priority;
  impact: Severity;
  estimatedEffortMinutes: number;
  applicableSections: string[];
  isActionable: boolean;
}

export enum QualityRating {
  Unknown = 'Unknown',
  Excellent = 'Excellent',
  Good = 'Good',
  Satisfactory = 'Satisfactory',
  NeedsImprovement = 'NeedsImprovement',
  Poor = 'Poor'
}

export enum Severity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

// Analysis request types
export interface DocumentAnalysisRequest {
  pdfFile?: File;
  documentText?: string;
  documentType: string;
  performGrammarCheck: boolean;
  performStyleCheck: boolean;
  performTechnicalReview: boolean;
  performComplianceCheck: boolean;
}

export interface AnalyzeTextRequest {
  documentText: string;
  documentType?: string;
  performGrammarCheck: boolean;
  performStyleCheck: boolean;
  performTechnicalReview: boolean;
  performComplianceCheck: boolean;
}

export interface AnalysisCapabilities {
  supportedFileTypes: string[];
  maxFileSize: number;
  maxTextLength: number;
  supportedDocumentTypes: string[];
  analysisFeatures: string[];
  complianceFrameworks: string[];
}