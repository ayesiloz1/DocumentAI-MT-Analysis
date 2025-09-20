// API service for document analysis
import { DocumentAnalysisResult, AnalyzeTextRequest, AnalysisCapabilities } from '../types/documentAnalysis';

export class DocumentAnalysisAPI {
  /**
   * Analyze a PDF document
   */
  static async analyzePDF(
    file: File,
    options: {
      documentType?: string;
      performGrammarCheck?: boolean;
      performStyleCheck?: boolean;
      performTechnicalReview?: boolean;
      performComplianceCheck?: boolean;
    } = {}
  ): Promise<DocumentAnalysisResult> {
    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('documentType', options.documentType || 'general');
    formData.append('performGrammarCheck', String(options.performGrammarCheck ?? true));
    formData.append('performStyleCheck', String(options.performStyleCheck ?? true));
    formData.append('performTechnicalReview', String(options.performTechnicalReview ?? true));
    formData.append('performComplianceCheck', String(options.performComplianceCheck ?? false));

    const response = await fetch(`/api/documentanalysis/analyze-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Analyze text content
   */
  static async analyzeText(request: AnalyzeTextRequest): Promise<DocumentAnalysisResult> {
    const response = await fetch(`/api/documentanalysis/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get analysis capabilities
   */
  static async getCapabilities(): Promise<AnalysisCapabilities> {
    const response = await fetch(`/api/documentanalysis/capabilities`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get analysis history (placeholder)
   */
  static async getHistory(): Promise<any[]> {
    const response = await fetch(`/api/documentanalysis/history`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}