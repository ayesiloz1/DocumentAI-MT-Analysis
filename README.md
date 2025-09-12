# DocumentAI Multi-Assistant Platform ✅

A comprehensive nuclear facility document analysis platform with AI-powered assistants for MT (Modification Traveler), GRB (Governing Review Board), USQ (Unreviewed Safety Question), and FSAR (Final Safety Analysis Report) analysis.

**🎯 Status: COMPLETE & TESTED**
- ✅ GPT-4 powered intelligent analysis
- ✅ Multi-assistant platform with unified navigation
- ✅ Real-time document preview and generation
- ✅ Natural language conversation interface
- ✅ Professional nuclear facility compliance formatting
- ✅ Full-stack Next.js + .NET 8 architecture

## Architecture

```
DocumentAI/
├── backend/              # .NET 8 Web API
│   ├── Controllers/      # API endpoints
│   ├── Services/         # Business logic & GPT-4 integration
│   ├── Models/          # Data transfer objects
│   └── README.md        # Backend documentation
├── frontend/            # Next.js 15 React application
│   ├── src/components/  # React components
│   ├── src/services/    # API integration
│   └── README.md        # Frontend documentation
├── database/            # Database schemas & migrations
└── docs/               # Documentation

## Features

### 🔍 Core Capabilities
- **Multi-Assistant Platform**: MT, GRB, USQ, and FSAR analysis assistants
- **GPT-4 Intelligence**: Natural language processing for complex nuclear scenarios
- **Real-time Document Generation**: Live MT document preview with progress tracking
- **Intelligent Conversation**: Context-aware chat with nuclear terminology understanding
- **Professional Formatting**: Nuclear facility compliance document generation
- **Cross-Assistant Data Sharing**: Integrated project data across all assistants

### 📋 MT Analysis Components
1. **Intelligent MT Classification**: GPT-4 powered Type I-V determination
2. **Natural Language Processing**: Understands nuclear equipment and safety classifications
3. **Real-time Document Building**: Live MT form population and progress tracking
4. **Equipment Replacement Analysis**: Identical vs non-identical replacement logic
5. **Safety Classification**: Automatic safety-related, safety-significant detection
6. **Regulatory Compliance**: 10 CFR 50.59 and nuclear facility requirements

## Quick Start

### Option 1: Use Development Scripts (Recommended)
```bash
# Windows
./start-dev.bat

# Linux/Mac  
./start-dev.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Backend (.NET 8)
cd backend
dotnet restore
dotnet run --urls="http://localhost:5001"

# Terminal 2 - Frontend (Next.js)
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/swagger
   ```json
   {
     "AzureOpenAI": {
       "Endpoint": "https://your-azure-openai-resource.openai.azure.com/",
       "ApiKey": "your-api-key-here",
       "DeploymentName": "gpt-4",
       "ApiVersion": "2024-02-01"
     }
   }
   ```

3. **Restore packages**:
   ```powershell
   dotnet restore
   ```

4. **Build the project**:
   ```powershell
   dotnet build
   ```

## Usage

### Command Line Interface

#### Basic Analysis
```powershell
# Interactive mode
dotnet run -- --interactive

# Analyze from JSON file
dotnet run -- --input-file input.json --output-file report.json

# Analyze raw text
dotnet run -- --analyze-text "Replace existing valve V-001 with identical valve for preventive maintenance"

# Verbose output
dotnet run -- --input-file input.json --verbose
```

#### Utility Commands
```powershell
# Generate sample input file
dotnet run -- generate-sample --output sample-input.json

# Validate input JSON
dotnet run -- validate --input-file input.json
```

### Input Format

Create a JSON file with the following structure:

```json
{
  "projectNumber": "MT-2024-001",
  "projectType": "System Modification",
  "designAuthority": "Mechanical Engineering",
  "problemDescription": "Existing valve shows signs of wear and requires replacement",
  "proposedSolution": "Replace with identical valve",
  "justification": "Preventive maintenance to avoid system failure",
  "safetyClassification": "Non-Safety",
  "hazardCategory": "Category 2",
  "designConstraints": ["Maintain pressure rating", "Install during maintenance window"],
  "requiredProcedures": ["Valve Replacement Procedure VRP-001"],
  "isTemporary": false,
  "isPhysicalChange": true,
  "isIdenticalReplacement": true,
  "isDesignOutsideDA": false,
  "requiresNewProcedures": false,
  "requiresMultipleDocuments": false,
  "isSingleDiscipline": true,
  "revisionsOutsideDA": false,
  "requiresSoftwareChange": false,
  "requiresHoistingRigging": false,
  "facilityChangePackageApplicable": false
}
```

### Output Format

The system generates a comprehensive JSON report including:

```json
{
  "analysisId": "uuid",
  "timestamp": "2024-08-31T10:00:00Z",
  "projectNumber": "MT-2024-001",
  "mtRequired": false,
  "mtRequiredReason": "Identical replacement - Design Type V",
  "designType": "TypeV",
  "designInputs": {
    "problemStatement": "...",
    "proposedSolution": "...",
    "designConstraints": [...],
    "safetyRequirements": [...],
    "environmentalConsiderations": [...],
    "operationalImpacts": [...]
  },
  "expectedOutputs": [...],
  "impactedDocuments": [...],
  "missingElements": [...],
  "inconsistencies": [...],
  "suggestedActions": [...],
  "attachmentAChecklist": {
    "a1DesignOutputCheck": {...},
    "a2EngineeringImpacts": {...},
    "a3NonEngineeringImpacts": {...},
    "a4SystemAcceptability": {...},
    "a5InterfaceReviews": {...}
  },
  "riskAssessment": {
    "overallRisk": "Low",
    "safetyRisk": "Low",
    "environmentalRisk": "Low",
    "operationalRisk": "Low",
    "riskFactors": [...],
    "mitigationRecommendations": [...]
  },
  "confidence": 0.85
}
```

## Figure 1 Decision Tree Implementation

The system implements the complete Figure 1 logic:

1. **Temporary Changes Check**: If all changes are temporary → MT Not Required
2. **Physical Change Assessment**: Determines if change is physical or software/procedural
3. **Identical Replacement Check**: Design Type V assessment
4. **Design Authority Location**: Inside vs. outside DA group
5. **Procedure Requirements**: New/revised procedures needed
6. **Document Requirements**: Single vs. multiple documents
7. **Discipline Assessment**: Single vs. multi-discipline
8. **Implementation Location**: Inside vs. outside DA group
9. **Software Change Requirements**: Additional software modifications
10. **Hoisting/Rigging Requirements**: Special equipment needs

## Attachment A Integration

The system validates against all five Attachment A sections:

- **A.1 - Design Output Check**: Drawings, calculations, specifications
- **A.2 - Engineering Impacts**: Structural, electrical, mechanical impacts
- **A.3 - Non-Engineering Impacts**: Operations, training, maintenance
- **A.4 - System Acceptability**: Performance, safety, regulatory compliance
- **A.5 - Interface Reviews**: System interfaces and integration

## Design Types

- **Type I**: New Design
- **Type II**: Modification
- **Type III**: Replacement
- **Type IV**: Temporary
- **Type V**: Identical Replacement

## Configuration

### Environment Variables
You can override configuration using environment variables:
```powershell
$env:AzureOpenAI__Endpoint = "https://your-endpoint.openai.azure.com/"
$env:AzureOpenAI__ApiKey = "your-api-key"
$env:AzureOpenAI__DeploymentName = "gpt-4"
```

### Logging
Configure logging levels in `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "MTAnalyzer": "Debug"
    }
  }
}
```

## Examples

### Example 1: Identical Replacement
```powershell
dotnet run -- --analyze-text "Replace pump P-001 with identical pump model XYZ-123 due to bearing wear. No procedure changes required."
```

### Example 2: New Installation
```powershell
dotnet run -- --analyze-text "Install new pressure monitoring system in Tank T-001 with software integration to control room displays."
```

### Example 3: Temporary Modification
```powershell
dotnet run -- --analyze-text "Install temporary bypass piping around valve V-003 for 30-day maintenance period."
```

## Troubleshooting

### Common Issues

1. **Azure OpenAI Connection Issues**
   - Verify endpoint URL and API key
   - Check deployment name matches your Azure configuration
   - Ensure API version is supported

2. **JSON Parsing Errors**
   - Use the `validate` command to check input format
   - Generate sample input with `generate-sample` command

3. **Missing Analysis Data**
   - Ensure all required fields are populated
   - Use verbose mode (`--verbose`) for detailed logging

### Debug Mode
```powershell
dotnet run -- --input-file input.json --verbose --output-file debug-report.json
```

## Architecture

```
MTAnalyzer/
├── Models/                          # Data models and structures
│   ├── ModificationTravelerModels.cs  # Input models
│   └── AnalysisReport.cs              # Output models
├── Services/                        # Business logic services
│   ├── MTDecisionEngine.cs            # Figure 1 decision tree
│   └── AzureOpenAIService.cs          # AI integration
├── Program.cs                       # Main application and CLI
├── appsettings.json                 # Configuration
└── MTAnalyzer.csproj               # Project file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the examples for usage patterns

---

**Note**: Replace placeholder values in `appsettings.json` with your actual Azure OpenAI credentials before running the application.
