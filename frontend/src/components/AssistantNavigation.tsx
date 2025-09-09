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
    { id: 'grb', name: 'GRB Document', icon: ClipboardList, color: '#059669', status: 'coming-soon' },
    { id: 'fsar', name: 'FSAR Assistant', icon: BookOpen, color: '#7c3aed', status: 'coming-soon' },
    { id: 'techspec', name: 'Tech Spec', icon: Search, color: '#ea580c', status: 'coming-soon' },
    { id: 'license', name: 'License Amendment', icon: FileCheck, color: '#0891b2', status: 'coming-soon' }
  ];

  return (
    <nav className="nuclear-platform-nav">
      <div className="platform-header">
        <h1>🏢 Nuclear Facility Document AI Platform</h1>
        <p>Intelligent Analysis for Nuclear Engineering Excellence</p>
      </div>
      
      <div className="assistant-tabs">
        {assistants.map(assistant => {
          const Icon = assistant.icon;
          const isComingSoon = assistant.status === 'coming-soon';
          
          return (
            <button
              key={assistant.id}
              className={`assistant-tab ${activeAssistant === assistant.id ? 'active' : ''} ${isComingSoon ? 'coming-soon' : ''}`}
              onClick={() => !isComingSoon && onAssistantChange(assistant.id)}
              disabled={isComingSoon}
              style={{
                borderBottom: activeAssistant === assistant.id ? `3px solid ${assistant.color}` : 'none'
              } as React.CSSProperties}
              title={isComingSoon ? 'Coming Soon - In Development' : `Switch to ${assistant.name}`}
            >
              <Icon size={20} />
              <span>{assistant.name}</span>
              {isComingSoon && <span className="coming-soon-badge">🚧</span>}
            </button>
          );
        })}
      </div>
      
      <div className="platform-status">
        <div className="status-item active">
          <span className="status-dot"></span>
          <span>MT Analyzer: ✅ Active & Production Ready</span>
        </div>
        <div className="status-item">
          <span className="status-dot coming-soon"></span>
          <span>Other Assistants: 🚧 In Development Pipeline</span>
        </div>
      </div>
    </nav>
  );
};
