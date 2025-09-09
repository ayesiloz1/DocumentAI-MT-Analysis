import React, { useState } from 'react';
import { AssistantNavigation } from './AssistantNavigation';
import { MTAnalyzerWrapper } from './MTAnalyzerWrapper';

// Placeholder components for coming soon assistants
const ComingSoonAssistant: React.FC<{ name: string; icon: string; description: string; features: string[] }> = ({ 
  name, 
  icon, 
  description, 
  features 
}) => (
  <div className="coming-soon-assistant">
    <div className="coming-soon-header">
      <div className="coming-soon-icon">{icon}</div>
      <div className="coming-soon-content">
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
    </div>
    
    <div className="coming-soon-body">
      <div className="development-status">
        <h3>🚧 Development Status</h3>
        <div className="status-badge">In Development Pipeline</div>
        <p>This assistant is being developed with the same nuclear engineering expertise as the MT Analyzer.</p>
      </div>
      
      <div className="planned-features">
        <h3>📋 Planned Features</h3>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="timeline-info">
        <h3>📅 Expected Timeline</h3>
        <p>This assistant will be available in a future release. Development follows our phased approach to ensure nuclear facility grade quality and compliance.</p>
      </div>
      
      <div className="mt-recommendation">
        <div className="recommendation-box">
          <h4>💡 Current Recommendation</h4>
          <p>Continue using the <strong>MT Analyzer</strong> for your current nuclear facility needs. It provides comprehensive modification traveler analysis with pure GPT-4 intelligence.</p>
          <button 
            className="back-to-mt-button"
            onClick={() => window.location.reload()}
          >
            🔧 Return to MT Analyzer
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const AssistantContainer: React.FC = () => {
  const [activeAssistant, setActiveAssistant] = useState('mt');

  const renderActiveAssistant = () => {
    switch (activeAssistant) {
      case 'mt':
        return <MTAnalyzerWrapper />;
        
      case 'usq':
        return (
          <ComingSoonAssistant
            name="⚡ USQ Assistant"
            icon="⚡"
            description="10 CFR 50.59 Unreviewed Safety Question Analysis with AI-powered regulatory intelligence"
            features={[
              "8-Question USQ screening automation",
              "10 CFR 50.59 compliance analysis", 
              "Safety significance evaluation",
              "Regulatory citation and guidance",
              "FSAR impact assessment",
              "Professional USQ documentation generation"
            ]}
          />
        );
        
      case 'grb':
        return (
          <ComingSoonAssistant
            name="📋 GRB Document Assistant"
            icon="📋"
            description="Generic Review Board document preparation and analysis for nuclear facility modifications"
            features={[
              "GRB package preparation automation",
              "Template-based document generation",
              "Regulatory compliance checking",
              "Review criteria validation",
              "Professional formatting and structure",
              "Multi-discipline coordination support"
            ]}
          />
        );
        
      case 'fsar':
        return (
          <ComingSoonAssistant
            name="📖 FSAR Assistant"
            icon="📖"
            description="Final Safety Analysis Report updates and impact analysis for nuclear facility changes"
            features={[
              "FSAR section impact analysis",
              "Cross-reference validation",
              "Safety analysis methodology review",
              "Chapter consistency checking",
              "Regulatory compliance verification",
              "Professional FSAR update generation"
            ]}
          />
        );
        
      case 'techspec':
        return (
          <ComingSoonAssistant
            name="🔍 Tech Spec Assistant"
            icon="🔍"
            description="Technical Specification compliance analysis and surveillance test evaluation"
            features={[
              "Tech Spec applicability analysis",
              "Surveillance requirement evaluation",
              "Limiting Condition for Operation (LCO) review",
              "Operability determination support",
              "Regulatory compliance validation",
              "Professional Tech Spec documentation"
            ]}
          />
        );
        
      case 'license':
        return (
          <ComingSoonAssistant
            name="📄 License Amendment Assistant"
            icon="📄"
            description="License Amendment Request preparation and regulatory analysis"
            features={[
              "LAR package preparation",
              "No Significant Hazards Consideration analysis",
              "Environmental assessment support",
              "Regulatory justification development",
              "NRC communication templates",
              "Professional LAR documentation"
            ]}
          />
        );
        
      default:
        return <MTAnalyzerWrapper />;
    }
  };

  return (
    <div className="nuclear-platform">
      <AssistantNavigation 
        activeAssistant={activeAssistant}
        onAssistantChange={setActiveAssistant}
      />
      
      <main className="assistant-content">
        {renderActiveAssistant()}
      </main>
    </div>
  );
};
