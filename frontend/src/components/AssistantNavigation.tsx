import React from 'react';
import { FileText, Zap, ClipboardList, BookOpen, Search, FileCheck } from 'lucide-react';

interface AssistantNavigationProps {
  activeAssistant: string;
  onAssistantChange: (assistant: string) => void;
}

export const AssistantNavigation: React.FC<AssistantNavigationProps> = ({
  activeAssistant,
  onAssistantChange
}) => {
  const assistants = [
    { id: 'mt', name: 'MT Analyzer', icon: FileText, color: '#2563eb', status: 'active' },
    { id: 'usq', name: 'USQ Assistant', icon: Zap, color: '#dc2626', status: 'coming-soon' },
    { id: 'grb', name: 'GRB Document', icon: ClipboardList, color: '#059669', status: 'coming-soon' }
  ];

  return (
    <nav className="nuclear-platform-nav" suppressHydrationWarning>
      <div className="platform-header">
        <h1>Document AI</h1>
      </div>
      
      <div className="assistant-tabs">
        {assistants.map(assistant => {
          const Icon = assistant.icon;
          const isComingSoon = assistant.status === 'coming-soon';
          
          return (
            <button
              key={assistant.id}
              className={`assistant-tab ${activeAssistant === assistant.id ? 'assistant-tab--active' : 'assistant-tab--inactive'} ${isComingSoon ? 'coming-soon' : ''}`}
              onClick={() => !isComingSoon && onAssistantChange(assistant.id)}
              disabled={isComingSoon}
              title={isComingSoon ? 'Coming Soon - In Development' : `Switch to ${assistant.name}`}
            >
              <Icon size={20} />
              <span>{assistant.name}</span>
              {isComingSoon && <span className="coming-soon-badge">Coming Soon</span>}
            </button>
          );
        })}
      </div>
    
    </nav>
  );
};
