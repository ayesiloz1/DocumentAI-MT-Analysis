import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, rgb } from 'pdf-lib';
import { MTDocumentData } from './mtDocumentService';
import { inspectPDFForm } from '../utils/pdfInspector';

export class MTPDFService {
  private static instance: MTPDFService;
  private pdfTemplateBuffer: ArrayBuffer | null = null;

  static getInstance(): MTPDFService {
    if (!MTPDFService.instance) {
      MTPDFService.instance = new MTPDFService();
    }
    return MTPDFService.instance;
  }

  // Load the PDF template form
  async loadPDFTemplate(): Promise<void> {
    try {
      // Try to load the PDF form from the public folder
      console.log('Attempting to load PDF template from /Mod_Traveller_Sample.pdf');
      
      // First, inspect the PDF to see if it has form fields
      await inspectPDFForm('/Mod_Traveller_Sample.pdf');
      
      const response = await fetch('/Mod_Traveller_Sample.pdf');
      if (response.ok) {
        this.pdfTemplateBuffer = await response.arrayBuffer();
        console.log('PDF template loaded successfully, size:', this.pdfTemplateBuffer.byteLength);
      } else {
        console.error('PDF template fetch failed:', response.status, response.statusText);
        throw new Error(`PDF template not found: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Could not load PDF template:', error);
      throw error;
    }
  }

  // Fill the PDF form with MT data
  async fillPDFForm(data: Partial<MTDocumentData>): Promise<Blob> {
    try {
      console.log('=== PDF FORM FILLING DEBUG ===');
      console.log('Input data:', JSON.stringify(data, null, 2));

      // Load template if not already loaded
      if (!this.pdfTemplateBuffer) {
        console.log('Loading PDF template...');
        await this.loadPDFTemplate();
      }

      if (!this.pdfTemplateBuffer) {
        throw new Error('PDF template not loaded');
      }

      console.log('Loading PDF document from buffer...');
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(this.pdfTemplateBuffer);
      const form = pdfDoc.getForm();

      console.log('PDF document loaded successfully');
      console.log('Form object:', form);

      // Get all form fields to see what's available
      const fields = form.getFields();
      console.log('Number of form fields found:', fields.length);
      console.log('Available form fields:', fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name
      })));

      if (fields.length === 0) {
        console.warn('NO FORM FIELDS FOUND IN PDF! This PDF may not be a fillable form.');
        console.log('Creating a new PDF with the data instead...');
        
        // If no form fields, create a simple PDF with the data
        return await this.createDataOverlayPDF(pdfDoc, data);
      }

      console.log('Starting to fill form fields...');

      // Fill common form fields - adjust field names based on your actual PDF form
      this.fillTextField(form, 'projectNumber', data.projectNumber || '');
      this.fillTextField(form, 'project_number', data.projectNumber || '');
      this.fillTextField(form, 'ProjectNumber', data.projectNumber || '');
      
      this.fillTextField(form, 'projectTitle', data.projectTitle || '');
      this.fillTextField(form, 'project_title', data.projectTitle || '');
      this.fillTextField(form, 'ProjectTitle', data.projectTitle || '');
      
      this.fillTextField(form, 'requestDate', data.requestDate || new Date().toLocaleDateString());
      this.fillTextField(form, 'request_date', data.requestDate || new Date().toLocaleDateString());
      this.fillTextField(form, 'RequestDate', data.requestDate || new Date().toLocaleDateString());
      this.fillTextField(form, 'dateInitiated', data.requestDate || new Date().toLocaleDateString());
      
      this.fillTextField(form, 'requestedBy', data.requestedBy || '');
      this.fillTextField(form, 'requested_by', data.requestedBy || '');
      this.fillTextField(form, 'RequestedBy', data.requestedBy || '');
      this.fillTextField(form, 'originator', data.requestedBy || '');
      
      this.fillTextField(form, 'organization', data.organization || '');
      this.fillTextField(form, 'department', data.organization || '');
      this.fillTextField(form, 'Department', data.organization || '');
      
      // Problem Statement
      this.fillTextField(form, 'problemDescription', data.problemDescription || '');
      this.fillTextField(form, 'problem_description', data.problemDescription || '');
      this.fillTextField(form, 'ProblemDescription', data.problemDescription || '');
      this.fillTextField(form, 'descriptionOfProblem', data.problemDescription || '');
      
      this.fillTextField(form, 'proposedSolution', data.proposedSolution || '');
      this.fillTextField(form, 'proposed_solution', data.proposedSolution || '');
      this.fillTextField(form, 'ProposedSolution', data.proposedSolution || '');
      
      this.fillTextField(form, 'justification', data.justification || '');
      this.fillTextField(form, 'Justification', data.justification || '');
      
      // Classification
      this.fillTextField(form, 'safetyClassification', data.safetyClassification || '');
      this.fillTextField(form, 'safety_classification', data.safetyClassification || '');
      this.fillTextField(form, 'SafetyClassification', data.safetyClassification || '');
      
      this.fillTextField(form, 'hazardCategory', data.hazardCategory || '');
      this.fillTextField(form, 'hazard_category', data.hazardCategory || '');
      this.fillTextField(form, 'HazardCategory', data.hazardCategory || '');
      
      this.fillTextField(form, 'designType', data.designType || '');
      this.fillTextField(form, 'design_type', data.designType || '');
      this.fillTextField(form, 'DesignType', data.designType || '');
      
      // MT Required determination
      const mtRequiredValue = data.mtRequired !== undefined ? (data.mtRequired ? 'YES' : 'NO') : '';
      this.fillTextField(form, 'mtRequired', mtRequiredValue);
      this.fillTextField(form, 'mt_required', mtRequiredValue);
      this.fillTextField(form, 'MTRequired', mtRequiredValue);
      this.fillCheckBox(form, 'mtRequiredYes', data.mtRequired === true);
      this.fillCheckBox(form, 'mtRequiredNo', data.mtRequired === false);
      this.fillCheckBox(form, 'mt_required_yes', data.mtRequired === true);
      this.fillCheckBox(form, 'mt_required_no', data.mtRequired === false);
      
      this.fillTextField(form, 'mtRequiredReason', data.mtRequiredReason || '');
      this.fillTextField(form, 'mt_required_reason', data.mtRequiredReason || '');
      this.fillTextField(form, 'MTRequiredReason', data.mtRequiredReason || '');
      this.fillTextField(form, 'analysisReasoning', data.mtRequiredReason || '');
      
      this.fillTextField(form, 'analysisPath', data.analysisPath || '');
      this.fillTextField(form, 'analysis_path', data.analysisPath || '');
      this.fillTextField(form, 'AnalysisPath', data.analysisPath || '');
      this.fillTextField(form, 'analysisMethod', data.analysisPath || '');
      
      this.fillTextField(form, 'confidence', data.confidence ? data.confidence + '%' : '');
      this.fillTextField(form, 'confidenceLevel', data.confidence ? data.confidence + '%' : '');
      
      // Risk Assessment
      if (data.riskAssessment) {
        this.fillTextField(form, 'overallRisk', data.riskAssessment.overallRisk || '');
        this.fillTextField(form, 'overall_risk', data.riskAssessment.overallRisk || '');
        this.fillTextField(form, 'OverallRisk', data.riskAssessment.overallRisk || '');
        
        this.fillTextField(form, 'safetyRisk', data.riskAssessment.safetyRisk || '');
        this.fillTextField(form, 'safety_risk', data.riskAssessment.safetyRisk || '');
        this.fillTextField(form, 'SafetyRisk', data.riskAssessment.safetyRisk || '');
        
        this.fillTextField(form, 'environmentalRisk', data.riskAssessment.environmentalRisk || '');
        this.fillTextField(form, 'environmental_risk', data.riskAssessment.environmentalRisk || '');
        this.fillTextField(form, 'EnvironmentalRisk', data.riskAssessment.environmentalRisk || '');
        
        this.fillTextField(form, 'operationalRisk', data.riskAssessment.operationalRisk || '');
        this.fillTextField(form, 'operational_risk', data.riskAssessment.operationalRisk || '');
        this.fillTextField(form, 'OperationalRisk', data.riskAssessment.operationalRisk || '');
      }
      
      // Systems and Procedures
      if (data.systemsAffected) {
        this.fillTextField(form, 'systemsAffected', data.systemsAffected.join(', '));
        this.fillTextField(form, 'systems_affected', data.systemsAffected.join(', '));
        this.fillTextField(form, 'SystemsAffected', data.systemsAffected.join(', '));
      }
      
      if (data.proceduresRequired) {
        this.fillTextField(form, 'proceduresRequired', data.proceduresRequired.join(', '));
        this.fillTextField(form, 'procedures_required', data.proceduresRequired.join(', '));
        this.fillTextField(form, 'ProceduresRequired', data.proceduresRequired.join(', '));
      }
      
      if (data.documentsImpacted) {
        this.fillTextField(form, 'documentsImpacted', data.documentsImpacted.join(', '));
        this.fillTextField(form, 'documents_impacted', data.documentsImpacted.join(', '));
        this.fillTextField(form, 'DocumentsImpacted', data.documentsImpacted.join(', '));
      }
      
      // Approvals
      this.fillTextField(form, 'preparedBy', data.preparedBy || 'AI Analysis System');
      this.fillTextField(form, 'prepared_by', data.preparedBy || 'AI Analysis System');
      this.fillTextField(form, 'PreparedBy', data.preparedBy || 'AI Analysis System');
      
      this.fillTextField(form, 'reviewedBy', data.reviewedBy || '[To Be Assigned]');
      this.fillTextField(form, 'reviewed_by', data.reviewedBy || '[To Be Assigned]');
      this.fillTextField(form, 'ReviewedBy', data.reviewedBy || '[To Be Assigned]');
      
      this.fillTextField(form, 'approvedBy', data.approvedBy || '[To Be Assigned]');
      this.fillTextField(form, 'approved_by', data.approvedBy || '[To Be Assigned]');
      this.fillTextField(form, 'ApprovedBy', data.approvedBy || '[To Be Assigned]');
      
      this.fillTextField(form, 'preparedDate', data.preparedDate || new Date().toLocaleDateString());
      this.fillTextField(form, 'prepared_date', data.preparedDate || new Date().toLocaleDateString());
      this.fillTextField(form, 'PreparedDate', data.preparedDate || new Date().toLocaleDateString());
      
      this.fillTextField(form, 'reviewedDate', data.reviewedDate || '[To Be Completed]');
      this.fillTextField(form, 'reviewed_date', data.reviewedDate || '[To Be Completed]');
      this.fillTextField(form, 'ReviewedDate', data.reviewedDate || '[To Be Completed]');
      
      this.fillTextField(form, 'approvedDate', data.approvedDate || '[To Be Completed]');
      this.fillTextField(form, 'approved_date', data.approvedDate || '[To Be Completed]');
      this.fillTextField(form, 'ApprovedDate', data.approvedDate || '[To Be Completed]');
      
      // Generated information
      const generatedDate = new Date().toLocaleString();
      this.fillTextField(form, 'generatedDate', generatedDate);
      this.fillTextField(form, 'generated_date', generatedDate);
      this.fillTextField(form, 'GeneratedDate', generatedDate);
      
      const documentId = `MT_${data.projectNumber || 'ANALYSIS'}_${new Date().toISOString().split('T')[0]}`;
      this.fillTextField(form, 'documentId', documentId);
      this.fillTextField(form, 'document_id', documentId);
      this.fillTextField(form, 'DocumentId', documentId);

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save();
      console.log('PDF form filled successfully, size:', pdfBytes.length);
      
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('Error filling PDF form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Failed to fill PDF form: ' + errorMessage);
    }
  }

  // Helper method to safely fill text fields
  private fillTextField(form: PDFForm, fieldName: string, value: string): void {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(value);
        console.log(`✓ Filled text field "${fieldName}" with: "${value}"`);
      } else {
        console.log(`✗ Text field "${fieldName}" not found`);
      }
    } catch (error) {
      console.log(`✗ Error filling text field "${fieldName}":`, error);
    }
  }

  // Helper method to safely fill checkboxes
  private fillCheckBox(form: PDFForm, fieldName: string, checked: boolean): void {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) {
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
        console.log(`✓ Set checkbox "${fieldName}" to: ${checked}`);
      } else {
        console.log(`✗ Checkbox "${fieldName}" not found`);
      }
    } catch (error) {
      console.log(`✗ Error filling checkbox "${fieldName}":`, error);
    }
  }

  // Helper method to safely fill dropdowns
  private fillDropdown(form: PDFForm, fieldName: string, value: string): void {
    try {
      const field = form.getDropdown(fieldName);
      if (field) {
        field.select(value);
        console.log(`Selected dropdown "${fieldName}" value: "${value}"`);
      }
    } catch (error) {
      // Field doesn't exist, skip silently
    }
  }

  // Create a PDF with data overlay when no form fields exist
  private async createDataOverlayPDF(pdfDoc: PDFDocument, data: Partial<MTDocumentData>): Promise<Blob> {
    try {
      console.log('Creating professional data overlay PDF that matches original layout...');
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      console.log(`Page size: ${width} x ${height}`);
      
      // Use smaller font and better positioning to match original layout
      const fontSize = 9;
      const labelFontSize = 8;
      const lineHeight = 12;
      
      // Try to position data where it would be in a typical MT form
      // Header section (top of page)
      let yPosition = height - 120; // Start below any existing header
      
      // Project Information Section
      this.addFormattedField(firstPage, 'Project Number:', data.projectNumber || 'N/A', 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.5;
      
      this.addFormattedField(firstPage, 'Project Title:', data.projectTitle || 'N/A', 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.5;
      
      this.addFormattedField(firstPage, 'Request Date:', data.requestDate || new Date().toLocaleDateString(), 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.5;
      
      this.addFormattedField(firstPage, 'Requested By:', data.requestedBy || 'System User', 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.5;
      
      this.addFormattedField(firstPage, 'Organization:', data.organization || 'Nuclear Facility', 60, yPosition, fontSize);
      yPosition -= lineHeight * 2;
      
      // Problem Description Section
      firstPage.drawText('PROBLEM DESCRIPTION:', {
        x: 60,
        y: yPosition,
        size: labelFontSize + 1,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.2;
      
      this.addWrappedText(firstPage, data.problemDescription || 'N/A', 60, yPosition, width - 120, fontSize);
      yPosition -= lineHeight * 3;
      
      // Proposed Solution Section
      firstPage.drawText('PROPOSED SOLUTION:', {
        x: 60,
        y: yPosition,
        size: labelFontSize + 1,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.2;
      
      this.addWrappedText(firstPage, data.proposedSolution || 'N/A', 60, yPosition, width - 120, fontSize);
      yPosition -= lineHeight * 3;
      
      // MT Determination Section
      firstPage.drawText('MT DETERMINATION:', {
        x: 60,
        y: yPosition,
        size: labelFontSize + 1,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.5;
      
      this.addFormattedField(firstPage, 'MT Required:', data.mtRequired ? 'YES' : 'NO', 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.2;
      
      this.addFormattedField(firstPage, 'Design Type:', data.designType || 'N/A', 60, yPosition, fontSize);
      yPosition -= lineHeight * 1.2;
      
      this.addWrappedText(firstPage, `Reason: ${data.mtRequiredReason || 'N/A'}`, 60, yPosition, width - 120, fontSize);
      yPosition -= lineHeight * 2.5;
      
      // Risk Assessment Section
      firstPage.drawText('RISK ASSESSMENT:', {
        x: 60,
        y: yPosition,
        size: labelFontSize + 1,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.5;
      
      if (data.riskAssessment) {
        this.addFormattedField(firstPage, 'Overall Risk:', data.riskAssessment.overallRisk || 'N/A', 60, yPosition, fontSize);
        yPosition -= lineHeight;
        this.addFormattedField(firstPage, 'Safety Risk:', data.riskAssessment.safetyRisk || 'N/A', 60, yPosition, fontSize);
        yPosition -= lineHeight;
        this.addFormattedField(firstPage, 'Environmental Risk:', data.riskAssessment.environmentalRisk || 'N/A', 60, yPosition, fontSize);
        yPosition -= lineHeight;
        this.addFormattedField(firstPage, 'Operational Risk:', data.riskAssessment.operationalRisk || 'N/A', 60, yPosition, fontSize);
        yPosition -= lineHeight * 1.5;
      }
      
      // Analysis Information
      this.addFormattedField(firstPage, 'Confidence Level:', data.confidence ? `${data.confidence}%` : 'N/A', 60, yPosition, fontSize);
      yPosition -= lineHeight;
      
      // Footer information
      const footerY = 50;
      firstPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: 60,
        y: footerY,
        size: labelFontSize - 1,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      firstPage.drawText(`Document ID: MT_${data.projectNumber || 'ANALYSIS'}_${new Date().toISOString().split('T')[0]}`, {
        x: 60,
        y: footerY - 12,
        size: labelFontSize - 1,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      console.log('Professional data overlay added to PDF');
      
      const pdfBytes = await pdfDoc.save();
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('Error creating data overlay PDF:', error);
      throw error;
    }
  }

  // Helper method to add formatted field (label + value)
  private addFormattedField(page: any, label: string, value: string, x: number, y: number, fontSize: number): void {
    // Draw label in bold-ish (slightly larger)
    page.drawText(label, {
      x: x,
      y: y,
      size: fontSize - 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Draw value
    page.drawText(value, {
      x: x + 120, // Offset for value
      y: y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  }

  // Helper method to add wrapped text for long content
  private addWrappedText(page: any, text: string, x: number, y: number, maxWidth: number, fontSize: number): void {
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;
    const lineHeight = fontSize + 2;
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      // Rough estimation of text width (more accurate would require font metrics)
      if (testLine.length * (fontSize * 0.6) > maxWidth && currentLine) {
        // Draw current line
        page.drawText(currentLine, {
          x: x,
          y: currentY,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        currentLine = word;
        currentY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    });
    
    // Draw the last line
    if (currentLine) {
      page.drawText(currentLine, {
        x: x,
        y: currentY,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Create a new fillable PDF form from scratch
  async createNewMTForm(data: Partial<MTDocumentData>): Promise<Blob> {
    try {
      console.log('Creating new MT form PDF...');
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      // Title
      page.drawText('MODIFICATION TRAVELER ANALYSIS REPORT', {
        x: 50,
        y: height - 50,
        size: 16,
      });
      
      let yPos = height - 100;
      const lineHeight = 20;
      
      // Add form fields and labels
      const formData = [
        ['Project Number:', data.projectNumber || ''],
        ['Project Title:', data.projectTitle || ''],
        ['Request Date:', data.requestDate || new Date().toLocaleDateString()],
        ['Requested By:', data.requestedBy || ''],
        ['Organization:', data.organization || ''],
        ['Problem Description:', data.problemDescription || ''],
        ['Proposed Solution:', data.proposedSolution || ''],
        ['MT Required:', data.mtRequired ? 'YES' : 'NO'],
        ['Design Type:', data.designType || ''],
        ['Overall Risk:', data.riskAssessment?.overallRisk || ''],
        ['Confidence Level:', data.confidence ? `${data.confidence}%` : ''],
      ];
      
      formData.forEach(([label, value]) => {
        // Draw label
        page.drawText(label, {
          x: 50,
          y: yPos,
          size: 10,
        });
        
        // Draw value
        page.drawText(value, {
          x: 200,
          y: yPos,
          size: 10,
        });
        
        yPos -= lineHeight;
      });
      
      const pdfBytes = await pdfDoc.save();
      console.log('New MT form PDF created successfully');
      
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('Error creating new MT form:', error);
      throw error;
    }
  }

  // Download the filled PDF
  async downloadFilledPDF(data: Partial<MTDocumentData>, filename?: string): Promise<void> {
    try {
      const pdfBlob = await this.fillPDFForm(data);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `MT_${data.projectNumber || 'Document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
}

export const mtPDFService = MTPDFService.getInstance();
