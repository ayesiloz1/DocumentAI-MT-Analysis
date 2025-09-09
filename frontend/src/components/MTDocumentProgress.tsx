import React, { useState, useEffect } from 'react';
import { mtDocumentService, MTDocumentData } from '../services/mtDocumentService';
import { FileDown, FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface MTDocumentProgressProps {
  className?: string;
}

const MTDocumentProgress: React.FC<MTDocumentProgressProps> = ({ className = '' }) => {
  const [progress, setProgress] = useState(0);
  const [documentData, setDocumentData] = useState<Partial<MTDocumentData>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to document updates
    mtDocumentService.onProgressUpdate((newProgress) => {
      setProgress(newProgress);
      setDocumentData(mtDocumentService.getCurrentDocument());
    });

    // Initialize with current state
    setProgress(mtDocumentService.calculateProgress());
    setDocumentData(mtDocumentService.getCurrentDocument());
  }, []);

  const handleDownload = () => {
    mtDocumentService.downloadDocument();
  };

  const getStatusIcon = (hasValue: boolean) => {
    return hasValue ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Circle className="h-4 w-4 text-gray-400" />
    );
  };

  const sections = [
    {
      title: 'Project Information',
      fields: [
        { label: 'Project Number', value: documentData.projectNumber, key: 'projectNumber' },
        { label: 'Project Title', value: documentData.projectTitle, key: 'projectTitle' },
        { label: 'Requested By', value: documentData.requestedBy, key: 'requestedBy' },
        { label: 'Organization', value: documentData.organization, key: 'organization' }
      ]
    },
    {
      title: 'Problem & Solution',
      fields: [
        { label: 'Problem Description', value: documentData.problemDescription, key: 'problemDescription' },
        { label: 'Proposed Solution', value: documentData.proposedSolution, key: 'proposedSolution' },
        { label: 'Justification', value: documentData.justification, key: 'justification' }
      ]
    },
    {
      title: 'Classification',
      fields: [
        { label: 'Safety Classification', value: documentData.safetyClassification, key: 'safetyClassification' },
        { label: 'Hazard Category', value: documentData.hazardCategory, key: 'hazardCategory' },
        { label: 'Design Type', value: documentData.designType, key: 'designType' }
      ]
    },
    {
      title: 'Analysis Results',
      fields: [
        { label: 'MT Required', value: documentData.mtRequired !== undefined ? (documentData.mtRequired ? 'YES' : 'NO') : '', key: 'mtRequired' },
        { label: 'MT Required Reason', value: documentData.mtRequiredReason, key: 'mtRequiredReason' },
        { label: 'Analysis Path', value: documentData.analysisPath, key: 'analysisPath' },
        { label: 'Confidence', value: documentData.confidence ? `${documentData.confidence}%` : '', key: 'confidence' }
      ]
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                MT Document Generation
              </h3>
              <p className="text-sm text-gray-600">
                Real-time document completion
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Document Completion
            </span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Download Button */}
        {progress > 50 && (
          <div className="mt-4">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span>Download MT Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Detailed View */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3">
              <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1">
                {section.title}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="flex items-start space-x-3">
                    {getStatusIcon(!!field.value)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700">
                        {field.label}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {field.value ? (
                          <span className="text-gray-900">
                            {typeof field.value === 'string' && field.value.length > 100
                              ? `${field.value.substring(0, 100)}...`
                              : String(field.value)
                            }
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            To be completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Risk Assessment */}
          {documentData.riskAssessment && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-1">
                Risk Assessment
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Overall Risk:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {documentData.riskAssessment.overallRisk || 'TBD'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">Safety Risk:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {documentData.riskAssessment.safetyRisk || 'TBD'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Environmental Risk:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {documentData.riskAssessment.environmentalRisk || 'TBD'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Operational Risk:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {documentData.riskAssessment.operationalRisk || 'TBD'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status Summary */}
          <div className="bg-gray-50 rounded-md p-4">
            <div className="text-sm text-gray-600">
              <strong>Status:</strong> {progress < 30 && 'Getting started...' ||
                                      progress < 60 && 'In progress...' ||
                                      progress < 90 && 'Nearly complete...' ||
                                      'Ready for review and approval'}
            </div>
            {progress === 100 && (
              <div className="mt-2 text-sm text-green-700 font-medium">
                ✓ Document is complete and ready for download!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MTDocumentProgress;
