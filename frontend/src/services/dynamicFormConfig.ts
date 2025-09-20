// ============================================================================
// DYNAMIC FORM CONFIGURATION SERVICE
// AI-driven form configuration instead of hardcoded values
// ============================================================================

import { aiProjectAnalysis } from './aiProjectAnalysis';

interface FormConfiguration {
  formNumber: string;
  formRevision: string;
  formDate: string;
  formTitle: string;
  pageCount: number;
  preparedFor: string;
  preparedBy: string;
  contractorInfo: string;
  contractNumber: string;
  formReference: string;
  disclaimer: string;
}

interface FacilityContext {
  facilityName?: string;
  facilityType?: string;
  location?: string;
  operator?: string;
  regulatoryAuthority?: string;
}

export class DynamicFormConfigService {
  private static instance: DynamicFormConfigService;
  private defaultConfig: FormConfiguration;

  constructor() {
    this.defaultConfig = {
      formNumber: 'MT-DYNAMIC',
      formRevision: 'Rev.00',
      formDate: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      formTitle: 'MODIFICATION TRAVELER',
      pageCount: 2,
      preparedFor: 'Facility Owner/Operator',
      preparedBy: 'Engineering Department',
      contractorInfo: 'As determined by facility requirements',
      contractNumber: 'As applicable',
      formReference: 'Per facility procedures',
      disclaimer: 'This document was generated using AI analysis. All information must be reviewed and validated by qualified personnel before use.'
    };
  }

  public static getInstance(): DynamicFormConfigService {
    if (!DynamicFormConfigService.instance) {
      DynamicFormConfigService.instance = new DynamicFormConfigService();
    }
    return DynamicFormConfigService.instance;
  }

  /**
   * Generate form configuration dynamically based on facility context and AI analysis
   */
  async generateFormConfig(facilityContext: FacilityContext = {}): Promise<FormConfiguration> {
    try {
      // Use AI to determine appropriate form configuration
      const response = await fetch('http://localhost:5000/api/MT/intelligent-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.buildConfigPrompt(facilityContext),
          conversationHistory: JSON.stringify([])
        })
      });

      if (response.ok) {
        const aiResult = await response.json();
        return this.parseConfigResponse(aiResult, facilityContext);
      }
    } catch (error) {
      console.error('AI form config generation failed:', error);
    }

    // Fallback to enhanced default config
    return this.generateFallbackConfig(facilityContext);
  }

  private buildConfigPrompt(facilityContext: FacilityContext): string {
    return `
Analyze the following facility information and generate appropriate modification traveler form configuration:

FACILITY CONTEXT:
- Facility Name: ${facilityContext.facilityName || 'Not specified'}
- Facility Type: ${facilityContext.facilityType || 'Nuclear facility'}
- Location: ${facilityContext.location || 'Not specified'}
- Operator: ${facilityContext.operator || 'Not specified'}
- Regulatory Authority: ${facilityContext.regulatoryAuthority || 'Not specified'}

Please provide the following form configuration elements:

1. FORM NUMBER: Appropriate form number for this facility type
2. FORM TITLE: Proper title for modification documentation
3. PREPARED FOR: Correct organization/authority the form is prepared for
4. PREPARED BY: Appropriate organization preparing the form
5. CONTRACT INFO: Relevant contract or organizational information
6. CONTRACT NUMBER: If applicable, relevant contract number
7. FORM REFERENCE: Applicable procedure or standard reference
8. DISCLAIMER: Appropriate legal disclaimer for this facility type

Base your response on:
- Nuclear industry standards
- Regulatory requirements (NRC, DOE, etc.)
- Facility-specific procedures
- Industry best practices

Provide realistic, professional responses suitable for nuclear facility documentation.
`;
  }

  private parseConfigResponse(aiResult: any, facilityContext: FacilityContext): FormConfiguration {
    const analysis = aiResult.response || aiResult.Response || '';
    
    return {
      formNumber: this.extractValue(analysis, 'FORM NUMBER') || this.generateDynamicFormNumber(),
      formRevision: 'Rev.00',
      formDate: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      formTitle: this.extractValue(analysis, 'FORM TITLE') || 'MODIFICATION TRAVELER',
      pageCount: 2,
      preparedFor: this.extractValue(analysis, 'PREPARED FOR') || facilityContext.regulatoryAuthority || 'Facility Owner/Operator',
      preparedBy: this.extractValue(analysis, 'PREPARED BY') || facilityContext.operator || 'Engineering Department',
      contractorInfo: this.extractValue(analysis, 'CONTRACT INFO') || 'As determined by facility requirements',
      contractNumber: this.extractValue(analysis, 'CONTRACT NUMBER') || 'As applicable',
      formReference: this.extractValue(analysis, 'FORM REFERENCE') || 'Per facility procedures',
      disclaimer: this.extractValue(analysis, 'DISCLAIMER') || this.defaultConfig.disclaimer
    };
  }

  private extractValue(text: string, section: string): string | null {
    const regex = new RegExp(`${section}:?\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private generateDynamicFormNumber(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `MT-${year}-${randomNum}`;
  }

  private generateFallbackConfig(facilityContext: FacilityContext): FormConfiguration {
    return {
      ...this.defaultConfig,
      formNumber: this.generateDynamicFormNumber(),
      preparedFor: facilityContext.regulatoryAuthority || this.defaultConfig.preparedFor,
      preparedBy: facilityContext.operator || this.defaultConfig.preparedBy,
      contractorInfo: facilityContext.operator ? `${facilityContext.operator} - Engineering Services` : this.defaultConfig.contractorInfo
    };
  }

  /**
   * Quick config generation for real-time use
   */
  getQuickConfig(facilityContext: FacilityContext = {}): FormConfiguration {
    return {
      ...this.defaultConfig,
      formNumber: this.generateDynamicFormNumber(),
      preparedFor: facilityContext.regulatoryAuthority || 'Regulatory Authority',
      preparedBy: facilityContext.operator || 'Facility Engineering',
      formDate: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  }

  /**
   * Update configuration based on AI analysis results
   */
  async updateConfigFromAnalysis(analysisResult: any, facilityContext: FacilityContext = {}): Promise<FormConfiguration> {
    const baseConfig = await this.generateFormConfig(facilityContext);
    
    // Enhance config based on analysis results
    if (analysisResult.safetyClassification) {
      if (analysisResult.safetyClassification.includes('Safety-Related')) {
        baseConfig.formReference = 'Per 10 CFR 50 Appendix B and facility QA procedures';
      }
    }
    
    if (analysisResult.priority === 'Critical') {
      baseConfig.formTitle = 'URGENT MODIFICATION TRAVELER';
    }
    
    return baseConfig;
  }
}

// Export singleton instance
export const dynamicFormConfig = DynamicFormConfigService.getInstance();

export default DynamicFormConfigService;