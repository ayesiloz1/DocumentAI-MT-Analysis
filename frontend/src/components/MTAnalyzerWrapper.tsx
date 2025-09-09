import React, { useState } from 'react';
import ChatInterface from './ChatInterface_Pure';
import MTDocumentPreview from './MTDocumentPreview';

// Full MT Analyzer with side-by-side layout
export const MTAnalyzerWrapper: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (message: string) => {
    console.log('MT Analysis message:', message);
  };

  const handleAnalyzeFile = async (file: File) => {
    console.log('MT File analysis:', file.name);
  };

  const handleScenariosUpdate = (scenarios: any[]) => {
    console.log('📋 Test scenarios updated:', scenarios);
  };

  return (
    <div className="mt-analyzer-full">
      {/* Application Header */}
      <header className="mt-app-header">
        <div className="mt-header-content">
          <div className="mt-header-info">
            <div className="mt-logo">
              <span className="mt-icon">MT</span>
            </div>
            <div className="mt-title">
              <h1>MT Analysis System</h1>
              <p>Nuclear Facility Modification Traveler Intelligence</p>
            </div>
          </div>
          <div className="mt-status-badges">
            <span className="badge success">✅ GPT-4 Active</span>
            <span className="badge info">🧠 Enhanced Intelligence</span>
          </div>
        </div>
      </header>

      {/* Main Content - Side by Side Layout with FLEXBOX */}
      <main style={{ padding: '1rem', maxWidth: '100%' }}>
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            height: 'calc(100vh - 200px)',
            minHeight: '600px',
            width: '100%'
          }}
        >
          {/* LEFT PANEL - Chat Interface (Blue Border) */}
          <div 
            style={{
              flex: '1',
              background: 'white',
              border: '2px solid blue',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              padding: '1rem 1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>� MT Analysis Chat</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Describe your nuclear facility modification</p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatInterface
                onSendMessage={handleSendMessage}
                onAnalyzeFile={handleAnalyzeFile}
                onScenariosUpdate={handleScenariosUpdate}
              />
            </div>
          </div>

          {/* RIGHT PANEL - Live Document Preview (Green Border) */}
          <div 
            style={{
              flex: '1',
              background: 'white',
              border: '2px solid green',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              padding: '1rem 1.5rem'
            }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>� Live MT Document Preview</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Real-time modification traveler generation</p>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <MTDocumentPreview />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};