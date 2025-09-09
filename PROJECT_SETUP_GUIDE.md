# 🚀 MT Analysis System - Complete Setup Guide

**Project:** Modification Traveler Analysis System  
**Technology Stack:** .NET 8 Backend + Next.js Frontend + Azure OpenAI GPT-4  
**Purpose:** Nuclear facility MT determination with pure AI intelligence  

---

## 📋 **Project Overview**

This system provides automated Modification Traveler (MT) analysis for nuclear facilities using Azure OpenAI GPT-4. It features:

- ✅ **Pure GPT-4 Intelligence** - No hardcoded responses
- ✅ **Professional UI** - Corporate styling with side-by-side layout
- ✅ **Real-time Document Generation** - Live MT document preview
- ✅ **Nuclear Engineering Expertise** - Proper MT Type I/II/III classification
- ✅ **FedRAMP Ready** - TypeScript, security-focused architecture

---

## 🏗️ **Step 1: Project Structure Setup**

### **Create Root Directory:**
```bash
mkdir DocumentAI
cd DocumentAI
```

### **Directory Structure:**
```
DocumentAI/
├── backend/                    # .NET 8 API
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
├── frontend/                   # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── next.config.js
├── .github/
│   └── copilot-instructions.md
└── PROJECT_SETUP_GUIDE.md     # This file
```

---

## 🔧 **Step 2: Backend Setup (.NET 8)**

### **2.1 Create Backend Project:**
```bash
mkdir backend
cd backend
dotnet new webapi -n DocumentAI.Backend
cd DocumentAI.Backend
```

### **2.2 Install Required Packages:**
```bash
dotnet add package Azure.AI.OpenAI
dotnet add package Microsoft.AspNetCore.Cors
dotnet add package System.Text.Json
dotnet add package DocumentFormat.OpenXml
```

### **2.3 Core Files to Create:**

#### **Program.cs** - Main application setup
```csharp
// Configure services, CORS, Azure OpenAI, and middleware
```

#### **Models/MTAnalysisRequest.cs** - Request model
```csharp
// Define input structure for MT analysis
```

#### **Models/MTAnalysisResult.cs** - Response model
```csharp
// Define output structure with MT determination
```

#### **Services/AzureOpenAIService.cs** - AI integration
```csharp
// Handle GPT-4 communication and prompt engineering
```

#### **Services/IntelligentMTService.cs** - MT logic
```csharp
// Smart MT determination logic with nuclear expertise
```

#### **Controllers/MTAnalysisController.cs** - API endpoints
```csharp
// REST endpoints for frontend communication
```

### **2.4 Configuration Files:**

#### **appsettings.json** - Application settings
```json
{
  "AzureOpenAI": {
    "Endpoint": "YOUR_AZURE_OPENAI_ENDPOINT",
    "ApiKey": "YOUR_API_KEY",
    "DeploymentName": "gpt-4"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

---

## 🎨 **Step 3: Frontend Setup (Next.js 14)**

### **3.1 Create Frontend Project:**
```bash
cd ../
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
```

### **3.2 Install Required Packages:**
```bash
npm install lucide-react react-markdown
npm install @types/react @types/node
```

### **3.3 Core Components to Create:**

#### **src/app/page.tsx** - Main application page
```tsx
// Professional side-by-side layout with chat and document preview
```

#### **src/components/ChatInterface_Pure.tsx** - Pure GPT-4 chat
```tsx
// AI chat interface with white text and professional styling
```

#### **src/components/MTDocumentPreview.tsx** - Live document viewer
```tsx
// Real-time MT document generation with black borders
```

#### **src/services/mtDocumentService.ts** - Document management
```typescript
// Handle document generation and download functionality
```

### **3.4 Styling System (9 CSS Files):**

#### **src/styles/index.css** - Main CSS imports
```css
/* Import all modular CSS files */
```

#### **src/styles/variables.css** - Design tokens
```css
/* CSS custom properties for colors, spacing, typography */
```

#### **src/styles/themes.css** - Color themes
```css
/* Professional corporate theme with semantic color mappings */
```

#### **src/styles/utilities.css** - Utility classes
```css
/* Common utility classes for layout and styling */
```

#### **src/styles/buttons.css** - Button styles
```css
/* Professional button styling with hover states */
```

#### **src/styles/cards.css** - Card components
```css
/* Card styling for panels and containers */
```

#### **src/styles/forms.css** - Form elements
```css
/* Input, textarea, select styling */
```

#### **src/styles/chat.css** - Chat interface
```css
/* Chat messages, bubbles, AI intro with WHITE TEXT */
```

#### **src/styles/mt-analyzer.css** - Document preview
```css
/* Document panel, BLACK BORDERS for fields, progress bars */
```

#### **src/styles/professional-layout.css** - Main layout
```css
/* Side-by-side panels, workspace grid, headers */
```

---

## 🔑 **Step 4: Key Features Implementation**

### **4.1 Pure GPT-4 Intelligence**
- No hardcoded MT determination logic
- Sophisticated prompt engineering for nuclear expertise
- Context-aware conversation handling

### **4.2 Professional UI Design**
- **50/50 side-by-side layout** (chat | document preview)
- **White text** for AI and user messages
- **Black borders** on document fields for visibility
- **Corporate styling** with professional color scheme

### **4.3 Smart MT Classification**
- **Type I:** New Design
- **Type II:** Modification  
- **Type III:** Non-Identical Replacement
- **No MT Required:** Routine maintenance

### **4.4 Nuclear Engineering Features**
- Regulatory compliance (10 CFR 50.59, IEEE standards)
- Safety classification (SC/SS/GS)
- Risk assessment integration
- Document generation with proper formatting

---

## 🚀 **Step 5: Development Workflow**

### **5.1 Backend Development Order:**
1. **Models** - Define data structures
2. **Services** - Implement core logic
3. **Controllers** - Create API endpoints
4. **Configuration** - Set up Azure OpenAI
5. **Testing** - Verify MT determinations

### **5.2 Frontend Development Order:**
1. **CSS System** - Build modular styling foundation
2. **Layout** - Create professional workspace structure
3. **Chat Interface** - Implement pure GPT-4 communication
4. **Document Preview** - Add real-time MT generation
5. **Integration** - Connect to backend APIs

### **5.3 Key Implementation Points:**

#### **Pure GPT-4 System:**
```typescript
// No hardcoded responses - pure AI intelligence
const response = await fetch('/api/mt-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, context })
});
```

#### **Professional Styling:**
```css
/* White text for visibility */
.ai-intro-title { color: #ffffff; }
.message-bubble--user * { color: white !important; }

/* Black borders for document fields */
.document-preview-content input { border: 2px solid #000000 !important; }
```

#### **Equal Panel Layout:**
```css
.app-workspace {
  display: grid;
  grid-template-columns: 1fr 4px 1fr; /* 50/50 split */
  max-width: 1600px;
  margin: 0 auto;
}
```

---

## 🧪 **Step 6: Testing Scenarios**

### **Test Scenario 1: Component Replacement (MT Required)**
```
We need to replace the emergency diesel generator control panel at Unit 1...
Expected: Type II MT Required
```

### **Test Scenario 2: Routine Maintenance (No MT)**
```
We need to perform routine maintenance on the cooling water pump...
Expected: No MT Required
```

### **Test Scenario 3: Safety-Critical Non-Identical (Type III)**
```
We want to install a new reactor coolant pump seal from a different manufacturer...
Expected: Type III MT Required
```

---

## 📊 **Step 7: Performance Targets**

### **AI Intelligence:**
- ✅ Correct MT determination (95%+ accuracy)
- ✅ Nuclear engineering expertise
- ✅ Regulatory compliance knowledge
- ✅ No hardcoded responses

### **User Experience:**
- ✅ Professional corporate appearance
- ✅ White text visibility
- ✅ Black document field borders
- ✅ Equal panel dimensions
- ✅ Real-time document generation

### **Technical Standards:**
- ✅ TypeScript for type safety
- ✅ Modular CSS architecture
- ✅ FedRAMP-compatible design
- ✅ Responsive layout

---

## 🔧 **Step 8: Environment Setup**

### **Prerequisites:**
- .NET 8 SDK
- Node.js 18+
- Azure OpenAI account with GPT-4 deployment
- VS Code with TypeScript extensions

### **Development Commands:**

#### **Backend:**
```bash
cd backend
dotnet run --urls="http://localhost:5001"
```

#### **Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 📚 **Step 9: Key Learning Points**

### **Understanding Each Component:**

1. **Azure OpenAI Integration:** How GPT-4 provides nuclear expertise
2. **MT Classification Logic:** Type I/II/III determination rules
3. **Professional UI Design:** Corporate styling best practices
4. **Real-time Document Generation:** Live preview implementation
5. **TypeScript Benefits:** Type safety for nuclear applications
6. **Modular CSS Architecture:** Maintainable styling system
7. **FedRAMP Compliance:** Security-focused development

### **Nuclear Industry Knowledge:**
- Modification Traveler purpose and requirements
- Safety classification importance (SC/SS/GS)
- Regulatory standards (10 CFR 50.59, IEEE)
- Risk assessment methodologies

---

## 🎯 **Success Criteria**

Your implementation is successful when:

1. **AI responds intelligently** to nuclear scenarios without hardcoded logic
2. **MT determinations are accurate** for different modification types
3. **UI looks professional** with proper spacing and typography
4. **White text is visible** in chat messages
5. **Black borders appear** on document fields
6. **Panels are equal size** (50/50 split)
7. **Documents generate in real-time** in the preview panel
8. **System demonstrates nuclear engineering expertise**

---

## 🚀 **Next Steps After Setup**

1. **Customize for your facility** - Add specific nuclear plant requirements
2. **Enhance security** - Implement authentication and authorization
3. **Add file upload** - Support for document analysis
4. **Integrate databases** - Store MT history and templates
5. **Deploy to production** - Cloud deployment with proper security

---

**Happy coding!** 🎉 This guide will help you understand every aspect of the system as you build it from scratch. Each component serves a specific purpose in creating a professional, intelligent MT analysis system suitable for nuclear facilities.
