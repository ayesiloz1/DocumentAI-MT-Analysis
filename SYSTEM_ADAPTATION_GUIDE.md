# 🔄 System Adaptation Guide - From MT Analysis to USQ Assistant & Beyond

## 🎯 **Overview: Adaptable AI Architecture**

Your current MT Analysis system is designed with **modular intelligence** that can be easily adapted for different nuclear facility applications:

- ✅ **MT Analysis** (Current) - Modification Traveler determination
- ✅ **USQ Assistant** (Proposed) - Unreviewed Safety Question analysis  
- ✅ **FSAR Assistant** - Final Safety Analysis Report updates
- ✅ **Tech Spec Assistant** - Technical Specification compliance
- ✅ **Licensing Assistant** - License amendment evaluations

---

## 🔧 **Adaptation Strategy: USQ Assistant Example**

### **1. Backend Modifications (Minimal Changes)**

#### **Update Models (New USQ-Specific Classes):**

**Models/USQAnalysisRequest.cs**
```csharp
public class USQAnalysisRequest
{
    public string ProposedChange { get; set; } = string.Empty;
    public string SystemsAffected { get; set; } = string.Empty;
    public string SafetyFunction { get; set; } = string.Empty;
    public string CurrentFSARSection { get; set; } = string.Empty;
    public bool IsTemporaryChange { get; set; }
    public DateTime? PlannedImplementation { get; set; }
    public string FacilityType { get; set; } = string.Empty;
}
```

**Models/USQAnalysisResult.cs**
```csharp
public class USQAnalysisResult
{
    public bool USQRequired { get; set; }
    public string USQDetermination { get; set; } = string.Empty;
    public USQScreeningType ScreeningType { get; set; }
    public List<string> FSARSectionsAffected { get; set; } = new();
    public List<string> TechSpecsAffected { get; set; } = new();
    public string SafetyAnalysisRequired { get; set; } = string.Empty;
    public List<string> RegulatoryRequirements { get; set; } = new();
    public double ConfidenceLevel { get; set; }
    public string RecommendedActions { get; set; } = string.Empty;
}

public enum USQScreeningType
{
    ScreeningOnly,
    FullUSQEvaluation,
    LicenseAmendmentRequired,
    NoUSQRequired
}
```

#### **Update AI Service (New USQ Prompts):**

**Services/USQAnalysisService.cs**
```csharp
public class USQAnalysisService
{
    private readonly AzureOpenAIService _aiService;
    
    public async Task<USQAnalysisResult> AnalyzeUSQ(USQAnalysisRequest request)
    {
        var prompt = BuildUSQExpertPrompt(request);
        var response = await _aiService.GetChatCompletionsAsync(prompt);
        return ParseUSQResponse(response);
    }
    
    private string BuildUSQExpertPrompt(USQAnalysisRequest request)
    {
        return $@"
You are a Senior Nuclear Licensing Engineer with 25+ years experience in 
Unreviewed Safety Question (USQ) evaluations under 10 CFR 50.59. You have expertise in:

USQ REGULATORY FRAMEWORK:
- 10 CFR 50.59 - Changes, Tests, and Experiments  
- 8 USQ Questions per 10 CFR 50.59(c)(2)
- FSAR/SAR update requirements under 50.59(d)(2)
- License Amendment thresholds per 50.90
- NEI 96-07 Rev 1 - Guidelines for 10 CFR 50.59 Implementation

USQ EVALUATION CRITERIA:
1. More than minimal increase in accident frequency?
2. More than minimal increase in accident consequences?  
3. More than minimal increase in malfunction frequency?
4. More than minimal increase in malfunction consequences?
5. Accident of different type than analyzed in FSAR?
6. Malfunction of different type than analyzed in FSAR?
7. Margin of safety reduction in technical specifications?
8. Margin of safety reduction in FSAR basis?

SAFETY ANALYSIS EXPERTISE:
- FSAR Chapter organization and content requirements
- Accident analysis methodologies and acceptance criteria  
- Defense-in-depth evaluation principles
- Single failure criteria and redundancy requirements
- Technical Specification bases and safety margins

PROPOSED CHANGE ANALYSIS:
Change Description: {request.ProposedChange}
Systems Affected: {request.SystemsAffected}  
Safety Functions: {request.SafetyFunction}
Current FSAR Section: {request.CurrentFSARSection}
Temporary Change: {request.IsTemporaryChange}

Perform comprehensive USQ screening per 10 CFR 50.59(c)(2) and determine:
1. USQ Determination (Yes/No/License Amendment Required)
2. Specific USQ questions answered 'Yes' if applicable
3. FSAR sections requiring updates
4. Technical Specification impacts
5. Recommended regulatory actions
";
    }
}
```

#### **Update Controller (New USQ Endpoints):**

**Controllers/USQAnalysisController.cs**
```csharp
[ApiController]
[Route("api/[controller]")]
public class USQAnalysisController : ControllerBase
{
    private readonly USQAnalysisService _usqService;
    
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeUSQ([FromBody] USQAnalysisRequest request)
    {
        var result = await _usqService.AnalyzeUSQ(request);
        return Ok(result);
    }
    
    [HttpPost("fsar-impact")]
    public async Task<IActionResult> AnalyzeFSARImpact([FromBody] USQAnalysisRequest request)
    {
        var fsarAnalysis = await _usqService.AnalyzeFSARImpact(request);
        return Ok(fsarAnalysis);
    }
}
```

---

### **2. Frontend Adaptations (Component Reuse)**

#### **Update Main Page (Change Title & Context):**

**src/app/page.tsx** (Minimal changes)
```tsx
// Change headers and branding
<h1>USQ Analysis Assistant</h1>
<p>AI-Powered 10 CFR 50.59 Evaluation</p>

// Update component usage
<USQChatInterface onSendMessage={handleSendMessage} />
<USQDocumentPreview />
```

#### **Adapt Chat Interface (Reuse Existing Architecture):**

**src/components/USQChatInterface.tsx**
```tsx
// Copy ChatInterface_Pure.tsx and modify:

const initialMessage = {
  id: '1',
  text: `Hello! I'm your USQ Analysis Assistant. I can help you evaluate Unreviewed Safety Questions per 10 CFR 50.59.

**I can help you with:**
• USQ screening per 8 questions in 50.59(c)(2)
• FSAR impact analysis and update requirements
• Technical Specification margin evaluations  
• License amendment threshold determinations
• NEI 96-07 guidance application

**How can I help you today?**`,
  sender: 'ai',
  timestamp: new Date()
};
```

#### **Adapt Document Preview (Reuse Styling):**

**src/components/USQDocumentPreview.tsx**
```tsx
// Copy MTDocumentPreview.tsx structure but generate USQ documents
const USQDocumentPreview = () => {
  // Same layout and styling, different document type
  return (
    <div className="document-panel">
      <div className="document-header">
        <h3>Live USQ Evaluation Document</h3>
        <p>Real-time 10 CFR 50.59 screening</p>
      </div>
      <div className="document-content">
        {/* USQ-specific document template */}
      </div>
    </div>
  );
};
```

---

### **3. Configuration Changes (Simple Updates)**

#### **Update API Endpoints:**
```typescript
// src/services/usqService.ts
const API_BASE = 'http://localhost:5001/api/USQAnalysis';

export const usqService = {
  analyzeUSQ: async (request: USQAnalysisRequest) => {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  }
};
```

#### **Update Styling (Reuse Existing CSS):**
```css
/* src/styles/usq-analyzer.css - Copy mt-analyzer.css */
.usq-document-panel { /* Same as document-panel */ }
.usq-preview-content { /* Same styling, different context */ }
```

---

## 🎯 **Multi-Application Architecture**

### **4. Unified System Design**

#### **Modular Backend Structure:**
```
DocumentAI.Backend/
├── Controllers/
│   ├── MTAnalysisController.cs      # Modification Travelers
│   ├── USQAnalysisController.cs     # Unreviewed Safety Questions  
│   ├── FSARAnalysisController.cs    # FSAR Updates
│   └── TechSpecController.cs        # Technical Specifications
├── Services/
│   ├── AzureOpenAIService.cs        # Shared AI service
│   ├── MTAnalysisService.cs         # MT-specific logic
│   ├── USQAnalysisService.cs        # USQ-specific logic
│   └── DocumentGenerationService.cs # Shared document creation
└── Models/
    ├── Common/                      # Shared models
    ├── MT/                          # MT-specific models
    └── USQ/                         # USQ-specific models
```

#### **Configurable Frontend:**
```typescript
// src/config/applicationConfig.ts
export interface ApplicationConfig {
  title: string;
  subtitle: string;
  analysisType: 'MT' | 'USQ' | 'FSAR' | 'TechSpec';
  apiEndpoint: string;
  documentType: string;
}

export const configs = {
  MT: {
    title: 'MT Analysis Assistant',
    subtitle: 'AI-Powered Document Analysis',
    analysisType: 'MT',
    apiEndpoint: '/api/MTAnalysis',
    documentType: 'Modification Traveler'
  },
  USQ: {
    title: 'USQ Analysis Assistant', 
    subtitle: '10 CFR 50.59 Evaluation',
    analysisType: 'USQ',
    apiEndpoint: '/api/USQAnalysis',
    documentType: 'USQ Screening Document'
  }
};
```

---

## 🚀 **Additional Applications**

### **5. Other Nuclear Facility Tools**

#### **FSAR Assistant:**
```csharp
// Models/FSARAnalysisRequest.cs
public class FSARAnalysisRequest
{
    public string ProposedChange { get; set; }
    public string CurrentFSARSection { get; set; }
    public List<string> AffectedChapters { get; set; }
    public string ChangeJustification { get; set; }
}

// AI Prompt for FSAR expertise
var prompt = @"
You are a Senior Nuclear Safety Analysis Engineer with expertise in 
Final Safety Analysis Report (FSAR) development and updates...
";
```

#### **Technical Specification Assistant:**
```csharp
// Models/TechSpecAnalysisRequest.cs  
public class TechSpecAnalysisRequest
{
    public string ProposedChange { get; set; }
    public string TechSpecSection { get; set; }
    public string SafetyMarginImpact { get; set; }
    public bool AffectsLimitingCondition { get; set; }
}
```

#### **Licensing Assistant:**
```csharp
// Models/LicenseAnalysisRequest.cs
public class LicenseAnalysisRequest
{
    public string ProposedAmendment { get; set; }
    public string LicenseSection { get; set; }
    public List<string> RegulatoryBasis { get; set; }
    public bool RequiresHearing { get; set; }
}
```

---

## 🛠️ **Implementation Steps**

### **6. How to Adapt Your System**

#### **Step 1: Choose Your Target Application**
- **USQ Assistant** - 10 CFR 50.59 evaluations
- **FSAR Assistant** - Safety analysis report updates  
- **Tech Spec Assistant** - Technical specification compliance
- **Licensing Assistant** - License amendment support

#### **Step 2: Create Application-Specific Models**
```bash
# Add new models for your chosen application
mkdir backend/Models/USQ
# Create USQAnalysisRequest.cs, USQAnalysisResult.cs
```

#### **Step 3: Develop Specialized AI Prompts**
```csharp
// Build domain expertise for your application
private string BuildUSQExpertPrompt() {
    return "You are a 10 CFR 50.59 expert with 25+ years...";
}
```

#### **Step 4: Adapt Frontend Components**
```bash
# Copy and modify existing components
cp src/components/ChatInterface_Pure.tsx src/components/USQChatInterface.tsx
# Update branding, prompts, and context
```

#### **Step 5: Configure for New Domain**
```typescript
// Update configuration and API endpoints
const USQ_CONFIG = {
  title: 'USQ Analysis Assistant',
  analysisType: 'USQ',
  // ... other settings
};
```

---

## 🏆 **Benefits of This Architecture**

### **7. Why This Approach Works**

#### **Code Reuse (80%+ shared):**
- ✅ **AI Service** - Same Azure OpenAI integration
- ✅ **UI Components** - Same professional layout and styling
- ✅ **Document Generation** - Same template engine
- ✅ **CSS Architecture** - Same modular styling system

#### **Domain Expertise (New AI prompts):**
- ✅ **Specialized Knowledge** - USQ vs MT vs FSAR expertise
- ✅ **Regulatory Focus** - 10 CFR 50.59 vs MT procedures
- ✅ **Document Types** - USQ screening vs MT documents
- ✅ **Analysis Methods** - 8 USQ questions vs MT classification

#### **Professional Quality:**
- ✅ **Same High Standards** - FedRAMP-ready architecture
- ✅ **Consistent UX** - Professional corporate styling
- ✅ **TypeScript Safety** - Type-safe development
- ✅ **Modular Design** - Easy maintenance and updates

---

## 🎯 **Conclusion**

Your MT Analysis system is **perfectly designed for adaptation**! The architecture separates:

1. **Core Infrastructure** (Azure OpenAI, UI framework, styling) - **Reusable**
2. **Domain Logic** (Prompts, models, business rules) - **Customizable**  
3. **User Experience** (Layout, components, styling) - **Consistent**

**To create a USQ Assistant, you mainly need to:**
- ✅ **New AI prompts** with 10 CFR 50.59 expertise
- ✅ **New data models** for USQ requests/responses
- ✅ **Updated branding** and terminology
- ✅ **Document templates** for USQ screening

**80% of your code stays the same!** 🚀

This approach lets you build a **suite of nuclear facility AI tools** with consistent quality and professional appearance! 🏆
