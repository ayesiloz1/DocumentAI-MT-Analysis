import React, { useState, useCallback } from 'react';
import ChatInterface_Pure from './ChatInterface_Pure';
import { DocumentAnalysisAPI } from '../services/documentAnalysisAPI';
import { DocumentAnalysisResult } from '../types/documentAnalysis';
import '../styles/components/index.css';

// Enhanced MT Analyzer Component with PDF Analysis
export const MTAnalyzerWrapper: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPdfAnalysis, setLastPdfAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [pendingAnalysisMessage, setPendingAnalysisMessage] = useState<string | null>(null);

  const handleSendMessage = async (message: string) => {
    console.log('MT Analysis message:', message);
    // TODO: Integrate with existing MT analysis API
  };

  const handleAnalyzeFile = async (file: File) => {
    console.log('MT File analysis:', file.name);
    
    if (file.type === 'application/pdf') {
      setIsAnalyzing(true);
      setError(null);
      
      try {
        // First, analyze the PDF for document quality
        const pdfAnalysis = await DocumentAnalysisAPI.analyzePDF(file, {
          documentType: 'nuclear', // Default to nuclear for MT documents
          performGrammarCheck: true,
          performStyleCheck: true,
          performTechnicalReview: true,
          performComplianceCheck: true,
        });
        
        setLastPdfAnalysis(pdfAnalysis);
        
        // Create a comprehensive, well-structured analysis message
        const qualityRating = pdfAnalysis.qualityScore.overall >= 90 ? '🟢 Excellent' : 
                             pdfAnalysis.qualityScore.overall >= 75 ? '🟡 Good' : 
                             pdfAnalysis.qualityScore.overall >= 60 ? '🟠 Fair' : '🔴 Needs Improvement';
        
        const summaryMessage = `📄 **Document Analysis Complete**
*${file.name}*

---
## 📊 Quality Assessment

**Overall Rating:** ${qualityRating} (${pdfAnalysis.qualityScore.overall.toFixed(1)}/100)

| **Aspect** | **Score** | **Status** |
|------------|-----------|------------|
| Grammar & Style | ${pdfAnalysis.qualityScore.grammar.toFixed(1)}/100 | ${pdfAnalysis.grammar.totalIssues} issues found |
| Technical Quality | ${pdfAnalysis.qualityScore.technical.toFixed(1)}/100 | ${pdfAnalysis.qualityScore.technical >= 75 ? '✅ Strong' : '⚠️ Review needed'} |
| Compliance | ${pdfAnalysis.qualityScore.compliance?.toFixed(1) || 'N/A'}/100 | ${pdfAnalysis.qualityScore.compliance >= 75 ? '✅ Compliant' : '⚠️ Check required'} |

**Document Details:** ${pdfAnalysis.metadata.documentType} • ${pdfAnalysis.metadata.pageCount} pages • ${pdfAnalysis.metadata.wordCount.toLocaleString()} words

---
## 🔍 Key Insights

${pdfAnalysis.summary}

---
## 🚀 Priority Improvements

${pdfAnalysis.suggestions.slice(0, 3).map((s, i) => 
  `**${i + 1}. ${s.title}** *(${s.impact} impact)*\n   ${s.description}`
).join('\n\n')}

${pdfAnalysis.suggestions.length > 3 ? 
  `\n*📋 **+${pdfAnalysis.suggestions.length - 3} additional recommendations** available for detailed review*` : ''}

---
## 💬 What's Next?

🎯 **I can help you:**
• Fix specific grammar or style issues
• Enhance technical clarity
• Improve document structure
• Ensure MT compliance requirements
• Generate revised sections

**Just ask!** *"Fix the grammar issues"* or *"Help me improve the technical sections"*`;

        // Set the pending analysis message to be injected into chat
        setPendingAnalysisMessage(summaryMessage);
        
        // Also set the analysis results for the UI display
        setAnalysisResults([{
          type: 'pdf_analysis',
          fileName: file.name,
          summary: summaryMessage,
          fullAnalysis: pdfAnalysis,
          timestamp: new Date().toISOString()
        }]);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to analyze PDF';
        setError(`PDF Analysis Error: ${errorMessage}`);
        console.error('PDF analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setError('Please upload a PDF file for analysis');
    }
  };

  const handleScenariosUpdate = (scenarios: any[]) => {
    console.log('Test scenarios updated:', scenarios);
  };

  return (
    <div className="mt-analyzer-wrapper">
      {error && (
        <div className="analysis-error" style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          margin: '16px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {isAnalyzing && (
        <div className="analysis-loading" style={{
          background: '#dbeafe',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          padding: '12px',
          borderRadius: '8px',
          margin: '16px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div className="spinner" style={{
            width: '16px',
            height: '16px',
            border: '2px solid #bfdbfe',
            borderTop: '2px solid #1d4ed8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          📄 Analyzing PDF document...
        </div>
      )}
      
      {lastPdfAnalysis && (
        <div className="pdf-analysis-summary" style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px',
          fontSize: '14px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>
            📄 Latest PDF Analysis: {lastPdfAnalysis.metadata.fileName}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <strong>Overall Score:</strong> {lastPdfAnalysis.qualityScore.overall.toFixed(1)}/100
            </div>
            <div>
              <strong>Quality Rating:</strong> {lastPdfAnalysis.qualityScore.rating}
            </div>
            <div>
              <strong>Issues Found:</strong> {lastPdfAnalysis.grammar.totalIssues + lastPdfAnalysis.style.issues.length + lastPdfAnalysis.technical.issues.length}
            </div>
            <div>
              <strong>Suggestions:</strong> {lastPdfAnalysis.suggestions.length}
            </div>
          </div>
          <p style={{ margin: '0', color: '#374151' }}>
            <strong>Summary:</strong> {lastPdfAnalysis.summary}
          </p>
        </div>
      )}
      
      <ChatInterface_Pure
        onSendMessage={handleSendMessage}
        onAnalyzeFile={handleAnalyzeFile}
        onScenariosUpdate={handleScenariosUpdate}
        pendingAnalysisMessage={pendingAnalysisMessage}
        onAnalysisMessageProcessed={() => setPendingAnalysisMessage(null)}
      />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};