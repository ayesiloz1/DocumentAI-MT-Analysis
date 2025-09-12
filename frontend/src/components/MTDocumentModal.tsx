import React, { useState } from 'react';
import { X, Maximize2, Minimize2, Download, FileText, Printer, Edit } from 'lucide-react';

interface MTDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentHTML: string;
  mtData: any;
  onEdit?: () => void;
  onDownloadPDF?: () => void;
  onDownloadWord?: () => void;
}

export default function MTDocumentModal({ 
  isOpen, 
  onClose, 
  documentHTML, 
  mtData, 
  onEdit,
  onDownloadPDF,
  onDownloadWord 
}: MTDocumentModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen) return null;

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
      isFullScreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${
        isFullScreen 
          ? 'w-full h-full rounded-none' 
          : 'w-[95vw] h-[90vh] max-w-7xl'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Modification Traveler Document
              </h2>
              <p className="text-sm text-gray-600">
                {mtData?.title || 'Generated from AI Analysis'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit Document"
            >
              <Edit size={20} />
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
              title="Print Document"
            >
              <Printer size={20} />
            </button>
            
            <button
              onClick={onDownloadWord}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Download Word"
            >
              <FileText size={20} />
            </button>
            
            <button
              onClick={onDownloadPDF}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            
            <div className="w-px h-6 bg-gray-300"></div>
            
            <button
              onClick={toggleFullScreen}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-white">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-5xl bg-white">
                <div 
                  dangerouslySetInnerHTML={{ __html: documentHTML }}
                  className="document-content print:shadow-none p-6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Generated: {new Date().toLocaleString()} | System: Enhanced MT Analysis Platform
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Return to Chat
            </button>
            <button
              onClick={onDownloadPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Print Styles */
const printStyles = `
@media print {
  .document-modal {
    position: static !important;
    width: 100% !important;
    height: 100% !important;
    background: white !important;
  }
  
  .document-content {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Hide everything except document content when printing */
  body > *:not(.document-modal) {
    display: none !important;
  }
}
`;

// Inject print styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = printStyles;
  document.head.appendChild(styleSheet);
}
