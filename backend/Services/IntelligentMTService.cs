// Import necessary namespaces for Azure OpenAI and application functionality
using Azure.AI.OpenAI;              // Azure OpenAI SDK for GPT integration
using Azure;                        // Azure SDK core types like AzureKeyCredential
using MTAnalyzer.Models;            // Our application data models
using Microsoft.Extensions.Configuration; // Configuration management (appsettings.json)
using Microsoft.Extensions.Logging;       // Logging framework for debugging and monitoring
using System.Text.Json;                   // JSON serialization for API communication
using System.Text;                        // String manipulation utilities

namespace MTAnalyzer.Services
{
    // ============================================================================
    // INTERFACE DEFINITION FOR INTELLIGENT MT SERVICE
    // This defines the contract that our service must implement
    // Interfaces enable dependency injection and make testing easier
    // ============================================================================
    public interface IIntelligentMTService
    {
        // Analyze MT documents using GPT-4 with optional structured input
        Task<MTAnalysisReport> AnalyzeWithGPT4Async(string userInput, ModificationTravelerInput? structuredInput = null);
        
        // Generate intelligent conversational responses for chat interface
        Task<string> GenerateIntelligentResponseAsync(string userMessage, string conversationHistory = "");
        
        // Classify the type of MT document based on description
        Task<MTClassificationResult> ClassifyMTTypeAsync(string description);
        
        // Extract equipment details from descriptions using AI
        Task<List<string>> ExtractEquipmentDetailsAsync(string description);
        
        // Generate recommendations based on analysis results
        Task<string> GenerateRecommendationsAsync(MTAnalysisReport analysis);
    }

    // ============================================================================
    // INTELLIGENT MT SERVICE IMPLEMENTATION
    // This service handles all AI-powered MT document analysis using GPT-4
    // It's the core business logic that connects user requests to AI responses
    // ============================================================================
    public class IntelligentMTService : IIntelligentMTService
    {
        // ============================================================================
        // PRIVATE FIELDS - DEPENDENCIES INJECTED THROUGH CONSTRUCTOR
        // ============================================================================
        private readonly OpenAIClient _openAIClient;              // Azure OpenAI client for API calls
        private readonly IConfiguration _configuration;           // Configuration settings from appsettings.json
        private readonly ILogger<IntelligentMTService> _logger;   // Logger for debugging and monitoring
        private readonly IEmbeddingService _embeddingService;     // Service for text embeddings (similarity matching)
        private readonly string _defaultDeploymentName;          // Default deployment name for all AI operations

        // ============================================================================
        // CONSTRUCTOR - DEPENDENCY INJECTION AND INITIALIZATION
        // ASP.NET Core automatically injects these dependencies when creating the service
        // ============================================================================
        public IntelligentMTService(
            IConfiguration configuration,              // Injected configuration service
            ILogger<IntelligentMTService> logger,      // Injected logging service
            IEmbeddingService embeddingService         // Injected embedding service
        )
        {
            // Store injected dependencies for use in methods
            _configuration = configuration;
            _logger = logger;
            _embeddingService = embeddingService;

            // Read Azure OpenAI connection details from configuration
            var endpoint = _configuration["AzureOpenAI:Endpoint"];  // Azure OpenAI endpoint URL
            var apiKey = _configuration["AzureOpenAI:ApiKey"];      // Azure OpenAI API key

            // Create the OpenAI client with endpoint and credentials
            // This client will be used for all GPT-4 API calls
            _openAIClient = new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
            
            // Get deployment name from configuration with fallback default
            // This deployment must exist in your Azure OpenAI resource
            _defaultDeploymentName = _configuration["AzureOpenAI:DeploymentName"] ?? "gpt-35-turbo";
        }

        // ============================================================================
        // MAIN ANALYSIS METHOD - ANALYZE MT DOCUMENTS WITH GPT-4
        // This is the core method that processes user input and generates MT analysis
        // ============================================================================
        public async Task<MTAnalysisReport> AnalyzeWithGPT4Async(string userInput, ModificationTravelerInput? structuredInput = null)
        {
            try
            {
                _logger.LogInformation("🚀 Starting GPT-4 intelligent analysis for: {Input}", userInput[..Math.Min(100, userInput.Length)]);

            // First, get embedding-based classification for technical accuracy
            var embeddingClassification = await _embeddingService.ClassifyEquipmentAsync(userInput);
            var mtTypeClassification = await _embeddingService.RecommendMTTypeAsync(userInput);
            
            // Build comprehensive prompt for GPT-4 (without search for cost savings)
            var prompt = BuildIntelligentAnalysisPrompt(userInput, embeddingClassification, mtTypeClassification);

                // Use the configured deployment for intelligent analysis
                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _defaultDeploymentName,
                    Messages = {
                        new ChatRequestSystemMessage(GetSystemPrompt()),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.2f,        // Increased for more detailed responses
                    MaxTokens = 3000,          // Increased for comprehensive analysis
                    NucleusSamplingFactor = 0.9f,
                    FrequencyPenalty = 0.1f,   // Reduce repetition
                    PresencePenalty = 0.1f     // Encourage diverse topics
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                var analysis = response.Value.Choices[0].Message.Content;

                _logger.LogInformation("🤖 GPT-4 Analysis Complete: {Length} characters", analysis?.Length ?? 0);

                // Parse GPT-4 response and create structured report
                return await ParseGPT4ResponseToReport(analysis, userInput, embeddingClassification, mtTypeClassification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in GPT-4 analysis");
                
                // Fallback to embedding-based analysis
                return await CreateFallbackReport(userInput);
            }
        }

        public async Task<string> GenerateIntelligentResponseAsync(string userMessage, string conversationHistory = "")
        {
            try
            {
                var prompt = BuildConversationPrompt(userMessage, conversationHistory);

                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _defaultDeploymentName, // Use configured deployment for consistency
                    Messages = {
                        new ChatRequestSystemMessage(GetConversationSystemPrompt()),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.3f,        // Balanced creativity and accuracy
                    MaxTokens = 2000,          // Increased for detailed responses
                    FrequencyPenalty = 0.2f,   // Reduce repetition
                    PresencePenalty = 0.1f     // Encourage topic diversity
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                return response.Value.Choices[0].Message.Content ?? "I apologize, but I couldn't generate a response. Please try again.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating intelligent response");
                
                // Provide helpful fallback response based on error type
                if (ex.Message.Contains("404") || ex.Message.Contains("Resource not found"))
                {
                    return "I'm currently experiencing connectivity issues with the AI service. However, I can still help you with general MT guidance. Please try asking about specific MT types (I-V), regulatory requirements, or technical considerations, and I'll do my best to assist you.";
                }
                else if (ex.Message.Contains("rate limit") || ex.Message.Contains("quota"))
                {
                    return "The AI service is currently experiencing high demand. While I work on reconnecting, consider reviewing your project against these key questions: 1) Does this modify safety-related equipment? 2) Does it change form, fit, or function? 3) Is this a temporary or permanent change? These factors will help determine MT requirements.";
                }
                else
                {
                    return "I'm experiencing technical difficulties, but I'm still here to help. Could you rephrase your question or ask about a specific aspect of your modification? I can assist with MT classification, regulatory requirements, or technical implementation considerations.";
                }
            }
        }

        public async Task<MTClassificationResult> ClassifyMTTypeAsync(string description)
        {
            try
            {
            // Combine embedding classification with GPT-4 reasoning
            var embeddingResult = await _embeddingService.RecommendMTTypeAsync(description);                var prompt = $@"
Analyze this nuclear facility modification description and classify it:

Description: {description}

Embedding AI suggests: {embeddingResult.PrimaryRecommendation?.MTType} (Confidence: {embeddingResult.ConfidenceScore:P1})

Provide your classification (Type I-V) with detailed reasoning:

Type I: Minor modifications
Type II: Moderate modifications  
Type III: Non-identical replacements
Type IV: Temporary modifications
Type V: Identical replacements

Respond with JSON:
{{
  ""classificationType"": 1-5,
  ""typeName"": ""Type X - Description"",
  ""confidence"": 0.0-1.0,
  ""reasoning"": ""Detailed explanation"",
  ""keyFactors"": [""factor1"", ""factor2""],
  ""agreesWithEmbedding"": true/false
}}";

                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _defaultDeploymentName,
                    Messages = {
                        new ChatRequestSystemMessage("You are an expert nuclear facility modification analyst. Provide accurate MT classifications with detailed reasoning."),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.05f,
                    MaxTokens = 800
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                var jsonResponse = response.Value.Choices[0].Message.Content;

                return ParseClassificationResponse(jsonResponse, embeddingResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GPT-4 classification");
                
                // Fallback to embedding result
                return new MTClassificationResult
                {
                    ClassificationType = 2, // Default Type II
                    Confidence = 0.5,
                    Reasoning = "GPT-4 analysis failed, using default classification",
                    KeyFactors = new List<string> { "Default analysis due to error" }
                };
            }
        }

        public async Task<List<string>> ExtractEquipmentDetailsAsync(string description)
        {
            try
            {
                var prompt = $@"
Extract all equipment details from this modification description:

{description}

Focus on:
- Manufacturer names (Fisher, Flowserve, etc.)
- Model numbers (667ED, etc.)
- Equipment types (valve, pump, motor, etc.)
- Specifications (flow rate, pressure, voltage, etc.)
- Part numbers
- Serial numbers

Return as JSON array of strings: [""detail1"", ""detail2"", ...]";

                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _defaultDeploymentName,
                    Messages = {
                        new ChatRequestSystemMessage("You are an expert at extracting technical equipment information from descriptions."),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.1f,
                    MaxTokens = 500
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                var jsonResponse = response.Value.Choices[0].Message.Content;

                return JsonSerializer.Deserialize<List<string>>(jsonResponse) ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting equipment details");
                return new List<string>();
            }
        }

        public async Task<string> GenerateRecommendationsAsync(MTAnalysisReport analysis)
        {
            try
            {
                var prompt = $@"
Based on this MT analysis, provide intelligent recommendations:

Classification: Type {analysis.DesignType}
MT Required: {analysis.MTRequired}
Reason: {analysis.MTRequiredReason}
Confidence: {analysis.Confidence:P1}

Generate specific, actionable recommendations for:
1. Next steps for the modification process
2. Documentation requirements
3. Potential challenges or considerations
4. Timeline estimates
5. Resource requirements

Provide practical, expert-level guidance for nuclear facility modifications.";

                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _defaultDeploymentName,
                    Messages = {
                        new ChatRequestSystemMessage("You are a senior nuclear facility modification expert providing actionable recommendations."),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.3f,
                    MaxTokens = 1000
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                return response.Value.Choices[0].Message.Content ?? "No specific recommendations available.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations");
                return "Unable to generate recommendations at this time.";
            }
        }

        private string GetSystemPrompt()
        {
            return @"You are a SENIOR NUCLEAR FACILITY MODIFICATION EXPERT with 20+ years of experience in:

REGULATORY EXPERTISE:
- 10 CFR 50.59 (Unreviewed Safety Question determinations)
- 10 CFR 50 Appendix B (Quality Assurance Program)
- DOE Order 5480.23 (Nuclear Safety Analysis Reports)
- DOE Order 6430.1A (General Design Criteria)
- ASME Section III (Nuclear Components)
- IEEE 308 (Nuclear Power Generating Station Class 1E Power Systems)

TECHNICAL SPECIALIZATIONS:
- Safety-related system modifications and upgrades
- Digital I&C system replacements and cybersecurity
- HEPA filtration and confinement systems
- Emergency power systems and UPS modifications
- Reactor protection and engineered safety features
- Fire protection and life safety systems
- Seismic and environmental qualification

MODIFICATION TRAVELER EXPERTISE:
- Types I-V classification with detailed justification
- 50.59 screening and evaluation processes
- Safety function impact analysis
- Identical vs non-identical replacement determination
- Temporary modification safety analysis
- Commercial grade dedication requirements

PROVIDE COMPREHENSIVE ANALYSIS INCLUDING:
1. Detailed MT classification (I-V) with specific regulatory basis
2. Complete 50.59 evaluation criteria assessment
3. Safety function impact analysis with supporting rationale
4. Specific regulatory compliance requirements and approval paths
5. Technical implementation challenges and mitigation strategies
6. Quality assurance and testing requirements
7. Actionable next steps with timeline estimates
8. Risk assessment and contingency planning

ALWAYS reference specific regulations, procedures, and industry standards.
Provide practical, implementable recommendations with technical depth.";
        }

        private string GetConversationSystemPrompt()
        {
            return @"You are an INTELLIGENT NUCLEAR MODIFICATION CONSULTANT with expertise in:

CONVERSATIONAL CAPABILITIES:
- Engage naturally while maintaining technical authority
- Ask probing questions to understand the complete scope
- Provide progressive guidance through complex modification scenarios
- Translate complex regulations into actionable steps

TECHNICAL FOCUS AREAS:
- Equipment specifications and vendor requirements
- Safety system interactions and dependencies
- Environmental and radiological impact assessment
- Cost-benefit analysis and implementation timelines
- Regulatory approval strategies and documentation requirements

COMMUNICATION STYLE:
- Professional but approachable tone
- Use specific examples and case studies when helpful
- Break down complex topics into digestible steps
- Always provide 'what's next' guidance
- Reference relevant procedures and standards

ALWAYS CONSIDER:
- User's level of technical expertise
- Project complexity and safety significance
- Regulatory compliance requirements
- Practical implementation challenges
- Budget and timeline constraints

Ask clarifying questions about:
- Specific equipment details and manufacturers
- Safety system classifications
- Environmental conditions and constraints
- Existing documentation and procedures
- Project timeline and resource availability

Provide value-added insights beyond basic responses.";
        }

        private string BuildIntelligentAnalysisPrompt(string userInput, EquipmentClassification embeddingEquipment, MTTypeRecommendation embeddingMTType)
        {
            return $@"
NUCLEAR FACILITY MODIFICATION ANALYSIS REQUEST

USER SCENARIO: {userInput}

AI PRELIMINARY ANALYSIS:
- Equipment Classification: {embeddingEquipment.BestMatch} (Confidence: {embeddingEquipment.ConfidenceScore:P1})
- MT Type Suggestion: {embeddingMTType.PrimaryRecommendation?.MTType} (Confidence: {embeddingMTType.ConfidenceScore:P1})

REQUIRED COMPREHENSIVE ANALYSIS:

1. **MODIFICATION TRAVELER CLASSIFICATION (Critical)**
   - Determine exact Type (I, II, III, IV, or V) with detailed justification
   - Reference specific regulatory criteria (10 CFR 50.59, facility procedures)
   - Explain why other types were ruled out
   - Assess identical vs non-identical replacement criteria

2. **10 CFR 50.59 EVALUATION FRAMEWORK**
   - Screen against 8 criteria in 10 CFR 50.59(c)(2)
   - Identify potential unreviewed safety questions
   - Determine if full 50.59 evaluation required
   - Specify documentation requirements

3. **SAFETY FUNCTION IMPACT ANALYSIS**
   - Analyze impact on safety-related functions
   - Evaluate effects on accident analysis assumptions
   - Assess changes to Technical Specification basis
   - Consider defense-in-depth implications

4. **TECHNICAL IMPLEMENTATION REQUIREMENTS**
   - Equipment specifications and vendor requirements
   - Installation and testing procedures
   - Quality assurance program requirements
   - Commercial grade dedication needs (if applicable)

5. **REGULATORY COMPLIANCE ROADMAP**
   - Required approvals and review processes
   - Documentation deliverables and timelines
   - Regulatory notification requirements
   - License amendment evaluation

6. **RISK ASSESSMENT AND MITIGATION**
   - Technical implementation risks
   - Schedule and budget considerations
   - Safety and regulatory compliance risks
   - Contingency planning recommendations

7. **ACTIONABLE NEXT STEPS**
   - Immediate actions required
   - Documentation to be developed
   - Reviews and approvals needed
   - Timeline milestones

PROVIDE SPECIFIC, DETAILED, ACTIONABLE GUIDANCE WITH REGULATORY REFERENCES.
Include relevant procedure numbers, standards, and industry best practices.
Address both technical and regulatory aspects comprehensively.";
        }

        private string BuildConversationPrompt(string userMessage, string conversationHistory)
        {
            return $@"
NUCLEAR MODIFICATION CONSULTATION SESSION

CONVERSATION CONTEXT:
{(string.IsNullOrEmpty(conversationHistory) ? "This is the start of a new consultation." : conversationHistory)}

CURRENT USER QUESTION/REQUEST: {userMessage}

CONSULTATION GUIDELINES:
1. **Assess the User's Needs**: Determine if they need:
   - MT classification guidance
   - Regulatory compliance advice
   - Technical implementation support
   - Documentation assistance
   - Approval process navigation

2. **Provide Progressive Guidance**: 
   - Start with high-level understanding
   - Drill down into specific technical details
   - Build understanding step-by-step

3. **Ask Strategic Questions** when clarification needed:
   - Equipment specifications and safety classifications
   - Facility type and operational status
   - Existing documentation and procedures
   - Project timeline and constraints
   - Previous modification experience

4. **Deliver Value-Added Insights**:
   - Anticipate downstream challenges
   - Suggest efficiency improvements
   - Highlight critical success factors
   - Reference relevant case studies or lessons learned

5. **Always Provide Next Steps**:
   - Immediate actions the user can take
   - Resources to review or obtain
   - People to contact or involve
   - Timeline considerations

RESPOND WITH PRACTICAL, ACTIONABLE GUIDANCE TAILORED TO THE USER'S SPECIFIC SITUATION.
Maintain professional expertise while being conversational and supportive.";
        }

        private async Task<MTAnalysisReport> ParseGPT4ResponseToReport(string analysis, string userInput, EquipmentClassification embeddingEquipment, MTTypeRecommendation embeddingMTType)
        {
            // Extract structured data from GPT-4 response
            var designType = ExtractDesignTypeFromAnalysis(analysis, ExtractTypeFromString(embeddingMTType.PrimaryRecommendation?.MTType ?? "Type II"));
            
            // Smart MT Requirement Logic
            var isMTRequired = DetermineMTRequirement(analysis, designType, embeddingEquipment, userInput);
            var mtReason = GenerateMTRequirementReason(isMTRequired, designType, embeddingEquipment, userInput);
            
            var report = new MTAnalysisReport
            {
                ProjectNumber = $"MT-GPT4-{DateTime.Now:yyyyMMdd-HHmmss}",
                Timestamp = DateTime.UtcNow,
                MTRequired = isMTRequired,
                MTRequiredReason = mtReason,
                DesignType = (MTAnalyzer.Models.DesignType)designType,
                Confidence = Math.Max(embeddingEquipment.ConfidenceScore, embeddingMTType.ConfidenceScore),
                SuggestedActions = new List<string> { "Review GPT-4 analysis", "Validate classification", "Proceed with recommended actions" },
                DocumentFields = PopulateDocumentFields(analysis, userInput, designType, embeddingEquipment, isMTRequired)
            };

            return report;
        }

        // Enhanced document field population
        private MTDocumentFields PopulateDocumentFields(string analysis, string userInput, int designType, EquipmentClassification equipment, bool mtRequired)
        {
            var userLower = userInput.ToLowerInvariant();
            var equipmentLower = equipment.BestMatch.ToLowerInvariant();

            var fields = new MTDocumentFields
            {
                // Intelligent building extraction
                RelatedBuildings = ExtractBuildings(userInput),
                RelatedSystems = ExtractSystems(userInput, equipmentLower),
                RelatedEquipment = ExtractEquipmentIDs(userInput, equipment.BestMatch),
                ProposedSolution = ExtractProposedSolution(analysis, userInput),

                // Section II checkboxes - intelligent determination
                ProjectDesignReviewRequired = DetermineProjectDesignReview(designType, analysis, userLower),
                MajorModificationEvaluationRequired = DetermineMajorModificationEval(designType, analysis, userLower),
                SafetyInDesignStrategyRequired = DetermineSafetyInDesign(designType, analysis, userLower),

                // Page 2 risk classifications
                PreliminarySafetyClassification = DetermineSafetyClassification(analysis, userLower, equipmentLower),
                EnvironmentalRisk = DetermineEnvironmentalRisk(analysis, userLower),
                RadiologicalRisk = DetermineRadiologicalRisk(analysis, userLower),
                HazardCategory = DetermineHazardCategory(designType, analysis, userLower),
                ApprovalDesignators = DetermineApprovalDesignators(designType, analysis, userLower),

                // Design documents
                DesignInputDocuments = GenerateDesignInputDocuments(designType, userLower),
                DesignInputConsiderations = GenerateDesignInputConsiderations(analysis, userLower),
                ImpactedDocumentsList = GenerateImpactedDocuments(designType, userLower),
                DesignOutputDocuments = GenerateDesignOutputDocuments(designType, userLower),

                // Additional fields
                EstimatedCompletionDate = CalculateCompletionDate(designType, userLower),
                Cacn = GenerateCACN(userInput),
                ProjectType = DetermineProjectType(designType, userLower, equipmentLower),
                WorkPackageNumbers = GenerateWorkPackageNumbers(userInput),
                OtherOutputs = GenerateOtherOutputs(designType, analysis)
            };

            return fields;
        }

        private bool DetermineMTRequirement(string analysis, int designType, EquipmentClassification equipment, string userInput)
        {
            // Check explicit GPT-4 statements first
            if (analysis.Contains("MT Required: Yes", StringComparison.OrdinalIgnoreCase) || 
                analysis.Contains("MT is required", StringComparison.OrdinalIgnoreCase) ||
                analysis.Contains("requires an MT", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (analysis.Contains("MT Required: No", StringComparison.OrdinalIgnoreCase) || 
                analysis.Contains("MT is not required", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            // Smart logic based on design type and equipment classification
            var userLower = userInput.ToLowerInvariant();
            var equipmentLower = equipment.BestMatch.ToLowerInvariant();

            // Type I (New Design) - Always requires MT
            if (designType == 1) return true;

            // Type II (Modification) - Usually requires MT, especially for safety systems
            if (designType == 2)
            {
                if (IsSafetySignificantEquipment(userLower, equipmentLower)) return true;
                if (IsComplexModification(userLower)) return true;
                return true; // Default for Type II
            }

            // Type III (Non-Identical Replacement) - Always requires MT for safety equipment
            if (designType == 3)
            {
                if (IsSafetySignificantEquipment(userLower, equipmentLower)) return true;
                if (IsDigitalUpgrade(userLower)) return true;
                return true; // Most Type III require MT
            }

            // Type IV (Temporary) - May require MT depending on duration and safety impact
            if (designType == 4)
            {
                if (IsSafetySignificantEquipment(userLower, equipmentLower)) return true;
                return false; // Temporary modifications often don't require MT
            }

            // Type V (Identical Replacement) - Usually doesn't require MT unless safety-critical
            if (designType == 5)
            {
                if (IsCriticalSafetyEquipment(userLower, equipmentLower)) return true;
                return false;
            }

            // Default to requiring MT for safety
            return true;
        }

        private bool IsSafetySignificantEquipment(string userInput, string equipment)
        {
            var safetyKeywords = new[] {
                "emergency", "safety", "reactor protection", "engineered safety", "emergency core cooling",
                "diesel generator", "emergency power", "containment", "safety system", "protection system",
                "emergency shutdown", "safety-related", "safety significant", "class 1e"
            };

            return safetyKeywords.Any(keyword => 
                userInput.Contains(keyword) || equipment.Contains(keyword));
        }

        private bool IsCriticalSafetyEquipment(string userInput, string equipment)
        {
            var criticalKeywords = new[] {
                "reactor protection", "emergency core cooling", "containment isolation",
                "emergency shutdown", "safety-related", "class 1e"
            };

            return criticalKeywords.Any(keyword => 
                userInput.Contains(keyword) || equipment.Contains(keyword));
        }

        private bool IsComplexModification(string userInput)
        {
            var complexityKeywords = new[] {
                "digital", "software", "control system", "monitoring system", "upgrade",
                "enhanced", "new capabilities", "remote monitoring", "digital control"
            };

            return complexityKeywords.Any(keyword => userInput.Contains(keyword));
        }

        private bool IsDigitalUpgrade(string userInput)
        {
            return userInput.Contains("digital") || userInput.Contains("analog to digital") || 
                   userInput.Contains("control system") || userInput.Contains("monitoring system") ||
                   userInput.Contains("plc") || userInput.Contains("dcs") || userInput.Contains("scada");
        }

        private bool IsEnvironmentallySignificant(string userInput)
        {
            var environmentalKeywords = new[] {
                "discharge", "emission", "effluent", "waste", "environmental",
                "stack", "cooling water", "thermal", "chemical discharge"
            };

            return environmentalKeywords.Any(keyword => userInput.Contains(keyword));
        }

        private bool IsSeismicallySignificant(string userInput, string equipment)
        {
            var seismicKeywords = new[] {
                "seismic", "earthquake", "seismic category i", "seismic class",
                "reactor building", "containment", "auxiliary building",
                "safety-related structure"
            };

            return seismicKeywords.Any(keyword => 
                userInput.Contains(keyword) || equipment.Contains(keyword));
        }

        private string GenerateMTRequirementReason(bool isRequired, int designType, EquipmentClassification equipment, string userInput)
        {
            if (!isRequired)
            {
                var reasons = new List<string>();
                
                if (designType == 5)
                {
                    reasons.Add("Type V (Identical Replacement) - No change to form, fit, or function");
                    if (!IsCriticalSafetyEquipment(userInput.ToLowerInvariant(), equipment.BestMatch.ToLowerInvariant()))
                    {
                        reasons.Add("Non-safety related equipment allows simplified documentation per facility procedures");
                    }
                }
                else if (designType == 4)
                {
                    reasons.Add("Type IV (Temporary Modification) with limited duration and scope");
                    reasons.Add("Temporary nature reduces documentation requirements per 10 CFR 50.59");
                }
                
                reasons.Add("However, facility-specific procedures may still require engineering evaluation");
                return string.Join(". ", reasons) + ".";
            }

            var requiredReasons = new List<string>();

            // Design type specific reasons
            switch (designType)
            {
                case 1:
                    requiredReasons.Add("Type I (New Design) - Major modification introducing new functionality requires comprehensive MT documentation per 10 CFR 50.59(c)(2)");
                    requiredReasons.Add("New design must demonstrate compliance with General Design Criteria and applicable codes/standards");
                    break;
                case 2:
                    requiredReasons.Add("Type II (Modification) - Changes to existing system functionality require engineering analysis and documentation");
                    requiredReasons.Add("Must evaluate impact on accident analysis and Technical Specifications per 10 CFR 50.59");
                    break;
                case 3:
                    requiredReasons.Add("Type III (Non-Identical Replacement) - Different form, fit, or function requires design verification");
                    requiredReasons.Add("Non-identical replacement may affect safety function performance and requires 50.59 evaluation");
                    break;
                case 4:
                    requiredReasons.Add("Type IV (Temporary Modification) - Despite temporary nature, safety impact requires documented analysis");
                    requiredReasons.Add("Temporary modifications affecting safety systems require engineering justification and controls");
                    break;
                case 5:
                    requiredReasons.Add("Type V (Identical Replacement) - Safety-critical equipment requires verification of continued suitability");
                    break;
            }

            // Safety significance reasons
            var userLower = userInput.ToLowerInvariant();
            var equipmentLower = equipment.BestMatch.ToLowerInvariant();

            if (IsSafetySignificantEquipment(userLower, equipmentLower))
            {
                requiredReasons.Add("Safety-significant equipment modification requires comprehensive engineering analysis per ASME NQA-1 and 10 CFR 50 Appendix B");
                requiredReasons.Add("Changes to safety-related systems must demonstrate continued compliance with design basis requirements");
            }

            if (IsDigitalUpgrade(userLower))
            {
                requiredReasons.Add("Digital system implementation requires cybersecurity evaluation per RG 5.71 and software verification per IEEE 7-4.3.2");
                requiredReasons.Add("Digital upgrades may introduce new failure modes requiring updated probabilistic risk assessment");
            }

            if (IsEnvironmentallySignificant(userLower))
            {
                requiredReasons.Add("Environmental impact requires NEPA evaluation and potential Environmental Assessment");
            }

            if (IsSeismicallySignificant(userLower, equipmentLower))
            {
                requiredReasons.Add("Seismic Category I equipment requires seismic qualification per IEEE 344 and ASCE 4");
            }

            requiredReasons.Add("Documentation ensures regulatory compliance and supports operational safety per facility Operating License requirements");

            return string.Join(". ", requiredReasons) + ".";
        }

        private int ExtractDesignTypeFromAnalysis(string analysis, int embeddingResult)
        {
            // Extract type from GPT-4 analysis or fall back to embedding result
            if (analysis.Contains("Type V", StringComparison.OrdinalIgnoreCase)) return 5;
            if (analysis.Contains("Type IV", StringComparison.OrdinalIgnoreCase)) return 4;
            if (analysis.Contains("Type III", StringComparison.OrdinalIgnoreCase)) return 3;
            if (analysis.Contains("Type II", StringComparison.OrdinalIgnoreCase)) return 2;
            if (analysis.Contains("Type I", StringComparison.OrdinalIgnoreCase)) return 1;
            
            return embeddingResult; // Fallback to embedding
        }

        private MTClassificationResult ParseClassificationResponse(string jsonResponse, MTTypeRecommendation embeddingResult)
        {
            try
            {
                var result = JsonSerializer.Deserialize<MTClassificationResult>(jsonResponse);
                return result ?? CreateFallbackClassification(embeddingResult);
            }
            catch
            {
                return CreateFallbackClassification(embeddingResult);
            }
        }

        private MTClassificationResult CreateFallbackClassification(MTTypeRecommendation embeddingResult)
        {
            return new MTClassificationResult
            {
                ClassificationType = ExtractTypeFromString(embeddingResult.PrimaryRecommendation?.MTType ?? "Type II"),
                Confidence = embeddingResult.ConfidenceScore,
                Reasoning = "Fallback to embedding-based classification",
                KeyFactors = new List<string> { "Embedding analysis" }
            };
        }

        private int ExtractTypeFromString(string mtType)
        {
            if (mtType.Contains("Type V", StringComparison.OrdinalIgnoreCase)) return 5;
            if (mtType.Contains("Type IV", StringComparison.OrdinalIgnoreCase)) return 4;
            if (mtType.Contains("Type III", StringComparison.OrdinalIgnoreCase)) return 3;
            if (mtType.Contains("Type II", StringComparison.OrdinalIgnoreCase)) return 2;
            if (mtType.Contains("Type I", StringComparison.OrdinalIgnoreCase)) return 1;
            return 2; // Default to Type II
        }

        // Document field extraction and intelligent population methods
        private string ExtractBuildings(string userInput)
        {
            var buildingPatterns = new[] {
                @"Building\s+(\d+[-\w]*)",
                @"Bldg\s+(\d+[-\w]*)",
                @"(\d{3}-[A-Z]+-\d+)", // Hanford style
                @"(\d{3}-\w+-\d+)"
            };

            var userLower = userInput.ToLowerInvariant();
            
            // First try to extract specific building numbers using regex
            foreach (var pattern in buildingPatterns)
            {
                var match = System.Text.RegularExpressions.Regex.Match(userInput, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success) 
                {
                    var buildingNumber = match.Groups[1].Value;
                    if (userLower.Contains("hanford") || userLower.Contains("tank farm"))
                        return $"Building {buildingNumber}, Tank Farm Operations";
                    return $"Building {buildingNumber}";
                }
            }
            
            // Generic facility type identification if no specific building found
            if (userLower.Contains("reactor building")) return "Reactor Building";
            if (userLower.Contains("auxiliary building")) return "Auxiliary Building";
            if (userLower.Contains("containment")) return "Containment Building";
            if (userLower.Contains("control building")) return "Control Building";
            if (userLower.Contains("turbine building")) return "Turbine Building";

            return "To Be Determined During Site Survey";
        }

        private string ExtractSystems(string userInput, string equipment)
        {
            var userLower = userInput.ToLowerInvariant();
            var systems = new List<string>();

            // HVAC and Ventilation Systems
            if (userLower.Contains("hvac") || userLower.Contains("ventilation") || userLower.Contains("hepa"))
                systems.Add("Heating, Ventilation, and Air Conditioning (HVAC) System");

            // Emergency Systems
            if (userLower.Contains("emergency") || userLower.Contains("backup"))
                systems.Add("Emergency Core Cooling System (ECCS)");

            // Power Systems
            if (userLower.Contains("power") || userLower.Contains("electrical") || userLower.Contains("diesel"))
                systems.Add("Emergency Power System");

            // Safety Systems
            if (userLower.Contains("safety") || userLower.Contains("protection"))
                systems.Add("Reactor Protection System");

            // Instrumentation and Control
            if (userLower.Contains("control") || userLower.Contains("monitoring") || userLower.Contains("digital"))
                systems.Add("Instrumentation and Control System");

            // Cooling Systems
            if (userLower.Contains("cooling") || userLower.Contains("chiller"))
                systems.Add("Cooling Water System");

            return systems.Any() ? string.Join(", ", systems) : "To Be Determined During Engineering Review";
        }

        private string ExtractEquipmentIDs(string userInput, string equipment)
        {
            // Extract potential equipment IDs using patterns
            var idPatterns = new[] {
                @"([A-Z]{2,4}-\d{3,6}[A-Z]?)",
                @"(\d{3}-[A-Z]+-\d+)",
                @"([A-Z]+\d{3,})",
                @"(EIN\s*[-:]?\s*\w+)"
            };

            var ids = new List<string>();
            foreach (var pattern in idPatterns)
            {
                var matches = System.Text.RegularExpressions.Regex.Matches(userInput, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                foreach (System.Text.RegularExpressions.Match match in matches)
                {
                    ids.Add(match.Groups[1].Value);
                }
            }

            return ids.Any() ? string.Join(", ", ids) : "To Be Determined During Component Analysis";
        }

        private string ExtractProposedSolution(string analysis, string userInput)
        {
            // Extract proposed solution from analysis or generate intelligent default
            if (analysis.Contains("Proposed Solution", StringComparison.OrdinalIgnoreCase))
            {
                var start = analysis.IndexOf("Proposed Solution", StringComparison.OrdinalIgnoreCase);
                var end = analysis.IndexOf("\n\n", start);
                if (end > start) return analysis.Substring(start, end - start).Trim();
            }

            var userLower = userInput.ToLowerInvariant();
            if (userLower.Contains("replace") || userLower.Contains("replacement"))
                return "Replace existing equipment with new high-efficiency units meeting current safety and performance standards";
            if (userLower.Contains("upgrade") || userLower.Contains("moderniz"))
                return "Upgrade existing system with enhanced capabilities while maintaining compatibility with current infrastructure";
            if (userLower.Contains("install") || userLower.Contains("new"))
                return "Install new equipment to improve system performance and safety margins";

            return "[Detailed description of the proposed modification solution]";
        }

        // Section II checkbox determination methods
        private string DetermineProjectDesignReview(int designType, string analysis, string userInput)
        {
            // Type I always requires design review
            if (designType == 1) return "Yes";
            
            // Major modifications require design review
            if (analysis.Contains("major modification", StringComparison.OrdinalIgnoreCase) ||
                userInput.Contains("safety-related") || userInput.Contains("safety system"))
                return "Yes";

            // Type V identical replacements typically don't need full review
            if (designType == 5) return "No";

            return "N/A";
        }

        private string DetermineMajorModificationEval(int designType, string analysis, string userInput)
        {
            // Type I and complex Type II require major modification evaluation
            if (designType == 1 || 
                (designType == 2 && (userInput.Contains("safety") || userInput.Contains("emergency"))))
                return "Yes";

            if (designType == 5) return "N/A";

            return "No";
        }

        private string DetermineSafetyInDesign(int designType, string analysis, string userInput)
        {
            // Safety-significant modifications require safety in design
            if (userInput.Contains("safety") || userInput.Contains("emergency") || 
                userInput.Contains("protection") || userInput.Contains("containment"))
                return "Yes";

            if (designType == 5 || designType == 4) return "N/A";

            return "No";
        }

        // Page 2 classification methods
        private string DetermineSafetyClassification(string analysis, string userInput, string equipment)
        {
            if (IsCriticalSafetyEquipment(userInput, equipment) ||
                userInput.Contains("reactor protection") || userInput.Contains("emergency core cooling"))
                return "SC"; // Safety Class

            if (IsSafetySignificantEquipment(userInput, equipment))
                return "SS"; // Safety Significant

            return "GS"; // General Service
        }

        private string DetermineEnvironmentalRisk(string analysis, string userInput)
        {
            var environmentalIndicators = new[] {
                "discharge", "emission", "environmental", "waste", "effluent",
                "contamination", "radioactive", "chemical", "hazardous"
            };

            return environmentalIndicators.Any(indicator => 
                userInput.Contains(indicator, StringComparison.OrdinalIgnoreCase)) ? "Yes" : "No";
        }

        private string DetermineRadiologicalRisk(string analysis, string userInput)
        {
            var radiologicalIndicators = new[] {
                "radioactive", "contamination", "radiation", "nuclear", "reactor",
                "fuel", "radioactivity", "radiological"
            };

            return radiologicalIndicators.Any(indicator => 
                userInput.Contains(indicator, StringComparison.OrdinalIgnoreCase)) ? "Yes" : "No";
        }

        private string DetermineHazardCategory(int designType, string analysis, string userInput)
        {
            // Remove hardcoded category assignments - should be determined through proper analysis
            return "To be determined"; // Requires safety analysis evaluation
        }

        private string DetermineApprovalDesignators(int designType, string analysis, string userInput)
        {
            var designators = new List<string>();

            if (IsSafetySignificantEquipment(userInput.ToLowerInvariant(), ""))
                designators.Add("Safety-Significant");

            if (userInput.Contains("emergency", StringComparison.OrdinalIgnoreCase))
                designators.Add("Emergency System");

            if (userInput.Contains("seismic", StringComparison.OrdinalIgnoreCase))
                designators.Add("Seismic Category I");

            if (designType == 1) designators.Add("New Design");

            return designators.Any() ? string.Join(", ", designators) : "Standard Modification";
        }

        // Document generation methods
        private List<DocumentReference> GenerateDesignInputDocuments(int designType, string userInput)
        {
            var docs = new List<DocumentReference>
            {
                new DocumentReference { DocumentType = "Drawing", DocumentNumber = "TBD", Title = "System Configuration Drawing" },
                new DocumentReference { DocumentType = "Specification", DocumentNumber = "TBD", Title = "Equipment Specification" },
                new DocumentReference { DocumentType = "Procedure", DocumentNumber = "TBD", Title = "Installation Procedure" }
            };

            if (designType == 1)
            {
                docs.Add(new DocumentReference { DocumentType = "Analysis", DocumentNumber = "TBD", Title = "Safety Analysis Report" });
            }

            return docs;
        }

        private string GenerateDesignInputConsiderations(string analysis, string userInput)
        {
            var considerations = new List<string>
            {
                "Integration with existing plant protection system",
                "Environmental qualification requirements",
                "Seismic design considerations"
            };

            if (userInput.Contains("digital", StringComparison.OrdinalIgnoreCase))
                considerations.Add("Cybersecurity requirements per RG 5.71");

            if (userInput.Contains("power", StringComparison.OrdinalIgnoreCase))
                considerations.Add("Electrical load analysis and power distribution");

            return string.Join(", ", considerations);
        }

        private List<DocumentReference> GenerateImpactedDocuments(int designType, string userInput)
        {
            var docs = new List<DocumentReference>();

            if (IsSafetySignificantEquipment(userInput, ""))
            {
                docs.Add(new DocumentReference { DocumentType = "FSAR", DocumentNumber = "TBD", Title = "Final Safety Analysis Report" });
                docs.Add(new DocumentReference { DocumentType = "Tech Specs", DocumentNumber = "TBD", Title = "Technical Specifications" });
            }

            docs.Add(new DocumentReference { DocumentType = "Procedure", DocumentNumber = "TBD", Title = "Operating Procedures" });

            return docs;
        }

        private List<DocumentReference> GenerateDesignOutputDocuments(int designType, string userInput)
        {
            return new List<DocumentReference>
            {
                new DocumentReference { DocumentType = "Installation Drawing", DocumentNumber = "TBD", Title = "Equipment Installation Drawing" },
                new DocumentReference { DocumentType = "Test Procedure", DocumentNumber = "TBD", Title = "Post-Installation Test Procedure" },
                new DocumentReference { DocumentType = "Operating Procedure", DocumentNumber = "TBD", Title = "Updated Operating Procedure" }
            };
        }

        // Additional field calculation methods
        private string CalculateCompletionDate(int designType, string userInput)
        {
            var baseDate = DateTime.Now;
            
            // Remove hardcoded timeline logic - completion dates should be project-specific
            var completionDate = baseDate.AddMonths(6); // Neutral timeline, requires planning review

            return completionDate.ToString("yyyy-MM-dd");
        }

        private string GenerateCACN(string userInput)
        {
            // Generate a CACN based on project characteristics
            if (userInput.Contains("emergency", StringComparison.OrdinalIgnoreCase))
                return "EMRG-2025";
            if (userInput.Contains("safety", StringComparison.OrdinalIgnoreCase))
                return "SFTY-2025";
            return "MAINT-2025";
        }

        private string DetermineProjectType(int designType, string userInput, string equipment)
        {
            if (designType == 1) return "New Installation";
            if (userInput.Contains("replace", StringComparison.OrdinalIgnoreCase)) return "Component Replacement";
            if (userInput.Contains("upgrade", StringComparison.OrdinalIgnoreCase)) return "System Upgrade";
            return "Component Modification";
        }

        private string GenerateWorkPackageNumbers(string userInput)
        {
            // Generate intelligent work package numbers based on content
            var packages = new List<string>();
            
            if (userInput.Contains("electrical", StringComparison.OrdinalIgnoreCase))
                packages.Add("WP-ELEC-2025-001");
            if (userInput.Contains("mechanical", StringComparison.OrdinalIgnoreCase))
                packages.Add("WP-MECH-2025-001");
            if (userInput.Contains("instrument", StringComparison.OrdinalIgnoreCase))
                packages.Add("WP-IC-2025-001");

            return packages.Any() ? string.Join(", ", packages) : "WP-MAINT-2025-001";
        }

        private string GenerateOtherOutputs(int designType, string analysis)
        {
            var outputs = new List<string>();

            if (designType == 1)
            {
                outputs.Add("Safety Analysis Documentation");
                outputs.Add("Environmental Impact Assessment");
            }

            if (analysis.Contains("training", StringComparison.OrdinalIgnoreCase))
                outputs.Add("Training Materials and Procedures");

            if (analysis.Contains("test", StringComparison.OrdinalIgnoreCase))
                outputs.Add("Acceptance Test Procedures");

            return outputs.Any() ? string.Join(", ", outputs) : "Post-modification testing documentation";
        }

        private async Task<MTAnalysisReport> CreateFallbackReport(string userInput)
        {
            _logger.LogWarning("Creating enhanced fallback report due to GPT-4 analysis failure");
            
            // Try to extract basic information from user input for better fallback
            var userLower = userInput.ToLowerInvariant();
            var isTemporary = userLower.Contains("temporary") || userLower.Contains("temp");
            var isReplacement = userLower.Contains("replace") || userLower.Contains("replacement");
            var isNewInstall = userLower.Contains("new") || userLower.Contains("install") || userLower.Contains("add");
            var isModification = userLower.Contains("modify") || userLower.Contains("upgrade") || userLower.Contains("change");
            
            // Intelligent fallback classification
            var fallbackType = MTAnalyzer.Models.DesignType.TypeII; // Default
            var fallbackReason = "Manual review required due to AI analysis failure. ";
            
            if (isTemporary)
            {
                fallbackType = MTAnalyzer.Models.DesignType.TypeIV;
                fallbackReason += "Appears to be temporary modification - requires duration and safety impact assessment. ";
            }
            else if (isReplacement && userLower.Contains("identical"))
            {
                fallbackType = MTAnalyzer.Models.DesignType.TypeV;
                fallbackReason += "Appears to be identical replacement - verify form, fit, and function equivalence. ";
            }
            else if (isReplacement)
            {
                fallbackType = MTAnalyzer.Models.DesignType.TypeIII;
                fallbackReason += "Appears to be non-identical replacement - requires design verification. ";
            }
            else if (isNewInstall)
            {
                fallbackType = MTAnalyzer.Models.DesignType.TypeI;
                fallbackReason += "Appears to be new installation - requires comprehensive design analysis. ";
            }
            
            fallbackReason += "Recommend consulting with nuclear engineering staff for proper classification and 10 CFR 50.59 evaluation.";
            
            return new MTAnalysisReport
            {
                ProjectNumber = $"MT-FALLBACK-{DateTime.Now:yyyyMMdd-HHmmss}",
                Timestamp = DateTime.UtcNow,
                MTRequired = true, // Conservative approach
                MTRequiredReason = fallbackReason,
                DesignType = fallbackType,
                Confidence = 0.5, // Remove hardcoded logic - neutral fallback confidence
                SuggestedActions = new List<string> 
                { 
                    "Manual engineering review required",
                    "Verify AI service deployment status", 
                    "Consult facility MT procedures",
                    "Consider 10 CFR 50.59 screening requirements",
                    "Engage nuclear engineering support"
                }
            };
        }
    }

    // Supporting models
    public class MTClassificationResult
    {
        public int ClassificationType { get; set; }
        public string TypeName { get; set; } = "";
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = "";
        public List<string> KeyFactors { get; set; } = new();
        public bool AgreesWithEmbedding { get; set; }
    }
}
