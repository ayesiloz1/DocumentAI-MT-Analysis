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
  private progressCallbacks: ((progress: number) => void)[] = [];
  private documentPreviewCallbacks: ((preview: string) => void)[] = [];
  private templateBuffer: ArrayBuffer | null = null;

  private constructor() {}

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

  // Generate HTML preview of the document
  generatePreviewHTML(): string {
    const data = this.documentData;
    
    return `
    <div class="max-w-4xl mx-auto p-6 bg-white shadow-lg">
      <!-- Header -->
      <div class="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 class="text-xl font-bold text-gray-900">MT-50231 Rev.00 5/11/2017 - 9:01 AM 1 of 2</h1>
        <h2 class="text-2xl font-bold text-gray-900 mt-2">MODIFICATION TRAVELER</h2>
        <p class="text-sm text-gray-700 mt-2">Prepared For the U.S. Department of Energy, Assistant Secretary for Environmental Management</p>
        <p class="text-sm text-gray-700">By Washington River Protection Solutions, LLC., PO Box 850, Richland, WA 99352</p>
        <p class="text-sm text-gray-700">Contractor For U.S. Department of Energy, Office of River Protection, under Contract DE-AC27-08RV14800</p>
        
        <div class="mt-4 border border-gray-400 p-2 inline-block">
          <p class="text-sm font-semibold">Release Stamp</p>
          <p class="text-xs">Clearance Review Restriction Type:</p>
          <div class="border border-gray-300 h-12 w-32 mt-1"></div>
        </div>
      </div>

      <!-- MT Number and Title -->
      <div class="mb-6 border border-gray-400 p-4">
        <table class="w-full text-sm border-collapse">
          <tr>
            <td class="mt-table-header w-1/4">1. MT No:</td>
            <td class="mt-table-data w-1/4">${data.mtNumber || '[MT Number]'}</td>
            <td class="mt-table-header w-1/6">Rev.</td>
            <td class="mt-table-data">${data.revision || '0'}</td>
          </tr>
          <tr>
            <td class="mt-table-header">2. Title:</td>
            <td class="mt-table-data" colspan="3">${data.title || '[Modification Title]'}</td>
          </tr>
        </table>
      </div>

      <!-- Section I: Request for Modification -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION I REQUEST FOR MODIFICATION</h2>
        
        <table class="w-full text-sm border-collapse mb-4">
          <tr>
            <td class="mt-table-header w-1/3">3. Requested Completion Date (Optional):</td>
            <td class="mt-table-data w-1/3">${data.requestedCompletionDate || '[MM/DD/YYYY]'}</td>
            <td class="mt-table-header w-1/6">4. CACN (optional)</td>
            <td class="mt-table-data">${data.cacn || ''}</td>
          </tr>
          <tr>
            <td class="mt-table-header">5. Project Number: ☐</td>
            <td class="mt-table-data">${data.projectNumber || '[Project Number]'}</td>
            <td class="mt-table-header">6. Design Type:</td>
            <td class="mt-table-data">
              ${this.renderDesignTypeCheckboxes(data.designType)}
              <div class="mt-1">${data.designType || '[Select Design Type]'}</div>
            </td>
          </tr>
          <tr>
            <td class="mt-table-header" colspan="2">7. Project Type:</td>
            <td class="mt-table-data" colspan="2">${data.projectType || '[Project Type]'}</td>
          </tr>
        </table>

        <div class="mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">8. Related Structures, Systems, and Components</h3>
          <table class="w-full text-sm border-collapse">
            <tr>
              <td class="mt-table-header w-1/3">a. Related Building/Facilities ☐ N/A</td>
              <td class="mt-table-header w-1/3">b. Related Systems ☐ N/A</td>
              <td class="mt-table-header">c. Related Equipment ID Nos. (EIN) ☐ N/A</td>
            </tr>
            <tr>
              <td class="mt-table-data h-16">${data.relatedBuildings || ''}</td>
              <td class="mt-table-data h-16">${data.relatedSystems || ''}</td>
              <td class="mt-table-data h-16">${data.relatedEquipment || ''}</td>
            </tr>
          </table>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">9. Problem Description</label>
          <div class="mt-table-data min-h-24 p-3">${data.problemDescription || data.description || '[Describe the problem or need for modification]'}</div>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">10. Justification</label>
          <div class="mt-table-data min-h-24 p-3">${data.justification || '[Provide justification for the modification]'}</div>
        </div>
      </div>

      <!-- Section II: Required for Design Type 1 Projects -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION II REQUIRED FOR DESIGN TYPE 1 PROJECTS</h2>
        
        <table class="w-full text-sm border-collapse">
          <tr>
            <td class="mt-table-header w-1/3">11a. Project Design Review Required (TFC-ENG-DESIGN-D-17.1)?</td>
            <td class="mt-table-header w-1/3">11b. Major Modification Evaluation Required (Use 1189 Checklist)?</td>
            <td class="mt-table-header">11c. Safety In Design Strategy Required?</td>
          </tr>
          <tr>
            <td class="mt-table-data">${this.renderCheckboxes(data.projectDesignReviewRequired)}</td>
            <td class="mt-table-data">${this.renderCheckboxes(data.majorModificationEvaluationRequired)}</td>
            <td class="mt-table-data">${this.renderCheckboxes(data.safetyInDesignStrategyRequired)}</td>
          </tr>
        </table>
      </div>

      <!-- Section III: Proposed Solution -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION III PROPOSED SOLUTION</h2>
        
        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">12. Proposed Solution</label>
          <div class="mt-table-data min-h-32 p-3">${data.proposedSolution || data.scopeOfWork || '[Describe the proposed solution]'}</div>
        </div>
      </div>

      <!-- Section IV: Design Input Record -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION IV DESIGN INPUT RECORD</h2>
        
        <div class="mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">13. Design Inputs ☐ N/A</h3>
          <table class="w-full text-sm border-collapse">
            <tr>
              <td class="mt-table-header w-1/4">Type of Document</td>
              <td class="mt-table-header w-1/4">Document Number</td>
              <td class="mt-table-header w-1/6">Rev.</td>
              <td class="mt-table-header">Title</td>
            </tr>
            ${this.generateDesignInputRows(data)}
          </table>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">14. Other Design Input Considerations:</label>
          <div class="mt-table-data min-h-24 p-3">${data.designInputConsiderations || ''}</div>
        </div>
      </div>
        
        <table class="w-full text-sm border-collapse">
          <tr>
            <td class="mt-table-header w-1/4">Project Number:</td>
            <td class="mt-table-data ${data.projectNumber ? 'text-gray-900' : 'text-gray-400 italic'}">${data.projectNumber || '[Project Number]'}</td>
            <td class="mt-table-header w-1/4">Priority:</td>
            <td class="mt-table-data ${data.priority ? 'text-gray-900' : 'text-gray-400 italic'}">${data.priority || '[High/Medium/Low]'}</td>
          </tr>
          <tr>
            <td class="mt-table-header">Title:</td>
            <td class="mt-table-data ${data.title ? 'text-gray-900' : 'text-gray-400 italic'}" colspan="3">${data.title || '[Modification Title]'}</td>
          </tr>
          <tr>
            <td class="mt-table-header">Facility:</td>
            <td class="mt-table-data ${data.facility ? 'text-gray-900' : 'text-gray-400 italic'}">${data.facility || '[Facility Name]'}</td>
            <td class="mt-table-header">Due Date:</td>
            <td class="mt-table-data ${data.dueDate ? 'text-gray-900' : 'text-gray-400 italic'}">${data.dueDate || '[MM/DD/YYYY]'}</td>
          </tr>
          <tr>
            <td class="mt-table-header">Submitted By:</td>
            <td class="mt-table-data ${data.submittedBy ? 'text-gray-900' : 'text-gray-400 italic'}">${data.submittedBy || '[Submitter Name]'}</td>
            <td class="mt-table-header">Submission Date:</td>
            <td class="mt-table-data ${data.submissionDate ? 'text-gray-900' : 'text-gray-400 italic'}">${data.submissionDate || '[MM/DD/YYYY]'}</td>
          </tr>
        </table>
      </div>

      <!-- Section 2: Scope of Work -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION 2: SCOPE OF WORK</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-800 mb-2">Description:</label>
          <div class="border border-gray-400 p-3 min-h-24 ${data.description ? 'text-gray-900' : 'text-gray-400 italic'}">
            ${data.description || '[Detailed description of the modification]'}
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-800 mb-2">Justification:</label>
          <div class="border border-gray-400 p-3 min-h-16 ${data.justification ? 'text-gray-900' : 'text-gray-400 italic'}">
            ${data.justification || '[Business case and technical justification]'}
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label class="block font-semibold text-gray-800 mb-1">Work Location:</label>
            <div class="mt-table-data ${data.workLocation ? 'text-gray-900' : 'text-gray-400 italic'}">
              ${data.workLocation || '[Specific location/area]'}
            </div>
          </div>
          <div>
            <label class="block font-semibold text-gray-800 mb-1">Estimated Duration:</label>
            <div class="mt-table-data text-gray-400 italic">
              ${data.estimatedStartDate && data.estimatedCompleteDate ? 
                `${data.estimatedStartDate} to ${data.estimatedCompleteDate}` : 
                '[Start Date - End Date]'}
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: MT Determination -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION 3: MODIFICATION TRAVELER DETERMINATION</h2>
        
        <table class="w-full text-sm border-collapse mb-4">
          <tr>
            <td class="mt-table-header w-1/4">Hazard Category:</td>
            <td class="mt-table-data ${data.hazardCategory ? 'text-gray-900' : 'text-gray-400 italic'}">${data.hazardCategory || '[Category 1/2/3]'}</td>
            <td class="mt-table-header w-1/4">Design Type:</td>
            <td class="mt-table-data ${data.designType ? 'text-gray-900' : 'text-gray-400 italic'}">${data.designType || '[Type I/II/III/IV/V]'}</td>
          </tr>
          <tr>
            <td class="mt-table-header">MT Required:</td>
            <td class="mt-table-data font-bold ${data.mtRequired !== undefined ? (data.mtRequired ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50') : 'text-gray-400 italic'}">${data.mtRequired !== undefined ? (data.mtRequired ? 'YES' : 'NO') : '[TO BE DETERMINED]'}</td>
            <td class="mt-table-header">Confidence Level:</td>
            <td class="mt-table-data ${data.confidence ? 'text-gray-900' : 'text-gray-400 italic'}">${data.confidence ? data.confidence + '%' : '[TBD]'}</td>
          </tr>
        </table>
        
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-800 mb-2">MT Determination Basis:</label>
          <div class="border border-gray-400 p-3 min-h-16 ${data.mtRequiredReason ? 'text-gray-900' : 'text-gray-400 italic'}">
            ${data.mtRequiredReason || '[Provide technical basis for MT requirement determination]'}
          </div>
        </div>
        
        <div class="text-sm">
          <label class="block font-semibold text-gray-800 mb-1">Analysis Method:</label>
          <div class="mt-table-data ${data.analysisPath ? 'text-gray-900' : 'text-gray-400 italic'}">
            ${data.analysisPath || '[Analysis methodology used]'}
          </div>
        </div>
      </div>

      <!-- Section 4: Risk Assessment (if present) -->
      ${data.riskAssessment ? `
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION 4: RISK ASSESSMENT</h2>
        
        <table class="w-full text-sm border-collapse">
          <tr>
            <td class="mt-table-header w-1/4">Overall Risk:</td>
            <td class="mt-table-data text-gray-900">${data.riskAssessment.overallRisk}</td>
            <td class="mt-table-header w-1/4">Safety Risk:</td>
            <td class="mt-table-data text-gray-900">${data.riskAssessment.safetyRisk}</td>
          </tr>
          <tr>
            <td class="mt-table-header">Environmental Risk:</td>
            <td class="mt-table-data text-gray-900">${data.riskAssessment.environmentalRisk}</td>
            <td class="mt-table-header">Operational Risk:</td>
            <td class="mt-table-data text-gray-900">${data.riskAssessment.operationalRisk}</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- Page 2 Header -->
      <div class="text-center border-b-2 border-gray-800 pb-4 mb-6 mt-12">
        <h1 class="text-xl font-bold text-gray-900">MT-50231 Rev.00 5/11/2017 - 9:01 AM 2 of 2</h1>
        <h2 class="text-lg font-bold text-gray-900">MODIFICATION TRAVELER</h2>
        <div class="text-right mt-2">
          <span class="text-sm font-semibold">MT No.: ${data.mtNumber || '[MT Number]'} Rev. ${data.revision || '0'}</span>
        </div>
      </div>

      <!-- Page 2 Risk Classifications -->
      <div class="mb-6 border border-gray-400 p-4">
        <table class="w-full text-sm border-collapse">
          <tr>
            <td class="mt-table-header w-1/3">15. Preliminary Safety Classification:</td>
            <td class="mt-table-header w-1/3">16a. Environmental Risk:</td>
            <td class="mt-table-header">16b. Radiological Risk:</td>
          </tr>
          <tr>
            <td class="mt-table-data">${this.renderCheckboxes(data.preliminarySafetyClassification, ['SC', 'SS', 'GS', 'N/A'])}</td>
            <td class="mt-table-data">(TFC-ENG-DESIGN-C-52 Att. D)<br>${this.renderCheckboxes(data.environmentalRisk, ['Yes', 'No'])}</td>
            <td class="mt-table-data">(TFC-ENG-DESIGN-C-52 Att. D)<br>${this.renderCheckboxes(data.radiologicalRisk, ['Yes', 'No'])}</td>
          </tr>
        </table>
        
        <table class="w-full text-sm border-collapse mt-4">
          <tr>
            <td class="mt-table-header w-1/2">17. Hazard Category</td>
            <td class="mt-table-header">18. Approval Designators</td>
          </tr>
          <tr>
            <td class="mt-table-data h-12">${data.hazardCategory || ''}</td>
            <td class="mt-table-data h-12">${data.approvalDesignators || ''}</td>
          </tr>
        </table>
      </div>

      <!-- Section V: Impacts -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION V IMPACTS</h2>
        
        <div class="mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">19. Impacted Documents ☐ N/A</h3>
          <table class="w-full text-sm border-collapse">
            <tr>
              <td class="mt-table-header w-1/4">Type of Document</td>
              <td class="mt-table-header w-1/4">Document Number</td>
              <td class="mt-table-header w-1/6">Rev.</td>
              <td class="mt-table-header">Title</td>
            </tr>
            ${this.generateImpactedDocumentRows(data)}
          </table>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">20. Other Impacts</label>
          <div class="mt-table-data min-h-24 p-3">${data.otherImpacts || ''}</div>
        </div>
      </div>

      <!-- Section VI: Design Output Record -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION VI DESIGN OUTPUT RECORD</h2>
        
        <div class="mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">21. Design Outputs ☐ N/A</h3>
          <table class="w-full text-sm border-collapse">
            <tr>
              <td class="mt-table-header w-1/4">Type of Document</td>
              <td class="mt-table-header w-1/4">Document Number</td>
              <td class="mt-table-header w-1/6">Rev.</td>
              <td class="mt-table-header">Title</td>
            </tr>
            ${this.generateDesignOutputRows(data)}
          </table>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">22. Work Package Numbers: ☐ N/A</label>
          <div class="mt-table-data min-h-16 p-3">${data.workPackageNumbers || ''}</div>
        </div>

        <div class="mb-4">
          <label class="block font-semibold text-gray-900 mb-2">23. Other Outputs</label>
          <div class="mt-table-data min-h-24 p-3">${data.otherOutputs || ''}</div>
        </div>
      </div>

      <!-- Section VII: Design Input and Closure Approvals -->
      <div class="mb-6 border border-gray-400 p-4">
        <h2 class="text-lg font-bold text-gray-900 bg-gray-200 p-2 -m-4 mb-4">SECTION VII DESIGN INPUT AND CLOSURE APPROVALS</h2>
        
        <div class="mb-4">
          <h3 class="font-semibold text-gray-900 mb-2">24. Approvals</h3>
          <table class="w-full text-sm border-collapse">
            <tr>
              <td class="mt-table-header w-1/4">Title</td>
              <td class="mt-table-header w-1/4">Name</td>
              <td class="mt-table-header w-1/4">Signature</td>
              <td class="mt-table-header">Date</td>
            </tr>
            ${this.generateApprovalRows(data)}
          </table>
        </div>
      </div>

      <!-- Footer with Form Reference -->
      <div class="text-center text-xs text-gray-500 mt-8">
        <p>2 SPF-015 (Rev.B1)</p>
      </div>

      <!-- Footer -->
      <div class="border-t-2 border-gray-800 pt-4 mt-8 text-center text-xs text-gray-500">
        <p><strong>MODIFICATION TRAVELER DOCUMENT</strong></p>
        <p>Generated: ${new Date().toLocaleString()} | System: Enhanced MT Analysis Platform</p>
        <p>This document follows nuclear facility MT procedures and regulatory requirements</p>
      </div>
    </div>
    `;
  }

  // Helper function to render checkbox options
  private renderCheckboxes(selectedValue?: string, options: string[] = ['Yes', 'No', 'N/A']): string {
    return options.map(option => {
      const checked = selectedValue === option ? '☑' : '☐';
      return `${checked} ${option}`;
    }).join(' ');
  }

  // Helper function to render design type checkboxes
  private renderDesignTypeCheckboxes(selectedDesignType?: string): string {
    const types = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const selectedNumber = this.extractDesignTypeNumber(selectedDesignType);
    
    return types.map(type => {
      const checked = selectedNumber === type ? '☑' : '☐';
      return `${checked} ${type}`;
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
      title: questionnaireData?.projectTitle || questionnaireData?.title || 'Emergency Diesel Generator Control Panel Upgrade',
      facility: questionnaireData?.facility || 'Nuclear Facility',
      submittedBy: questionnaireData?.submittedBy || 'System Generated',
      submissionDate: now.toLocaleDateString(),
      priority: questionnaireData?.priority || 'High',
      dueDate: questionnaireData?.dueDate || 'Next Maintenance Outage',
      
      // Section I - Request for Modification
      requestedCompletionDate: questionnaireData?.requestedCompletionDate || 'Next Maintenance Outage',
      cacn: questionnaireData?.cacn || '',
      projectType: questionnaireData?.projectType || 'Safety System Upgrade',
      relatedBuildings: questionnaireData?.relatedBuildings || 'Reactor Building, Emergency Power Building',
      relatedSystems: questionnaireData?.relatedSystems || 'Emergency Core Cooling System (ECCS), Plant Protection System',
      relatedEquipment: questionnaireData?.relatedEquipment || 'Emergency Diesel Generator, Control Panels, Cable Runs',
      problemDescription: questionnaireData?.problemDescription || questionnaireData?.description || 'Replacing 1980s analog emergency diesel generator control panel with modern digital control system to improve reliability, monitoring capabilities, and response times for emergency shutdown scenarios.',
      
      // Section II - Required for Design Type 1 Projects
      projectDesignReviewRequired: questionnaireData?.projectDesignReviewRequired || 'Yes',
      majorModificationEvaluationRequired: questionnaireData?.majorModificationEvaluationRequired || 'Yes',
      safetyInDesignStrategyRequired: questionnaireData?.safetyInDesignStrategyRequired || 'Yes',
      
      // Scope of Work
      description: questionnaireData?.description || analysis.analysis,
      justification: questionnaireData?.justification || 'Critical safety system upgrade required to meet current regulatory standards and improve emergency response capabilities. Enhanced monitoring and diagnostics will reduce maintenance downtime and improve system reliability.',
      proposedSolution: questionnaireData?.proposedSolution || questionnaireData?.scopeOfWork || 'Install new digital control panel with enhanced monitoring capabilities, remote diagnostics, and improved response times. Includes new cable runs, updated software logic, and integration with existing plant protection system.',
      workLocation: questionnaireData?.workLocation || 'Emergency Power Building, Control Room',
      
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
        mitigationRecommendations: analysis.riskAssessment.mitigationRecommendations || ['Comprehensive testing', 'Operator training', 'Backup procedures']
      } : {
        overallRisk: 'Very High',
        safetyRisk: 'Very High',
        environmentalRisk: 'High', 
        operationalRisk: 'High',
        riskFactors: ['Safety system modification', 'Emergency power backup', 'Digital control integration'],
        mitigationRecommendations: ['Comprehensive testing', 'Operator training', 'Backup procedures']
      },
      
      // Design Output Record - Section VI  
      workPackageNumbers: questionnaireData?.workPackageNumbers || 'WP-2024-001, WP-2024-002',
      otherOutputs: questionnaireData?.otherOutputs || 'Updated drawings and specifications, Installation procedures, Testing protocols, Operator training materials',
      
      // Impact Assessment - Section V & VII
      safetyImpacts: questionnaireData?.safetyImpacts || 'Enhanced emergency response capabilities, improved system reliability',
      operationalImpacts: questionnaireData?.operationalImpacts || 'Temporary outage during installation, improved long-term reliability',
      maintenanceImpacts: questionnaireData?.maintenanceImpacts || 'Reduced maintenance requirements, remote diagnostic capabilities',
      otherImpacts: questionnaireData?.otherImpacts || 'Review of operating procedures required, operator training needed, updated maintenance procedures',
      
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
