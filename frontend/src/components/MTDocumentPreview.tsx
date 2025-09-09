import React, { useState, useEffect } from 'react';
import { mtDocumentService } from '../services/mtDocumentService';
import { FileText, Eye, Download } from 'lucide-react';

interface MTDocumentPreviewProps {
  className?: string;
}

const MTDocumentPreview: React.FC<MTDocumentPreviewProps> = ({ className = '' }) => {
  const [progress, setProgress] = useState(0);
  const [previewHTML, setPreviewHTML] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Subscribe to document updates
    mtDocumentService.onProgressUpdate((newProgress: number) => {
      setProgress(newProgress);
    });

    mtDocumentService.onDocumentPreview((newPreview: string) => {
      setPreviewHTML(newPreview);
    });

    // Initialize with current data
    setProgress(mtDocumentService.calculateProgress());
    setPreviewHTML(mtDocumentService.generatePreviewHTML());
  }, []);

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      await mtDocumentService.downloadDocument();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`document-panel ${className}`}>
      {/* Header */}
      <div className="document-header">
        <div className="document-header-content">
          <div className="document-title-section">
            <FileText className="icon-primary" />
            <div>
              <h3 className="document-title">
                Live MT Document Preview
              </h3>
              <p className="document-subtitle">
                Real-time generation of your Modification Traveler
              </p>
            </div>
          </div>
          
          {progress > 0 && (
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="btn btn-primary"
            >
              {isDownloading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download DOCX</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">
              Document Completion
            </span>
            <span className="progress-percentage">
              {progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="document-content">
        {progress === 0 ? (
          <div className="empty-state">
            <Eye className="empty-state-icon" />
            <p className="empty-state-text">
              Start your MT analysis to see the live document preview
            </p>
          </div>
        ) : (
          <div className="document-preview-container">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span className="live-label">Live Preview</span>
            </div>
            
            {/* Document Preview */}
            <div 
              className="document-preview-content"
              dangerouslySetInnerHTML={{ __html: previewHTML }}
            />
            
            {/* Status Information */}
            <div className="document-status">
              <div className="status-header">
                <div className="status-dot"></div>
                <span className="status-title">Document Status</span>
              </div>
              <div className="status-message">
                {progress < 50 && "Collecting project information and requirements..."}
                {progress >= 50 && progress < 80 && "Analyzing modification scope and safety classification..."}
                {progress >= 80 && progress < 100 && "Finalizing risk assessment and documentation..."}
                {progress === 100 && "✅ Document ready for download!"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MTDocumentPreview;
