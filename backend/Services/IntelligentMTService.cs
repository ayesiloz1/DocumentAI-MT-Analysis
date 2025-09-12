using Azure.AI.OpenAI;
using Azure;
using MTAnalyzer.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text;

namespace MTAnalyzer.Services
{
    public interface IIntelligentMTService
    {
        Task<MTAnalysisReport> AnalyzeWithGPT4Async(string userInput, ModificationTravelerInput? structuredInput = null);
        Task<string> GenerateIntelligentResponseAsync(string userMessage, string conversationHistory = "");
        Task<MTClassificationResult> ClassifyMTTypeAsync(string description);
        Task<List<string>> ExtractEquipmentDetailsAsync(string description);
        Task<string> GenerateRecommendationsAsync(MTAnalysisReport analysis);
    }

    public class IntelligentMTService : IIntelligentMTService
    {
        private readonly OpenAIClient _openAIClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IntelligentMTService> _logger;
        private readonly IEmbeddingService _embeddingService;
        private readonly string _gpt4DeploymentName;
        private readonly string _gpt4TurboDeploymentName;

        public IntelligentMTService(
            IConfiguration configuration, 
            ILogger<IntelligentMTService> logger,
            IEmbeddingService embeddingService)
        {
            _configuration = configuration;
            _logger = logger;
            _embeddingService = embeddingService;

            var endpoint = _configuration["AzureOpenAI:Endpoint"];
            var apiKey = _configuration["AzureOpenAI:ApiKey"];

            _openAIClient = new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
            
            // Get GPT-4 deployment names from config
            _gpt4DeploymentName = _configuration["AzureOpenAI:ChatDeploymentName"] ?? "gpt-4";
            _gpt4TurboDeploymentName = _configuration["AzureOpenAI:FastChatDeploymentName"] ?? "gpt-4-turbo";
        }

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

                // Use GPT-4 for intelligent analysis
                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = _gpt4DeploymentName,
                    Messages = {
                        new ChatRequestSystemMessage(GetSystemPrompt()),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.1f,
                    MaxTokens = 2000,
                    NucleusSamplingFactor = 0.95f
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
                    DeploymentName = _gpt4DeploymentName, // Use standard gpt-4 for consistency
                    Messages = {
                        new ChatRequestSystemMessage(GetConversationSystemPrompt()),
                        new ChatRequestUserMessage(prompt)
                    },
                    Temperature = 0.2f,
                    MaxTokens = 1500
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                return response.Value.Choices[0].Message.Content ?? "I apologize, but I couldn't generate a response. Please try again.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating intelligent response");
                return "I'm experiencing technical difficulties. Please try rephrasing your question.";
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
                    DeploymentName = _gpt4DeploymentName,
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
                    DeploymentName = _gpt4TurboDeploymentName,
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
                    DeploymentName = _gpt4TurboDeploymentName,
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
            return @"You are an expert nuclear facility modification analyst with deep knowledge of:
- Nuclear regulations (10 CFR, etc.)
- Modification Traveler (MT) requirements
- Equipment classifications and specifications
- Safety analysis requirements
- Documentation standards

Analyze modification scenarios with the intelligence and reasoning of a senior nuclear engineer.
Provide detailed, accurate classifications and comprehensive analysis.
Consider safety implications, regulatory requirements, and practical implementation aspects.";
        }

        private string GetConversationSystemPrompt()
        {
            return @"You are an intelligent assistant for nuclear facility modification analysis.
Engage in natural conversation while providing expert-level technical guidance.
Be conversational but authoritative, helpful but precise.
Reference regulations and standards when appropriate.
Ask clarifying questions to better understand the user's scenario.";
        }

        private string BuildIntelligentAnalysisPrompt(string userInput, EquipmentClassification embeddingEquipment, MTTypeRecommendation embeddingMTType)
        {
            return $@"
Analyze this nuclear facility modification scenario using your expert knowledge:

USER INPUT: {userInput}

EMBEDDING AI ANALYSIS:
- Equipment Classification: {embeddingEquipment.BestMatch} (Confidence: {embeddingEquipment.ConfidenceScore:P1})
- MT Type Classification: {embeddingMTType.PrimaryRecommendation?.MTType} (Confidence: {embeddingMTType.ConfidenceScore:P1})

As an expert nuclear modification analyst, provide a comprehensive analysis including:

1. **MT Classification (Type I-V)** with detailed reasoning
2. **MT Requirement Determination** and justification
3. **Key Technical Factors** influencing the classification
4. **Safety and Regulatory Considerations** per 10 CFR 50.59
5. **Recommended Next Steps** for the modification process
6. **Potential Challenges** or special considerations

Use your knowledge of nuclear regulations, modification processes, and industry best practices.
Consider both the embedding AI suggestions and your expert analysis.

Focus especially on:
- 10 CFR 50.59 evaluation criteria
- Identical vs non-identical replacement determination
- Safety function impacts
- Documentation requirements
- Regulatory approval pathways";
        }

        private string BuildConversationPrompt(string userMessage, string conversationHistory)
        {
            return $@"
CONVERSATION HISTORY:
{conversationHistory}

CURRENT USER MESSAGE: {userMessage}

Respond naturally and intelligently to continue the conversation about nuclear facility modifications.
Provide helpful information, ask clarifying questions, and guide the user toward a complete understanding of their MT requirements.";
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
                SuggestedActions = new List<string> { "Review GPT-4 analysis", "Validate classification", "Proceed with recommended actions" }
            };

            return report;
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
                   userInput.Contains("control system") || userInput.Contains("monitoring system");
        }

        private string GenerateMTRequirementReason(bool isRequired, int designType, EquipmentClassification equipment, string userInput)
        {
            if (!isRequired)
            {
                return designType == 5 ? 
                    "Identical replacement of non-safety equipment - MT may not be required based on facility procedures" :
                    "Modification does not meet MT requirement threshold based on analysis";
            }

            var reasons = new List<string>();

            switch (designType)
            {
                case 1:
                    reasons.Add("Type I (New Design) modifications require comprehensive MT documentation");
                    break;
                case 2:
                    reasons.Add("Type II (Modification) affecting system functionality requires MT review");
                    break;
                case 3:
                    reasons.Add("Type III (Non-Identical Replacement) requires MT due to functional differences");
                    break;
                case 4:
                    reasons.Add("Type IV (Temporary) modification requires MT due to safety implications");
                    break;
            }

            if (IsSafetySignificantEquipment(userInput.ToLowerInvariant(), equipment.BestMatch.ToLowerInvariant()))
            {
                reasons.Add("Safety-significant equipment modification requires comprehensive engineering analysis and documentation");
            }

            if (IsDigitalUpgrade(userInput.ToLowerInvariant()))
            {
                reasons.Add("Digital system upgrade introduces new capabilities requiring design verification");
            }

            return string.Join(". ", reasons) + ".";
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

        private async Task<MTAnalysisReport> CreateFallbackReport(string userInput)
        {
            return new MTAnalysisReport
            {
                ProjectNumber = $"MT-FALLBACK-{DateTime.Now:yyyyMMdd-HHmmss}",
                Timestamp = DateTime.UtcNow,
                MTRequired = true,
                MTRequiredReason = "Unable to complete GPT-4 analysis. Manual review required.",
                DesignType = MTAnalyzer.Models.DesignType.TypeII, // Default to Type II
                Confidence = 0.5,
                SuggestedActions = new List<string> { "Manual review required", "Check GPT-4 deployment status" }
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
