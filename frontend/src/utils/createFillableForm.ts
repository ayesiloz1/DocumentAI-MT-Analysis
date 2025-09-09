import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib';

export async function createFillableMTForm(): Promise<Blob> {
  try {
    console.log('Creating fillable MT form...');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    const { width, height } = page.getSize();
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Title
    page.drawText('MODIFICATION TRAVELER (MT) DETERMINATION FORM', {
      x: 50,
      y: height - 50,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    let yPos = height - 100;
    const fieldHeight = 20;
    const labelWidth = 150;
    const fieldWidth = 300;
    const lineSpacing = 35;
    
    // Helper function to add a text field
    const addTextField = (label: string, fieldName: string, isMultiline: boolean = false) => {
      // Draw label
      page.drawText(label, {
        x: 50,
        y: yPos + 5,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      // Create text field
      const textField = form.createTextField(fieldName);
      // Don't set font size to avoid the /DA error
      textField.setText(''); // Set empty default text
      if (isMultiline) {
        textField.enableMultiline();
        textField.addToPage(page, {
          x: 50 + labelWidth,
          y: yPos - (fieldHeight * 2),
          width: fieldWidth,
          height: fieldHeight * 3,
        });
        yPos -= lineSpacing * 2;
      } else {
        textField.addToPage(page, {
          x: 50 + labelWidth,
          y: yPos,
          width: fieldWidth,
          height: fieldHeight,
        });
        yPos -= lineSpacing;
      }
    };
    
    // Helper function to add a checkbox
    const addCheckBox = (label: string, fieldName: string) => {
      // Draw label
      page.drawText(label, {
        x: 70,
        y: yPos + 5,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      // Create checkbox
      const checkBox = form.createCheckBox(fieldName);
      checkBox.addToPage(page, {
        x: 50,
        y: yPos,
        width: 15,
        height: 15,
      });
      
      yPos -= lineSpacing;
    };
    
    // Add form fields
    addTextField('Project Number:', 'projectNumber');
    addTextField('Project Title:', 'projectTitle');
    addTextField('Request Date:', 'requestDate');
    addTextField('Requested By:', 'requestedBy');
    addTextField('Organization:', 'organization');
    
    // Section header
    yPos -= 10;
    page.drawText('PROBLEM DESCRIPTION', {
      x: 50,
      y: yPos,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
    
    addTextField('Problem Description:', 'problemDescription', true);
    addTextField('Proposed Solution:', 'proposedSolution', true);
    addTextField('Justification:', 'justification', true);
    
    // Classification section
    page.drawText('CLASSIFICATION', {
      x: 50,
      y: yPos,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
    
    addTextField('Safety Classification:', 'safetyClassification');
    addTextField('Hazard Category:', 'hazardCategory');
    addTextField('Design Type:', 'designType');
    
    // MT Required section
    page.drawText('MT DETERMINATION', {
      x: 50,
      y: yPos,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
    
    addCheckBox('MT Required - YES', 'mtRequiredYes');
    addCheckBox('MT Required - NO', 'mtRequiredNo');
    addTextField('MT Required Reason:', 'mtRequiredReason', true);
    
    // Risk Assessment section
    page.drawText('RISK ASSESSMENT', {
      x: 50,
      y: yPos,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
    
    addTextField('Overall Risk:', 'overallRisk');
    addTextField('Safety Risk:', 'safetyRisk');
    addTextField('Environmental Risk:', 'environmentalRisk');
    addTextField('Operational Risk:', 'operationalRisk');
    
    // Signatures section
    page.drawText('APPROVALS', {
      x: 50,
      y: yPos,
      size: 12,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
    
    addTextField('Prepared By:', 'preparedBy');
    addTextField('Prepared Date:', 'preparedDate');
    addTextField('Reviewed By:', 'reviewedBy');
    addTextField('Reviewed Date:', 'reviewedDate');
    addTextField('Approved By:', 'approvedBy');
    addTextField('Approved Date:', 'approvedDate');
    
    // Additional fields
    addTextField('Confidence Level:', 'confidence');
    addTextField('Document ID:', 'documentId');
    addTextField('Generated Date:', 'generatedDate');
    
    const pdfBytes = await pdfDoc.save();
    console.log('Fillable MT form created successfully');
    
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    
  } catch (error) {
    console.error('Error creating fillable MT form:', error);
    throw error;
  }
}

// Function to download the fillable form template
export async function downloadFillableMTTemplate(): Promise<void> {
  try {
    const pdfBlob = await createFillableMTForm();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Fillable_MT_Form_Template.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Fillable MT form template downloaded');
  } catch (error) {
    console.error('Error downloading fillable form:', error);
  }
}
