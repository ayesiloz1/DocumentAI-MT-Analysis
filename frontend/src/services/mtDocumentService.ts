export interface MTFormConfig {
  // Form metadata that can be configured
  formNumber?: string;
  formRevision?: string;
  formDate?: string;
  formTitle?: string;
  pageCount?: number;
  
  // Organization information
  preparedFor?: string;
  preparedBy?: string;
  contractorInfo?: string;
  contractNumber?: string;
  
  // Footer information
  formReference?: string;
  disclaimer?: string;
}

export interface MTDocumentData {
  // Header Information
  mtNumber?: string;
  revision?: string;
  
  // Section I - Document Information
  projectNumber?: string;
  title?: string;
  facility?: string;
  submittedBy?: string;
  submissionDate?: string;
  estimatedStartDate?: string;
  estimatedCompleteDate?: string;
  dueDate?: string;
  priority?: string;
  
  // Section I - Request for Modification
  requestedCompletionDate?: string;
  cacn?: string;
  projectType?: string;
  relatedBuildings?: string;
  relatedSystems?: string;
  relatedEquipment?: string;
  problemDescription?: string;
  proposedSolution?: string;
  
  // Section II - Required for Design Type 1 Projects
  projectDesignReviewRequired?: 'Yes' | 'No' | 'N/A';
  majorModificationEvaluationRequired?: 'Yes' | 'No' | 'N/A';
  safetyInDesignStrategyRequired?: 'Yes' | 'No' | 'N/A';
  
  // Section II - Scope of Work  
  description?: string;
  justification?: string;
  scopeOfWork?: string;
  workLocation?: string;
  
  // Section IV - Design Input Record
  designInputs?: string;
  designInputConsiderations?: string;
  applicableCodes?: string;
  designCriteria?: string;
  environmentalConditions?: string;
  interfaceRequirements?: string;
  
  // Section III - MT Determination
  mtRequired?: boolean;
  mtRequiredReason?: string;
  hazardCategory?: string;
  designType?: string;
  analysisPath?: string;
  confidence?: number;
  
  // Section IV - Risk Assessment (optional)
  riskAssessment?: {
    overallRisk: string;
    safetyRisk: string;
    environmentalRisk: string;
    operationalRisk: string;
    riskFactors?: string[];
    mitigationRecommendations?: string[];
  };
  
  // Page 2 Risk Classifications
  preliminarySafetyClassification?: 'SC' | 'SS' | 'GS' | 'N/A';
  environmentalRisk?: 'Yes' | 'No';
  radiologicalRisk?: 'Yes' | 'No';
  approvalDesignators?: string;
  
  // Section VI - Design Output Record  
  workPackageNumbers?: string;
  otherOutputs?: string;
  
  // Section VII - Impact Assessment
  safetyImpacts?: string;
  operationalImpacts?: string;
  maintenanceImpacts?: string;
  otherImpacts?: string;
  
  // Attachment A Checklist
  attachmentA?: {
    structuralSystems?: ChecklistItem[];
    mechanicalSystems?: ChecklistItem[];
    electricalSystems?: ChecklistItem[];
    instrumentationSystems?: ChecklistItem[];
    safetySystems?: ChecklistItem[];
    qualityAssurance?: ChecklistItem[];
    environmentalCompliance?: ChecklistItem[];
  };
  
  // Approval signatures
  preparedBy?: string;
  preparedDate?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface ChecklistItem {
  description: string;
  status: 'Complete' | 'Pending' | 'N/A';
  comments?: string;
  reviewer?: string;
  date?: string;
}

export interface MTAnalysisResponse {
  analysis: string;
  mtRequired: boolean;
  confidence: number;
  reasoning: string;
  designType?: number;
  safetyClassification?: string;
  hazardAnalysis?: any;
  riskAssessment?: any;
  attachmentAResults?: any;
}

class MTDocumentService {
  private static instance: MTDocumentService;
  
  private documentData: Partial<MTDocumentData> = {};
  private formConfig: MTFormConfig = {};
  private progressCallbacks: ((progress: number) => void)[] = [];
  private documentPreviewCallbacks: ((preview: string) => void)[] = [];
  private templateBuffer: ArrayBuffer | null = null;

  private constructor() {
    // Set default configuration
    this.setDefaultFormConfig();
  }

  private setDefaultFormConfig(): void {
    this.formConfig = {
      formNumber: 'MT-50231',
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
      preparedFor: 'U.S. Department of Energy, Assistant Secretary for Environmental Management',
      preparedBy: 'Washington River Protection Solutions, LLC., PO Box 850, Richland, WA 99352',
      contractorInfo: 'Contractor For U.S. Department of Energy, Office of River Protection',
      contractNumber: 'Contract DE-AC27-08RV14800',
      formReference: 'SPF-015 (Rev.B1)',
      disclaimer: 'Reference herein to any specific commercial product, process, or service by trade name, trademark, manufacturer, or otherwise, does not necessarily constitute or imply its endorsement, recommendation, or favoring by the United States Government or any agency thereof or its contractors or subcontractors. Printed in the United States of America.'
    };
  }

  public static getInstance(): MTDocumentService {
    if (!MTDocumentService.instance) {
      MTDocumentService.instance = new MTDocumentService();
    }
    return MTDocumentService.instance;
  }

  // Load the DOCX template for document generation
  async loadTemplate(): Promise<void> {
    if (this.templateBuffer) return;

    try {
      // Create template dynamically using our MT template creator
      const { createMTTemplate } = await import('../utils/createMTTemplate');
      const templateBlob = await createMTTemplate();
      this.templateBuffer = await templateBlob.arrayBuffer();
      console.log('MT template loaded successfully');
    } catch (error) {
      console.error('Error loading MT template:', error);
      throw new Error('Failed to load document template');
    }
  }

  // Subscribe to progress updates
  onProgressUpdate(callback: (progress: number) => void): void {
    this.progressCallbacks.push(callback);
  }

  // Subscribe to document preview updates  
  onDocumentPreview(callback: (preview: string) => void): void {
    this.documentPreviewCallbacks.push(callback);
  }

  // Configure form metadata
  setFormConfig(config: Partial<MTFormConfig>): void {
    this.formConfig = { ...this.formConfig, ...config };
  }

  // Get current form configuration
  getFormConfig(): MTFormConfig {
    return { ...this.formConfig };
  }

  // Calculate completion progress based on filled fields
  calculateProgress(): number {
    const requiredFields = [
      'projectNumber', 'title', 'facility', 'submittedBy', 'description',
      'justification', 'mtRequired', 'mtRequiredReason', 'designType'
    ];
    
    const filledFields = requiredFields.filter(field => 
      this.documentData[field as keyof MTDocumentData] !== undefined && 
      this.documentData[field as keyof MTDocumentData] !== ''
    );
    
    return Math.round((filledFields.length / requiredFields.length) * 100);
  }

  // Generate HTML preview of the document matching the exact MT-50231 format
  generatePreviewHTML(): string {
    const data = this.documentData;
    
    return `
    <style>
      .mt-document-container {
        font-family: 'Times New Roman', serif;
        line-height: 1.2;
        color: #000;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
        font-size: 10pt;
      }
      .mt-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
      }
      .mt-table td {
        border: 1px solid #000;
        padding: 4px 6px;
        vertical-align: top;
        font-size: 9pt;
      }
      .mt-header-cell {
        background-color: #f0f0f0;
        font-weight: bold;
        font-size: 9pt;
      }
      .mt-section-header {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: center;
        font-size: 10pt;
        border: 2px solid #000;
        padding: 6px;
        margin: 8px 0 4px 0;
      }
      .mt-checkbox {
        font-family: Arial, sans-serif;
        font-size: 12pt;
      }
      .mt-header-info {
        text-align: center;
        font-size: 8pt;
        line-height: 1.1;
        margin-bottom: 8px;
      }
      .mt-form-header {
        font-size: 8pt;
        text-align: right;
        margin-bottom: 4px;
      }
      .mt-title {
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
        margin: 8px 0;
      }
      .release-stamp {
        float: right;
        width: 2in;
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
        font-size: 8pt;
        margin-left: 16px;
      }
      .clearfix::after {
        content: "";
        display: table;
        clear: both;
      }
    </style>
    
    <div class="mt-document-container">
      <!-- Header with form number and title -->
      <div class="mt-form-header">${this.formConfig.formNumber} ${this.formConfig.formRevision} ${this.formConfig.formDate} 1 of ${this.formConfig.pageCount}</div>
      
      <div class="clearfix">
        <div class="release-stamp">
          <div style="font-weight: bold;">Release Stamp</div>
          <div style="margin: 8px 0;">Clearance Review Restriction Type</div>
          <div style="border: 1px solid #ccc; height: 80px; margin-top: 8px;"></div>
        </div>
        
        <div class="mt-title">${this.formConfig.formTitle}</div>
      </div>
      
      <div class="mt-header-info">
        Prepared For the ${this.formConfig.preparedFor}<br>
        By ${this.formConfig.preparedBy}<br>
        ${this.formConfig.contractorInfo}, under ${this.formConfig.contractNumber}<br>
        <br>
        ${this.formConfig.disclaimer}
      </div>

      <!-- Section with MT No and Title -->
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 15%;">1. MT No:</td>
          <td style="width: 15%;">${this.formatFieldValue(data.mtNumber, '')}</td>
          <td class="mt-header-cell" style="width: 10%;">Rev.</td>
          <td style="width: 60%;"></td>
        </tr>
        <tr>
          <td class="mt-header-cell">2. Title:</td>
          <td colspan="3">${this.formatFieldValue(data.title, '')}</td>
        </tr>
      </table>

      <!-- Section I: Request for Modification -->
      <div class="mt-section-header">SECTION I REQUEST FOR MODIFICATION</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 40%;">3. Requested Completion Date (Optional):</td>
          <td style="width: 25%;">${this.formatFieldValue(data.requestedCompletionDate, '')}</td>
          <td class="mt-header-cell" style="width: 20%;">4. CACN (optional)</td>
          <td style="width: 15%;"></td>
        </tr>
        <tr>
          <td class="mt-header-cell">5. Project Number: <span class="mt-checkbox">☐</span></td>
          <td>${this.formatFieldValue(data.projectNumber, '')}</td>
          <td class="mt-header-cell">6. Design Type:</td>
          <td class="mt-header-cell">7. Project Type:</td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td>
            <span class="mt-checkbox">☐</span> I <span class="mt-checkbox">☐</span> II <span class="mt-checkbox">☐</span> III <span class="mt-checkbox">☐</span> IV <span class="mt-checkbox">☐</span> V <span class="mt-checkbox">☐</span> VI
          </td>
          <td></td>
        </tr>
      </table>

      <!-- Related Structures, Systems, and Components -->
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" colspan="4">8. Related Structures, Systems, and Components</td>
        </tr>
        <tr>
          <td class="mt-header-cell" style="width: 33%;">a. Related Building/Facilities <span class="mt-checkbox">☐</span> N/A</td>
          <td class="mt-header-cell" style="width: 33%;">b. Related Systems <span class="mt-checkbox">☐</span> N/A</td>
          <td class="mt-header-cell" style="width: 34%;">c. Related Equipment ID Nos. (EIN) <span class="mt-checkbox">☐</span> N/A</td>
        </tr>
        <tr>
          <td style="height: 40px; vertical-align: top;">${this.formatFieldValue(data.relatedBuildings, '')}</td>
          <td style="height: 40px; vertical-align: top;">${this.formatFieldValue(data.relatedSystems, '')}</td>
          <td style="height: 40px; vertical-align: top;">${this.formatFieldValue(data.relatedEquipment, '')}</td>
        </tr>
      </table>

      <!-- Problem Description -->
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">9. Problem Description</td>
        </tr>
        <tr>
          <td style="height: 80px; vertical-align: top;">${this.formatFieldValue(data.problemDescription || data.description, '')}</td>
        </tr>
      </table>

      <!-- Justification -->
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">10. Justification</td>
        </tr>
        <tr>
          <td style="height: 80px; vertical-align: top;">${this.formatFieldValue(data.justification, '')}</td>
        </tr>
      </table>

      <!-- Section II: Required for Design Type 1 Projects -->
      <div class="mt-section-header">SECTION II REQUIRED FOR DESIGN TYPE 1 PROJECTS</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 33%;">11a. Project Design Review<br>Required (TFC-ENG-DESIGN-D-17.1)?</td>
          <td class="mt-header-cell" style="width: 33%;">11b. Major Modification Evaluation<br>Required (Use 1189 Checklist)?</td>
          <td class="mt-header-cell" style="width: 34%;">11c. Safety In Design Strategy<br>Required?</td>
        </tr>
        <tr>
          <td>
            <span class="mt-checkbox">☐</span> Yes <span class="mt-checkbox">☐</span> No <span class="mt-checkbox">☐</span> N/A
          </td>
          <td>
            <span class="mt-checkbox">☐</span> Yes <span class="mt-checkbox">☐</span> No <span class="mt-checkbox">☐</span> N/A
          </td>
          <td>
            <span class="mt-checkbox">☐</span> Yes <span class="mt-checkbox">☐</span> No <span class="mt-checkbox">☐</span> N/A
          </td>
        </tr>
      </table>

      <!-- Section III: Proposed Solution -->
      <div class="mt-section-header">SECTION III PROPOSED SOLUTION</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">12. Proposed Solution</td>
        </tr>
        <tr>
          <td style="height: 100px; vertical-align: top;">${this.formatFieldValue(data.proposedSolution, '')}</td>
        </tr>
      </table>

      <!-- Section IV: Design Input Record -->
      <div class="mt-section-header">SECTION IV DESIGN INPUT RECORD</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">13. Design Inputs <span class="mt-checkbox">☐</span> N/A</td>
        </tr>
        <tr>
          <td style="height: 60px; vertical-align: top;">${this.formatFieldValue(data.designInputs, '')}</td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 33%;">Type of Document</td>
          <td class="mt-header-cell" style="width: 33%;">Document Number</td>
          <td class="mt-header-cell" style="width: 17%;">Rev.</td>
          <td class="mt-header-cell" style="width: 17%;">Title</td>
        </tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">14. Other Design Input Considerations:</td>
        </tr>
        <tr>
          <td style="height: 100px; vertical-align: top;">${this.formatFieldValue(data.designInputConsiderations, '')}</td>
        </tr>
      </table>

      <!-- Page break indicator -->
      <div style="page-break-before: always; margin-top: 20px;">
        <div class="mt-form-header">${this.formConfig.formNumber} ${this.formConfig.formRevision} ${this.formConfig.formDate} 2 of ${this.formConfig.pageCount}</div>
        <div class="mt-title">${this.formConfig.formTitle}</div>
        
        <table class="mt-table">
          <tr>
            <td class="mt-header-cell" style="width: 15%;">MT No:</td>
            <td style="width: 15%;">${this.formatFieldValue(data.mtNumber, '')}</td>
            <td class="mt-header-cell" style="width: 10%;">Rev.</td>
            <td style="width: 60%;"></td>
          </tr>
        </table>
      </div>

      <!-- Section V: Classification -->
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 33%;">15. Preliminary Safety<br>Classification: <span class="mt-checkbox">☐</span> SC <span class="mt-checkbox">☐</span> SS <span class="mt-checkbox">☐</span> GS<br><span class="mt-checkbox">☐</span> N/A</td>
          <td class="mt-header-cell" style="width: 33%;">15a. Environmental Risk:<br>(TFC-ENG-DESIGN-C-52 Att. D)<br><span class="mt-checkbox">☐</span> Yes <span class="mt-checkbox">☐</span> No</td>
          <td class="mt-header-cell" style="width: 34%;">15b. Radiological Risk:<br>(TFC-ENG-DESIGN-C-52 Att. D)<br><span class="mt-checkbox">☐</span> Yes <span class="mt-checkbox">☐</span> No</td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 50%;">17. Hazard Category</td>
          <td class="mt-header-cell" style="width: 50%;">18. Approval Designators</td>
        </tr>
        <tr>
          <td style="height: 40px;"></td>
          <td style="height: 40px;"></td>
        </tr>
      </table>

      <!-- Section V: Impacts -->
      <div class="mt-section-header">SECTION V IMPACTS</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">19. Impacted Documents <span class="mt-checkbox">☐</span> N/A</td>
        </tr>
        <tr>
          <td style="height: 40px;"></td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 33%;">Type of Document</td>
          <td class="mt-header-cell" style="width: 33%;">Document Number</td>
          <td class="mt-header-cell" style="width: 17%;">Rev.</td>
          <td class="mt-header-cell" style="width: 17%;">Title</td>
        </tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">20. Other Impacts</td>
        </tr>
        <tr>
          <td style="height: 80px;"></td>
        </tr>
      </table>

      <!-- Section VI: Design Output Record -->
      <div class="mt-section-header">SECTION VI DESIGN OUTPUT RECORD</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">21. Design Outputs <span class="mt-checkbox">☐</span> N/A</td>
        </tr>
        <tr>
          <td style="height: 40px;"></td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 33%;">Type of Document</td>
          <td class="mt-header-cell" style="width: 33%;">Document Number</td>
          <td class="mt-header-cell" style="width: 17%;">Rev.</td>
          <td class="mt-header-cell" style="width: 17%;">Title</td>
        </tr>
        <tr><td style="height: 25px;"></td><td></td><td></td><td></td></tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">22. Work Package Numbers: <span class="mt-checkbox">☐</span> N/A</td>
        </tr>
        <tr>
          <td style="height: 40px;"></td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">23. Other Outputs</td>
        </tr>
        <tr>
          <td style="height: 80px;"></td>
        </tr>
      </table>

      <!-- Section VII: Design Input and Closure Approvals -->
      <div class="mt-section-header">SECTION VII DESIGN INPUT AND CLOSURE APPROVALS</div>
      
      <table class="mt-table">
        <tr>
          <td class="mt-header-cell">24. Approvals</td>
        </tr>
      </table>

      <table class="mt-table">
        <tr>
          <td class="mt-header-cell" style="width: 25%;">Title</td>
          <td class="mt-header-cell" style="width: 25%;">Name</td>
          <td class="mt-header-cell" style="width: 25%;">Signature</td>
          <td class="mt-header-cell" style="width: 25%;">Date</td>
        </tr>
        <tr><td style="height: 30px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 30px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 30px;"></td><td></td><td></td><td></td></tr>
        <tr><td style="height: 30px;"></td><td></td><td></td><td></td></tr>
      </table>

      <div style="text-align: right; font-size: 8pt; margin-top: 16px;">
        ${this.formConfig.pageCount} ${this.formConfig.formReference}
      </div>
    </div>
    `;
  }

  // Helper function to format field values with styling
  private formatFieldValue(value: string | undefined, placeholder: string): string {
    if (value && value.trim()) {
      return `<span class="mt-filled-field">${value}</span>`;
    }
    return `<span class="mt-placeholder-field">${placeholder}</span>`;
  }

  // Enhanced helper function to render checkbox options with better styling
  private renderCheckboxes(selectedValue?: string, options: string[] = ['Yes', 'No', 'N/A']): string {
    return options.map(option => {
      const isSelected = selectedValue === option;
      const checkbox = isSelected 
        ? '<span style="color: #059669; font-weight: bold; font-size: 14px;">☑</span>' 
        : '<span style="color: #6b7280; font-size: 14px;">☐</span>';
      const textStyle = isSelected 
        ? 'font-weight: bold; color: #059669;' 
        : 'color: #374151;';
      return `${checkbox} <span style="${textStyle}">${option}</span>`;
    }).join(' ');
  }

  // Enhanced helper function to render design type checkboxes
  private renderDesignTypeCheckboxes(selectedDesignType?: string): string {
    const types = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const selectedNumber = this.extractDesignTypeNumber(selectedDesignType);
    
    return types.map(type => {
      const isSelected = selectedNumber === type;
      const checkbox = isSelected 
        ? '<span style="color: #059669; font-weight: bold; font-size: 14px;">☑</span>' 
        : '<span style="color: #6b7280; font-size: 14px;">☐</span>';
      const textStyle = isSelected 
        ? 'font-weight: bold; color: #059669;' 
        : 'color: #374151;';
      return `${checkbox} <span style="${textStyle}">${type}</span>`;
    }).join(' ');
  }

  // Extract design type number from string like "Type I - New Design"
  private extractDesignTypeNumber(designType?: string): string {
    if (!designType) return '';
    const match = designType.match(/Type\s+([IVX]+)/i);
    return match ? match[1].toUpperCase() : '';
  }

  // Generate design input table rows
  private generateDesignInputRows(data: Partial<MTDocumentData>): string {
    const rows = [];
    // Add at least 8 empty rows for the design input table
    for (let i = 0; i < 8; i++) {
      rows.push(`
        <tr>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
        </tr>
      `);
    }
    return rows.join('');
  }

  // Generate impacted documents table rows
  private generateImpactedDocumentRows(data: Partial<MTDocumentData>): string {
    const rows = [];
    // Add at least 4 empty rows for the impacted documents table
    for (let i = 0; i < 4; i++) {
      rows.push(`
        <tr>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
        </tr>
      `);
    }
    return rows.join('');
  }

  // Generate design output table rows
  private generateDesignOutputRows(data: Partial<MTDocumentData>): string {
    const rows = [];
    // Add at least 4 empty rows for the design output table
    for (let i = 0; i < 4; i++) {
      rows.push(`
        <tr>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
          <td class="mt-table-data h-8"></td>
        </tr>
      `);
    }
    return rows.join('');
  }

  // Generate approval table rows
  private generateApprovalRows(data: Partial<MTDocumentData>): string {
    const rows = [];
    // Add at least 6 empty rows for approvals
    for (let i = 0; i < 6; i++) {
      rows.push(`
        <tr>
          <td class="mt-table-data h-12"></td>
          <td class="mt-table-data h-12"></td>
          <td class="mt-table-data h-12"></td>
          <td class="mt-table-data h-12"></td>
        </tr>
      `);
    }
    return rows.join('');
  }

  // Update document data progressively
  updateDocument(data: Partial<MTDocumentData>): void {
    this.documentData = { ...this.documentData, ...data };
    const progress = this.calculateProgress();
    
    // Generate and notify preview update
    const previewHTML = this.generatePreviewHTML();
    this.documentPreviewCallbacks.forEach(callback => callback(previewHTML));
    
    // Notify progress update
    this.progressCallbacks.forEach(callback => callback(progress));
    
    // Ensure template is loaded for document generation
    if (!this.templateBuffer) {
      this.loadTemplate().catch(error => {
        console.warn('Could not load template:', error);
      });
    }
    
    console.log(`MT Document Progress: ${progress}% complete`);
  }

  // Convert analysis response to document data
  fromAnalysisResponse(analysis: MTAnalysisResponse, questionnaireData?: any): MTDocumentData {
    const now = new Date();
    
    const documentData: MTDocumentData = {
      // Header Information
      mtNumber: questionnaireData?.mtNumber || `MT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      revision: questionnaireData?.revision || '0',
      
      // Document Information
      projectNumber: questionnaireData?.projectNumber || `MT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      title: questionnaireData?.projectTitle || questionnaireData?.title || '[Modification Title - To be determined from analysis]',
      facility: questionnaireData?.facility || 'Nuclear Facility',
      submittedBy: questionnaireData?.submittedBy || 'Engineering Department',
      submissionDate: now.toLocaleDateString(),
      priority: questionnaireData?.priority || 'High',
      dueDate: questionnaireData?.dueDate || '[MM/DD/YYYY]',
      
      // Section I - Request for Modification
      requestedCompletionDate: questionnaireData?.requestedCompletionDate || '[MM/DD/YYYY]',
      cacn: questionnaireData?.cacn || '',
      projectType: questionnaireData?.projectType || '[Project Type]',
      relatedBuildings: questionnaireData?.relatedBuildings || '[Related Buildings/Facilities]',
      relatedSystems: questionnaireData?.relatedSystems || '[Related Systems]',
      relatedEquipment: questionnaireData?.relatedEquipment || '[Related Equipment]',
      problemDescription: questionnaireData?.problemDescription || questionnaireData?.description || '[Detailed description of the modification]',
      
      // Section II - Required for Design Type 1 Projects
      projectDesignReviewRequired: questionnaireData?.projectDesignReviewRequired || 'TBD',
      majorModificationEvaluationRequired: questionnaireData?.majorModificationEvaluationRequired || 'TBD',
      safetyInDesignStrategyRequired: questionnaireData?.safetyInDesignStrategyRequired || 'TBD',
      
      // Scope of Work
      description: questionnaireData?.description || analysis.analysis,
      justification: questionnaireData?.justification || analysis.analysis || '[Provide justification for the modification]',
      proposedSolution: questionnaireData?.proposedSolution || questionnaireData?.scopeOfWork || '[Detailed description of the modification]',
      workLocation: questionnaireData?.workLocation || '[Specific location/area]',
      
      // Design Input Record
      designInputs: questionnaireData?.designInputs || 'AI analysis with regulatory compliance review, Nuclear Regulatory Guidelines, DOE Standards',
      designInputConsiderations: questionnaireData?.designInputConsiderations || 'Integration with existing plant protection system, cable routing requirements, emergency response procedures',
      applicableCodes: questionnaireData?.applicableCodes || 'DOE Standards, Nuclear Regulatory Guidelines, IEEE Standards for Nuclear Facilities',
      designCriteria: questionnaireData?.designCriteria || 'Safety, operability, and regulatory compliance for emergency systems',
      environmentalConditions: questionnaireData?.environmentalConditions || 'Standard nuclear facility environment with seismic qualifications',
      interfaceRequirements: questionnaireData?.interfaceRequirements || 'Compatible with existing ECCS and plant protection systems',
      
      // MT Determination
      mtRequired: analysis.mtRequired,
      mtRequiredReason: analysis.reasoning || 'Safety-significant equipment modification affecting Emergency Core Cooling System backup power supply requires comprehensive engineering analysis and documentation.',
      confidence: analysis.confidence,
      analysisPath: 'AI-Enhanced Analysis with Expert Review and Regulatory Compliance Check',
      designType: this.getDesignTypeString(analysis.designType || 1),
      hazardCategory: analysis.safetyClassification || questionnaireData?.hazardCategory || 'Category 2',
      
      // Page 2 Risk Classifications
      preliminarySafetyClassification: questionnaireData?.preliminarySafetyClassification || 'SS',
      environmentalRisk: questionnaireData?.environmentalRisk || 'Yes',
      radiologicalRisk: questionnaireData?.radiologicalRisk || 'Yes',
      approvalDesignators: questionnaireData?.approvalDesignators || 'Safety-Significant, Emergency System',
      
      // Risk Assessment
      riskAssessment: analysis.riskAssessment ? {
        overallRisk: analysis.riskAssessment.overallRisk || 'Very High',
        safetyRisk: analysis.riskAssessment.safetyRisk || 'Very High', 
        environmentalRisk: analysis.riskAssessment.environmentalRisk || 'High',
        operationalRisk: analysis.riskAssessment.operationalRisk || 'High',
        riskFactors: analysis.riskAssessment.riskFactors || ['Safety system modification', 'Emergency power backup', 'Digital control integration'],
        mitigationRecommendations: analysis.riskAssessment.mitigationRecommendations || []
      } : {
        overallRisk: '',
        safetyRisk: '',
        environmentalRisk: '', 
        operationalRisk: '',
        riskFactors: [],
        mitigationRecommendations: []
      },
      
      // Design Output Record - Section VI  
      workPackageNumbers: questionnaireData?.workPackageNumbers || '',
      otherOutputs: questionnaireData?.otherOutputs || '',
      
      // Impact Assessment - Section V & VII
      safetyImpacts: questionnaireData?.safetyImpacts || '',
      operationalImpacts: questionnaireData?.operationalImpacts || '',
      maintenanceImpacts: questionnaireData?.maintenanceImpacts || '',
      otherImpacts: questionnaireData?.otherImpacts || '',
      
      // Approval Information
      preparedBy: questionnaireData?.preparedBy || 'MT Analysis System',
      preparedDate: now.toLocaleDateString(),
    };

    this.updateDocument(documentData);
    return documentData;
  }

  private getDesignTypeString(designType: number): string {
    switch (designType) {
      case 1: return 'Type I - New Design';
      case 2: return 'Type II - Modification';
      case 3: return 'Type III - Non-Identical Replacement';
      case 4: return 'Type IV - Temporary';
      case 5: return 'Type V - Identical Replacement';
      default: return 'Type TBD - To Be Determined';
    }
  }

  private convertChecklistSection(section: any): ChecklistItem[] {
    if (!section?.items || !Array.isArray(section.items)) {
      return [];
    }
    
    return section.items.map((item: any) => ({
      description: item.description || 'Review item',
      status: item.status || 'Pending',
      comments: item.comments || '',
      reviewer: item.reviewer || '',
      date: item.date || ''
    }));
  }

  // Generate actual DOCX file using template filling
  async generateDocxDocument(): Promise<Blob> {
    try {
      const data = this.documentData;
      
      // Generate template with actual data
      const { createMTTemplate } = await import('../utils/createMTTemplate');
      return await createMTTemplate(data);
    } catch (error) {
      console.error('Error generating DOCX document:', error);
      throw new Error('Failed to generate MT document');
    }
  }

  // Fill existing template with actual data
  private async fillExistingTemplate(data: Partial<MTDocumentData>): Promise<Blob> {
    if (!this.templateBuffer) {
      throw new Error('Template not loaded');
    }

    try {
      // For now, just return the template as-is since docx-templates will be used
      // in the createMTTemplate function to pre-fill data
      return new Blob([this.templateBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });
    } catch (error) {
      console.error('Error processing template:', error);
      throw new Error(`Template processing failed: ${error}`);
    }
  }

  // Get current document data
  getCurrentDocument(): Partial<MTDocumentData> {
    return { ...this.documentData };
  }

  // Reset document
  resetDocument(): void {
    this.documentData = {};
    this.progressCallbacks.forEach(callback => callback(0));
    this.documentPreviewCallbacks.forEach(callback => callback(''));
  }

  // Download the completed DOCX document
  async downloadDocument(filename?: string): Promise<void> {
    try {
      const blob = await this.generateDocxDocument();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `MT_${this.documentData.projectNumber || 'Document'}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
}

export const mtDocumentService = MTDocumentService.getInstance();
