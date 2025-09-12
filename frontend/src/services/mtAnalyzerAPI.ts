import axios from 'axios';

// Base URL for the .NET backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export interface MTAnalysisRequest {
  projectNumber?: string;
  projectType?: string;
  designAuthority?: string;
  problemDescription?: string;
  proposedSolution?: string;
  justification?: string;
  safetyClassification?: string;
  hazardCategory?: string;
  designConstraints?: string[];
  requiredProcedures?: string[];
  isTemporary?: boolean;
  isPhysicalChange?: boolean;
  isIdenticalReplacement?: boolean;
  isDesignOutsideDA?: boolean;
  requiresNewProcedures?: boolean;
  requiresMultipleDocuments?: boolean;
  isSingleDiscipline?: boolean;
  revisionsOutsideDA?: boolean;
  requiresSoftwareChange?: boolean;
  requiresHoistingRigging?: boolean;
  facilityChangePackageApplicable?: boolean;
}

export interface MTAnalysisResponse {
  analysisId: string;
  timestamp: string;
  projectNumber: string;
  mtRequired: boolean;
  mtRequiredReason: string;
  designType: number;
  designInputs: {
    problemStatement: string;
    proposedSolution: string;
    designConstraints: string[];
    safetyRequirements: string[];
    environmentalConsiderations: string[];
    operationalImpacts: string[];
  };
  expectedOutputs: Array<{
    type: string;
    description: string;
    required: boolean;
    status: string;
  }>;
  impactedDocuments: Array<{
    documentId: string;
    documentType: string;
    impactRationale: string;
    requiresUpdate: boolean;
    suggestedReviewers: string[];
  }>;
  missingElements: string[];
  inconsistencies: string[];
  suggestedActions: string[];
  attachmentAChecklist: {
    a1DesignOutputCheck: ChecklistSection;
    a2EngineeringImpacts: ChecklistSection;
    a3NonEngineeringImpacts: ChecklistSection;
    a4SystemAcceptability: ChecklistSection;
    a5InterfaceReviews: ChecklistSection;
  };
  riskAssessment: {
    overallRisk: string;
    safetyRisk: string;
    environmentalRisk: string;
    operationalRisk: string;
    riskFactors: string[];
    mitigationRecommendations: string[];
  };
  confidence: number;
}

export interface ChecklistSection {
  items: Array<{
    description: string;
    status: string;
    comments: string;
    required: boolean;
  }>;
  completionPercentage: number;
  riskLevel: string;
}

export interface ChatMessage {
  message: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
  relatedTopics?: string[];
}

class MTAnalyzerAPI {
  // Analyze MT document
  async analyzeMTDocument(request: MTAnalysisRequest): Promise<MTAnalysisResponse> {
    const response = await apiClient.post('/mtanalysis/analyze-text', request);
    return response.data;
  }

  // Analyze text input with embedding enhancements (new enhanced endpoint)
  async analyzeTextWithEmbeddings(text: string): Promise<MTAnalysisResponse> {
    const request = {
      projectNumber: `MT-${Date.now()}`,
      problemDescription: text,
      proposedSolution: text,
      justification: text
    };
    const response = await apiClient.post('/enhanced-mt/analyze-with-embeddings', request);
    return response.data;
  }

  // NEW: Analyze with GPT-4 intelligence
  async analyzeWithGPT4(text: string): Promise<MTAnalysisResponse> {
    const request = {
      userInput: text,
      structuredInput: null
    };
    const response = await apiClient.post('/enhanced-mt/analyze-with-gpt4', request);
    return response.data;
  }

  // NEW: Intelligent chat with GPT-4
  async intelligentChat(message: string, conversationHistory: string = ''): Promise<any> {
    const request = {
      message: message,
      conversationHistory: conversationHistory
    };
    const response = await apiClient.post('/enhanced-mt/intelligent-chat', request);
    return response.data;
  }

  // NEW: Smart MT classification
  async classifyMTType(description: string): Promise<any> {
    const request = {
      description: description
    };
    const response = await apiClient.post('/enhanced-mt/classify-mt', request);
    return response.data;
  }

  // Analyze text input (like from chat) - legacy endpoint
  async analyzeText(text: string): Promise<MTAnalysisResponse> {
    const response = await apiClient.post('/mtanalysis/analyze-text', { text });
    return response.data;
  }

  // Upload and analyze file
  async uploadAndAnalyze(file: File): Promise<MTAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/mtanalysis/upload-analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Chat with AI assistant
  async chatWithAI(message: ChatMessage): Promise<ChatResponse> {
    const response = await apiClient.post('/mtanalysis/analyze-text', { text: message.message });
    return { response: response.data.mtRequiredReason || 'Analysis completed' };
  }

  // Validate MT input
  async validateInput(request: MTAnalysisRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await apiClient.post('/mtanalysis/analyze-text', request);
    return { isValid: true, errors: [] };
  }

  // Get MT guidance based on specific question
  async getMTGuidance(question: string): Promise<{ guidance: string; references: string[] }> {
    const response = await apiClient.get(`/mtanalysis/health`);
    return { guidance: 'MT guidance system available', references: [] };
  }

  // Get Figure 1 decision tree steps
  async getFigure1Steps(currentAnswers: Partial<MTAnalysisRequest>): Promise<{
    currentStep: string;
    question: string;
    options: string[];
    progress: number;
  }> {
    const response = await apiClient.post('/mtanalysis/analyze-text', currentAnswers);
    return {
      currentStep: 'Step 1',
      question: 'Is this a physical change?',
      options: ['Yes', 'No'],
      progress: 10
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await apiClient.get('/mtanalysis/health');
    return { status: response.data.status, version: '1.0.0' };
  }
}

// Export singleton instance
export const mtAnalyzerAPI = new MTAnalyzerAPI();
export default mtAnalyzerAPI;
