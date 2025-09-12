import React, { useState } from 'react';
import ChatInterface_Pure from './ChatInterface_Pure';

// Simple MT Analyzer Component
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
    console.log('Test scenarios updated:', scenarios);
  };

  return (
    <div className="container mx-auto p-4">
      

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Modification Traveler Analysis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyze your modification scenario to determine MT requirements
            </p>
          </div>
          
          <div className="p-0">
            <ChatInterface_Pure
              onSendMessage={handleSendMessage}
              onAnalyzeFile={handleAnalyzeFile}
              onScenariosUpdate={handleScenariosUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};