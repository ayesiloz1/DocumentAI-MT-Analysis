import React, { useState, useCallback } from 'react';
import { DocumentAnalysisResult, ImprovementSuggestion } from '../types/documentAnalysis';
import { DocumentAnalysisAPI } from '../services/documentAnalysisAPI';

interface PDFAnalyzerProps {
  onAnalysisComplete?: (result: DocumentAnalysisResult) => void;
}

interface AnalysisOptions {
  documentType: string;
  performGrammarCheck: boolean;
  performStyleCheck: boolean;
  performTechnicalReview: boolean;
  performComplianceCheck: boolean;
}

const PDFAnalyzer: React.FC<PDFAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    documentType: 'general',
    performGrammarCheck: true,
    performStyleCheck: true,
    performTechnicalReview: true,
    performComplianceCheck: false
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
      }
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await DocumentAnalysisAPI.analyzePDF(selectedFile, {
        documentType: analysisOptions.documentType,
        performGrammarCheck: analysisOptions.performGrammarCheck,
        performStyleCheck: analysisOptions.performStyleCheck,
        performTechnicalReview: analysisOptions.performTechnicalReview,
        performComplianceCheck: analysisOptions.performComplianceCheck,
      });

      setAnalysisResult(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getQualityRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'satisfactory': return 'text-yellow-600';
      case 'needsimprovement': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Quality Analyzer</h1>
        <p className="text-gray-600">Upload a PDF document to get comprehensive quality analysis, grammar checking, and improvement suggestions.</p>
      </div>

      {/* File Upload Section */}
      <div className="mb-8">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-lg font-medium text-gray-900">Drop your PDF here or click to browse</p>
              <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Options */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={analysisOptions.documentType}
              onChange={(e) => setAnalysisOptions({...analysisOptions, documentType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General Document</option>
              <option value="technical">Technical Document</option>
              <option value="nuclear">Nuclear Engineering</option>
              <option value="regulatory">Regulatory Document</option>
              <option value="procedure">Procedure/Manual</option>
              <option value="specification">Technical Specification</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.performGrammarCheck}
                onChange={(e) => setAnalysisOptions({...analysisOptions, performGrammarCheck: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Grammar & Spelling Check</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.performStyleCheck}
                onChange={(e) => setAnalysisOptions({...analysisOptions, performStyleCheck: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Style & Clarity Analysis</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.performTechnicalReview}
                onChange={(e) => setAnalysisOptions({...analysisOptions, performTechnicalReview: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Technical Review</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisOptions.performComplianceCheck}
                onChange={(e) => setAnalysisOptions({...analysisOptions, performComplianceCheck: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Compliance Check</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mb-8">
        <button
          onClick={analyzeDocument}
          disabled={!selectedFile || isAnalyzing}
          className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Document...
            </>
          ) : (
            'Analyze Document'
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-8">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analysisResult.qualityScore.overall.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className={`text-sm font-medium ${getQualityRatingColor(analysisResult.qualityScore.rating)}`}>
                  {analysisResult.qualityScore.rating}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResult.qualityScore.grammar.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Grammar</div>
                <div className="text-xs text-gray-500">{analysisResult.grammar.totalIssues} issues</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analysisResult.qualityScore.style.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Style</div>
                <div className="text-xs text-gray-500">{analysisResult.style.issues.length} issues</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysisResult.qualityScore.technical.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Technical</div>
                <div className="text-xs text-gray-500">{analysisResult.technical.issues.length} issues</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded border">
              <p className="text-gray-700">{analysisResult.summary}</p>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pages:</span>
                <span className="ml-1 text-gray-600">{analysisResult.metadata.pageCount}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Words:</span>
                <span className="ml-1 text-gray-600">{analysisResult.metadata.wordCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Readability:</span>
                <span className="ml-1 text-gray-600">{analysisResult.metadata.readabilityLevel}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-1 text-gray-600">{analysisResult.metadata.documentType}</span>
              </div>
            </div>
          </div>

          {/* Improvement Suggestions */}
          {analysisResult.suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Improvement Suggestions ({analysisResult.suggestions.length})
              </h3>
              
              <div className="space-y-4">
                {analysisResult.suggestions.slice(0, 10).map((suggestion: ImprovementSuggestion, index: number) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(suggestion.impact)}`}>
                        {suggestion.impact}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-2">{suggestion.description}</p>
                    
                    {suggestion.beforeExample && suggestion.afterExample && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <div className="text-xs font-medium text-red-700 mb-1">Before:</div>
                          <div className="text-sm text-red-800">{suggestion.beforeExample}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <div className="text-xs font-medium text-green-700 mb-1">After:</div>
                          <div className="text-sm text-green-800">{suggestion.afterExample}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Category: {suggestion.category}</span>
                      <span>Estimated effort: {suggestion.estimatedEffortMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFAnalyzer;