# 🏗️ Multi-Assistant Nuclear Facility Platform - Implementation Guide

## 🎯 **Unified Platform Architecture**

Transform your current MT Analyzer into a comprehensive nuclear facility document assistant platform with multiple specialized tools.

## 📋 **Platform Structure**

### **Frontend Navigation Architecture:**
```
DocumentAI Nuclear Platform/
├── 🔧 MT Analyzer (Current)
├── ⚡ USQ Assistant (Next)  
├── 📋 GRB Document Assistant (Phase 3)
├── 📖 FSAR Assistant (Phase 4)
├── 🔍 Tech Spec Assistant (Phase 5)
└── 📊 License Amendment Assistant (Phase 6)
```

---

## 🚀 **Phase 1: Add USQ Assistant to Current System**

### **Step 1: Update Frontend Navigation**

#### **Add Navigation Component:**
```typescript
// frontend/src/components/AssistantNavigation.tsx
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
    { id: 'mt', name: 'MT Analyzer', icon: FileText, color: '#2563eb' },
    { id: 'usq', name: 'USQ Assistant', icon: Zap, color: '#dc2626' },
    { id: 'grb', name: 'GRB Document', icon: ClipboardList, color: '#059669' },
    { id: 'fsar', name: 'FSAR Assistant', icon: BookOpen, color: '#7c3aed' },
    { id: 'techspec', name: 'Tech Spec', icon: Search, color: '#ea580c' },
    { id: 'license', name: 'License Amendment', icon: FileCheck, color: '#0891b2' }
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
          return (
            <button
              key={assistant.id}
              className={`assistant-tab ${activeAssistant === assistant.id ? 'active' : ''}`}
              onClick={() => onAssistantChange(assistant.id)}
              style={{
                '--tab-color': assistant.color,
                borderBottom: activeAssistant === assistant.id ? `3px solid ${assistant.color}` : 'none'
              }}
            >
              <Icon size={20} />
              <span>{assistant.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
```

#### **Add Navigation Styling:**
```css
/* frontend/src/styles/platform-navigation.css */
.nuclear-platform-nav {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.platform-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.platform-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.platform-header p {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
}

.assistant-tabs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.assistant-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.assistant-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.assistant-tab.active {
  background: rgba(255, 255, 255, 0.95);
  color: var(--tab-color, #1e40af);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.assistant-tab span {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .assistant-tabs {
    gap: 0.25rem;
  }
  
  .assistant-tab {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .assistant-tab span {
    display: none;
  }
}
```

### **Step 2: Create Assistant Container Component**

```typescript
// frontend/src/components/AssistantContainer.tsx
import React, { useState } from 'react';
import { AssistantNavigation } from './AssistantNavigation';
import { MTAnalyzer } from './MTAnalyzer';
import { USQAssistant } from './USQAssistant';
import { GRBAssistant } from './GRBAssistant';
import { FSARAssistant } from './FSARAssistant';

export const AssistantContainer: React.FC = () => {
  const [activeAssistant, setActiveAssistant] = useState('mt');

  const renderActiveAssistant = () => {
    switch (activeAssistant) {
      case 'mt':
        return <MTAnalyzer />;
      case 'usq':
        return <USQAssistant />;
      case 'grb':
        return <GRBAssistant />;
      case 'fsar':
        return <FSARAssistant />;
      case 'techspec':
        return <div className="coming-soon">🚧 Tech Spec Assistant Coming Soon</div>;
      case 'license':
        return <div className="coming-soon">🚧 License Amendment Assistant Coming Soon</div>;
      default:
        return <MTAnalyzer />;
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
```

---

## 🔧 **Step 3: Create USQ Assistant Component**

### **USQ Assistant Interface:**
```typescript
// frontend/src/components/USQAssistant.tsx
import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface USQAnalysisRequest {
  changeDescription: string;
  facilityType: string;
  systemsAffected: string[];
  safetyFunctions: string[];
  fsarSections: string[];
}

interface USQAnalysisResult {
  usqRequired: boolean;
  screeningResults: {
    question1: boolean; // Increase accident probability?
    question2: boolean; // Create new accident scenario?
    question3: boolean; // Increase radiological consequences?
    question4: boolean; // Create new equipment malfunction?
    question5: boolean; // Reduce safety margin?
    question6: boolean; // Create new FSAR methodology?
    question7: boolean; // Reduce defense-in-depth?
    question8: boolean; // Create new precedent?
  };
  reasoning: string;
  regulatoryBasis: string[];
  recommendations: string[];
  confidence: number;
}

export const USQAssistant: React.FC = () => {
  const [request, setRequest] = useState<USQAnalysisRequest>({
    changeDescription: '',
    facilityType: 'PWR',
    systemsAffected: [],
    safetyFunctions: [],
    fsarSections: []
  });
  
  const [analysis, setAnalysis] = useState<USQAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/usq/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('USQ analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="usq-assistant">
      <div className="assistant-header">
        <Zap size={32} className="text-red-600" />
        <div>
          <h2>⚡ USQ Assistant</h2>
          <p>10 CFR 50.59 Unreviewed Safety Question Analysis</p>
        </div>
      </div>

      <div className="usq-layout">
        <div className="usq-input-panel">
          <div className="input-section">
            <label>Change Description:</label>
            <textarea
              value={request.changeDescription}
              onChange={(e) => setRequest({...request, changeDescription: e.target.value})}
              placeholder="Describe the proposed change in detail..."
              rows={6}
            />
          </div>

          <div className="input-section">
            <label>Facility Type:</label>
            <select
              value={request.facilityType}
              onChange={(e) => setRequest({...request, facilityType: e.target.value})}
            >
              <option value="PWR">Pressurized Water Reactor (PWR)</option>
              <option value="BWR">Boiling Water Reactor (BWR)</option>
              <option value="CANDU">CANDU Reactor</option>
              <option value="Advanced">Advanced Reactor</option>
            </select>
          </div>

          <div className="input-section">
            <label>Systems Affected:</label>
            <div className="checkbox-grid">
              {[
                'Reactor Coolant System', 'Emergency Core Cooling', 'Reactor Protection System',
                'Emergency Diesel Generators', 'Containment Systems', 'Main Steam System',
                'Auxiliary Feedwater', 'Component Cooling Water', 'Service Water System',
                'Electrical Distribution', 'Instrumentation & Control', 'Fuel Handling'
              ].map(system => (
                <label key={system} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={request.systemsAffected.includes(system)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRequest({...request, systemsAffected: [...request.systemsAffected, system]});
                      } else {
                        setRequest({...request, systemsAffected: request.systemsAffected.filter(s => s !== system)});
                      }
                    }}
                  />
                  {system}
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!request.changeDescription || isLoading}
            className="analyze-button usq-button"
          >
            {isLoading ? '🔄 Analyzing USQ...' : '⚡ Analyze USQ Requirements'}
          </button>
        </div>

        <div className="usq-results-panel">
          {analysis && (
            <div className="usq-results">
              <div className={`usq-determination ${analysis.usqRequired ? 'usq-required' : 'no-usq'}`}>
                {analysis.usqRequired ? (
                  <>
                    <AlertTriangle size={24} />
                    <span>USQ REQUIRED - Further Evaluation Needed</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={24} />
                    <span>NO USQ - Change May Proceed</span>
                  </>
                )}
              </div>

              <div className="screening-questions">
                <h3>📋 8-Question USQ Screening Results:</h3>
                {Object.entries(analysis.screeningResults).map(([question, result], index) => (
                  <div key={question} className={`screening-result ${result ? 'yes' : 'no'}`}>
                    <span className="question-number">Q{index + 1}</span>
                    <span className="result-indicator">{result ? '✅ YES' : '❌ NO'}</span>
                  </div>
                ))}
              </div>

              <div className="analysis-details">
                <h3>🧠 AI Analysis & Reasoning:</h3>
                <div className="reasoning-text">
                  {analysis.reasoning}
                </div>

                <h3>📚 Regulatory Basis:</h3>
                <ul className="regulatory-list">
                  {analysis.regulatoryBasis.map((basis, index) => (
                    <li key={index}>{basis}</li>
                  ))}
                </ul>

                <h3>💡 Recommendations:</h3>
                <ul className="recommendations-list">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>

                <div className="confidence-score">
                  <span>🎯 AI Confidence: {(analysis.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 🔧 **Step 4: Add USQ Backend API**

### **USQ Controller:**
```csharp
// Controllers/USQAnalysisController.cs
using Microsoft.AspNetCore.Mvc;
using MTAnalyzer.Models;
using MTAnalyzer.Services;

namespace MTAnalyzer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class USQController : ControllerBase
    {
        private readonly IUSQAnalysisService _usqService;
        private readonly ILogger<USQController> _logger;

        public USQController(IUSQAnalysisService usqService, ILogger<USQController> logger)
        {
            _usqService = usqService;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<ActionResult<USQAnalysisResult>> AnalyzeUSQ([FromBody] USQAnalysisRequest request)
        {
            try
            {
                _logger.LogInformation("Starting USQ analysis for change: {ChangeDescription}", 
                    request.ChangeDescription[..Math.Min(100, request.ChangeDescription.Length)]);

                var result = await _usqService.AnalyzeUSQAsync(request);
                
                _logger.LogInformation("USQ analysis completed. USQ Required: {USQRequired}", result.USQRequired);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during USQ analysis");
                return StatusCode(500, "Internal server error during USQ analysis");
            }
        }
    }
}
```

### **USQ Service with Nuclear Intelligence:**
```csharp
// Services/USQAnalysisService.cs
public class USQAnalysisService : IUSQAnalysisService
{
    private readonly IAzureOpenAIService _aiService;
    
    public async Task<USQAnalysisResult> AnalyzeUSQAsync(USQAnalysisRequest request)
    {
        var prompt = BuildUSQAnalysisPrompt(request);
        var aiResponse = await _aiService.GetUSQAnalysisAsync(prompt);
        
        return ParseUSQResults(aiResponse);
    }
    
    private string BuildUSQAnalysisPrompt(USQAnalysisRequest request)
    {
        return $@"
You are a Senior Nuclear Safety Analyst with 25+ years experience in 10 CFR 50.59 
Unreviewed Safety Question (USQ) evaluations. You have expertise in:

REGULATORY FRAMEWORK:
- 10 CFR 50.59 (Changes, Tests, and Experiments)
- 10 CFR 50.92 (No Significant Hazards Consideration)
- NRC Regulatory Guide 1.187 (Guidance for Implementation of 10 CFR 50.59)
- NEI 96-07 (Guidelines for 10 CFR 50.59 Implementation)

USQ 8-QUESTION SCREENING CRITERIA:
1. Does the change increase the probability of occurrence of an accident previously evaluated?
2. Does the change increase the radiological consequences of an accident previously evaluated?
3. Does the change increase the probability of occurrence of a malfunction of a SSC important to safety?
4. Does the change increase the radiological consequences of a malfunction of a SSC important to safety?
5. Does the change create a possibility for an accident of a different type than any previously evaluated?
6. Does the change create a possibility for a malfunction of a SSC important to safety with a different result?
7. Does the change result in a design basis limit for a fission product barrier being exceeded or altered?
8. Does the change result in a departure from a method of evaluation described in the FSAR?

CHANGE DESCRIPTION: {request.ChangeDescription}
FACILITY TYPE: {request.FacilityType}
SYSTEMS AFFECTED: {string.Join(", ", request.SystemsAffected)}

Perform comprehensive 10 CFR 50.59 USQ screening analysis:
1. Answer each of the 8 USQ screening questions (YES/NO)
2. Determine if USQ evaluation is required
3. Provide detailed nuclear safety analysis
4. Cite relevant regulatory requirements
5. Include confidence assessment

Provide professional nuclear safety engineering analysis.
        ";
    }
}
```

---

## 🎯 **Benefits of Unified Platform:**

### **Shared Intelligence:**
- **Common Nuclear Knowledge Base** - All assistants use same GPT-4 expertise
- **Cross-Reference Analysis** - MT changes can inform USQ evaluations
- **Consistent Regulatory Interpretation** - Same AI understanding across tools

### **User Experience:**
- **Single Login** - One authentication for all nuclear tools
- **Familiar Interface** - Same professional styling and navigation
- **Easy Tool Switching** - Nuclear engineers stay in same environment

### **Development Efficiency:**
- **Shared Components** - Reuse CSS, services, and UI components
- **Single Deployment** - One Azure hosting environment
- **Unified Security** - One security model for all nuclear data

### **Future Expansion:**
- **Tech Spec Assistant** - Technical Specification compliance checking
- **License Amendment Assistant** - LAR preparation and analysis
- **Surveillance Test Assistant** - Test procedure evaluation
- **FSAR Assistant** - Safety analysis report updates

---

## 📋 **Implementation Timeline:**

### **Phase 1 (Week 1-2):** USQ Assistant
- ✅ Add navigation component
- ✅ Create USQ analysis interface
- ✅ Implement USQ backend service
- ✅ Test with real USQ scenarios

### **Phase 2 (Week 3-4):** GRB Document Assistant
- 📋 Generic Review Board document generation
- 📋 Template-based document creation
- 📋 Regulatory compliance checking

### **Phase 3 (Week 5-6):** FSAR Assistant
- 📖 Safety analysis report updates
- 📖 Section cross-referencing
- 📖 Impact analysis automation

This approach gives you a **professional nuclear facility platform** that grows with your needs while maintaining consistency and shared intelligence across all tools! 🏆
