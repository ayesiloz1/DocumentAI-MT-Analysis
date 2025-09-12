import React, { useState } from 'react';
import ChatInterface_Pure from './ChatInterface_Pure';
import '../styles/components/index.css';

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
    <div className="mt-analyzer-wrapper">
      <ChatInterface_Pure
        onSendMessage={handleSendMessage}
        onAnalyzeFile={handleAnalyzeFile}
        onScenariosUpdate={handleScenariosUpdate}
      />
    </div>
  );
};