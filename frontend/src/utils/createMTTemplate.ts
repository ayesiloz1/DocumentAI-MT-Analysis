import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

// Import the MTDocumentData interface
interface MTDocumentData {
  projectNumber?: string;
  title?: string;
  facility?: string;
  submittedBy?: string;
  submissionDate?: string;
  estimatedStartDate?: string;
  estimatedCompleteDate?: string;
  dueDate?: string;
  priority?: string;
  description?: string;
  justification?: string;
  scopeOfWork?: string;
  workLocation?: string;
  mtRequired?: boolean;
  mtRequiredReason?: string;
  hazardCategory?: string;
  designType?: string;
  analysisPath?: string;
  confidence?: number;
  riskAssessment?: {
    overallRisk: string;
    safetyRisk: string;
    environmentalRisk: string;
    operationalRisk: string;
    riskFactors?: string[];
    mitigationRecommendations?: string[];
  };
  designInputs?: string;
  applicableCodes?: string;
  designCriteria?: string;
  environmentalConditions?: string;
  interfaceRequirements?: string;
  workPackageNumbers?: string;
  otherOutputs?: string;
  safetyImpacts?: string;
  operationalImpacts?: string;
  maintenanceImpacts?: string;
  otherImpacts?: string;
  preparedBy?: string;
  preparedDate?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
}

export async function createMTTemplate(data?: Partial<MTDocumentData>): Promise<Blob> {
  // Default data values
  const defaultData = {
    projectNumber: data?.projectNumber || '[Project Number]',
    title: data?.title || '[Modification Title]',
    facility: data?.facility || '[Facility Name]',
    submittedBy: data?.submittedBy || '[Submitter Name]',
    submissionDate: data?.submissionDate || new Date().toLocaleDateString(),
    priority: data?.priority || '[Priority]',
    dueDate: data?.dueDate || '[Due Date]',
    description: data?.description || '[Description of modification]',
    justification: data?.justification || '[Technical justification]',
    workLocation: data?.workLocation || '[Work Location]',
    hazardCategory: data?.hazardCategory || '[Category]',
    designType: data?.designType || '[Design Type]',
    mtRequired: data?.mtRequired !== undefined ? (data?.mtRequired ? 'YES' : 'NO') : '[TBD]',
    mtRequiredReason: data?.mtRequiredReason || '[MT determination basis]',
    confidence: data?.confidence ? `${data.confidence}%` : '[TBD]',
    analysisPath: data?.analysisPath || '[Analysis method]',
    preparedBy: data?.preparedBy || '[Prepared By]',
    preparedDate: data?.preparedDate || '[Date]',
    reviewedBy: data?.reviewedBy || '[Reviewed By]',
    reviewedDate: data?.reviewedDate || '[Date]',
    approvedBy: data?.approvedBy || '[Approved By]',
    approvedDate: data?.approvedDate || '[Date]',
    generatedDate: new Date().toLocaleString()
  };

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header with document number and date
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `MT-${defaultData.projectNumber} Rev.00 ${defaultData.generatedDate} Page {pageNum} of {totalPages}`, size: 20 })]
                    })
                  ],
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Main Title
        new Paragraph({
          children: [
            new TextRun({
              text: "MODIFICATION TRAVELER",
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        
        // Subtitle
        new Paragraph({
          children: [
            new TextRun({
              text: "Prepared For the U.S. Department of Energy, Assistant Secretary for Environmental Management",
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "By Washington River Protection Solutions, LLC., PO Box 850, Richland, WA 99352",
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Contractor For U.S. Department of Energy, Office of River Protection, under Contract DE-AC27-08RV14800",
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "TRADEMARK DISCLAIMER: Reference herein to any specific commercial product, process, or service by trade name, trademark, manufacturer, or otherwise, does not necessarily constitute or imply its endorsement, recommendation, or favoring by the United States government or any agency thereof or its contractors or subcontractors. Printed in the United States of America.",
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Header Info Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "1. MT No:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: defaultData.projectNumber })] }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Rev.", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "00" })] }),
                  ],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "2. Title:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: defaultData.title })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Release Stamp", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "Clearance Review", size: 18 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Restriction Type:", size: 18 })] }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Section I - REQUEST FOR MODIFICATION
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION I REQUEST FOR MODIFICATION",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Fields 3-7
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "3. Requested Completion Date (Optional):", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: defaultData.dueDate })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "4. CACN (optional)", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{cacn}" })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "5. Project Number: ☐", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{projectNumber}" })] }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "6. Design Type:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ I ☐ II ☐ III ☐ IV ☐ V ☐ VI" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{designType}" })] }),
                  ],
                  width: { size: 35, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "7. Project Type:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{projectType}" })] }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Field 8 - Related Structures, Systems, and Components
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "8. Related Structures, Systems, and Components", bold: true })] }),
                  ],
                  columnSpan: 3,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "a. Related Building/Facilities ☐ N/A", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{relatedBuildings}" })] }),
                  ],
                  width: { size: 33, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "b. Related Systems ☐ N/A", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{relatedSystems}" })] }),
                  ],
                  width: { size: 33, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "c. Related Equipment ID Nos. (EIN) ☐ N/A", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{relatedEquipment}" })] }),
                  ],
                  width: { size: 34, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Field 9 - Problem Description
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "9. Problem Description", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{problemDescription}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                  ],
                }),
              ],
            }),
          ],
        }),

        // Field 10 - Justification
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "10. Justification", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{justification}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "." })] }),
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                  ],
                }),
              ],
            }),
          ],
        }),

        // Section II - REQUIRED FOR DESIGN TYPE 1 PROJECTS
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION II REQUIRED FOR DESIGN TYPE 1 PROJECTS",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Fields 11a, 11b, 11c
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "11a. Project Design Review Required (TFC-ENG-DESIGN-D-17.1)?", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ Yes ☐ No ☐ N/A" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{designReviewRequired}" })] }),
                  ],
                  width: { size: 33, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "11b. Major Modification Evaluation Required (Use 1189 Checklist)?", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ Yes ☐ No ☐ N/A" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{majorModificationEval}" })] }),
                  ],
                  width: { size: 33, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "11c. Safety In Design Strategy Required?", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ Yes ☐ No ☐ N/A" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{safetyInDesign}" })] }),
                  ],
                  width: { size: 34, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Section III - PROPOSED SOLUTION
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION III PROPOSED SOLUTION",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Field 12 - Proposed Solution
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "12. Proposed Solution", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{proposedSolution}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                  ],
                }),
              ],
            }),
          ],
        }),

        // Section IV - DESIGN INPUT RECORD
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION IV DESIGN INPUT RECORD",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Field 13 - Design Inputs Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "13. Design Inputs ☐ N/A", bold: true })] })],
                  columnSpan: 4,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Type of Document", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Document Number", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Rev.", bold: true })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            // Multiple empty rows for design inputs
            ...Array.from({ length: 10 }, () => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
              ],
            })),
          ],
        }),

        // Field 14 - Other Design Input Considerations
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "14. Other Design Input Considerations:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{otherDesignInputs}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "" })] }), // Spacer
                  ],
                }),
              ],
            }),
          ],
        }),

        // Page break indicator
        new Paragraph({
          children: [new TextRun({ text: "1 SPF-015 (Rev.B1)", size: 18 })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 300, after: 300 },
        }),

        // Page 2 Header
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "MT-{mtNumber} Rev.{revision} {date} - {time} 2 of 2", size: 20 })]
                    })
                  ],
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "MODIFICATION TRAVELER", bold: true, size: 24 })] })],
                  width: { size: 60, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "MT No.:", bold: true })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Rev.", bold: true })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Fields 15-18
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "15. Preliminary Safety Classification:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ SC ☐ SS ☐ GS ☐ N/A" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{safetyClassification}" })] }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "16a. Environmental Risk:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "(TFC-ENG-DESIGN-C-52 Att. D)" })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ Yes ☐ No" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{environmentalRisk}" })] }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "16b. Radiological Risk:", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "(TFC-ENG-DESIGN-C-52 Att. D)" })] }),
                    new Paragraph({ children: [new TextRun({ text: "☐ Yes ☐ No" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{radiologicalRisk}" })] }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "17. Hazard Category", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{hazardCategory}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "18. Approval Designators", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{approvalDesignators}" })] }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Section V - IMPACTS
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION V IMPACTS",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Field 19 - Impacted Documents
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "19. Impacted Documents ☐ N/A", bold: true })] })],
                  columnSpan: 4,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Type of Document", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Document Number", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Rev.", bold: true })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
              ],
            }),
          ],
        }),

        // Field 20 - Other Impacts
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "20. Other Impacts", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{otherImpacts}" })] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Section VI - DESIGN OUTPUT RECORD
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION VI DESIGN OUTPUT RECORD",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Field 21 - Design Outputs
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "21. Design Outputs ☐ N/A", bold: true })] })],
                  columnSpan: 4,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Type of Document", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Document Number", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Rev.", bold: true })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
              ],
            }),
          ],
        }),

        // Fields 22-23
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "22. Work Package Numbers: ☐ N/A", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{workPackageNumbers}" })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "23. Other Outputs", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{otherOutputs}" })] }),
                  ],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        // Section VII - DESIGN INPUT AND CLOSURE APPROVALS
        new Paragraph({
          children: [
            new TextRun({
              text: "SECTION VII DESIGN INPUT AND CLOSURE APPROVALS",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Field 24 - Approvals
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "24. Approvals", bold: true })] })],
                  columnSpan: 4,
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Signature", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            // Multiple empty rows for approvals
            ...Array.from({ length: 5 }, () => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
              ],
            })),
          ],
        }),

        // Footer
        new Paragraph({
          children: [new TextRun({ text: "2 SPF-015 (Rev.B1)", size: 18 })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 300 },
        }),

      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
