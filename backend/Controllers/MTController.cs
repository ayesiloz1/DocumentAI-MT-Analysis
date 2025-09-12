using MTAnalyzer.Models;
using MTAnalyzer.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace MTAnalyzer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MTController : ControllerBase
    {
        private readonly IAzureOpenAIService _aiService;
        private readonly IMTDecisionEngine _decisionEngine;
        private readonly IIntelligentMTService _intelligentService;

        public MTController(
            IAzureOpenAIService aiService, 
            IMTDecisionEngine decisionEngine,
            IIntelligentMTService intelligentService)
        {
            _aiService = aiService;
            _decisionEngine = decisionEngine;
            _intelligentService = intelligentService;
        }

        [HttpPost("analyze-with-gpt4")]
        public async Task<ActionResult<MTAnalysisReport>> AnalyzeWithGPT4Async([FromBody] IntelligentAnalysisRequest request)
        {
            try
            {
                var result = await _intelligentService.AnalyzeWithGPT4Async(request.UserInput, request.StructuredInput);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = "GPT-4 analysis failed" });
            }
        }

        [HttpPost("intelligent-chat")]
        public async Task<ActionResult<IntelligentChatResponse>> IntelligentChatAsync([FromBody] IntelligentChatRequest request)
        {
            try
            {
                Console.WriteLine($"🎯 RECEIVED INTELLIGENT CHAT REQUEST: {request.Message}");
                
                var response = await _intelligentService.GenerateIntelligentResponseAsync(
                    request.Message, 
                    request.ConversationHistory);

                Console.WriteLine($"✅ INTELLIGENT CHAT RESPONSE GENERATED");
                return Ok(new IntelligentChatResponse
                {
                    Response = response,
                    Timestamp = DateTime.UtcNow,
                    ProcessedByGPT4 = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ INTELLIGENT CHAT ERROR: {ex.Message}");
                return StatusCode(500, new { error = ex.Message, details = "Intelligent chat failed" });
            }
        }

        [HttpPost("classify-mt")]
        public async Task<ActionResult<MTClassificationResult>> ClassifyMTAsync([FromBody] ClassificationRequest request)
        {
            try
            {
                var result = await _intelligentService.ClassifyMTTypeAsync(request.Description);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = "MT classification failed" });
            }
        }

        [HttpPost("analyze")]
        public async Task<ActionResult<EnhancedMTResponse>> AnalyzeModificationAsync([FromBody] ModificationTravelerInput input)
        {
            try
            {
                // Enhanced AI analysis with chain-of-thought reasoning
                var enhancedPrompt = $"""
                    You are an expert nuclear regulatory analyst with deep knowledge of 10 CFR 50.59 and modification traveler analysis.
                    
                    Use chain-of-thought reasoning to analyze this modification:
                    
                    **Modification Description:**
                    {input.ProblemDescription}
                    
                    **Proposed Solution:**
                    {input.ProposedSolution}
                    
                    **Analysis Framework:**
                    1. **Safety Function Impact Assessment**
                       - Identify all safety functions potentially affected
                       - Assess whether any safety function is adversely affected
                       - Consider both direct and indirect impacts
                    
                    2. **Regulatory Compliance Analysis**
                       - Evaluate against 10 CFR 50.59 criteria
                       - Consider all eight screening questions
                       - Assess need for license amendment
                    
                    3. **Risk Assessment**
                       - Identify potential failure modes
                       - Assess consequences of failure
                       - Consider cumulative risk impacts
                    
                    4. **Best Practices Integration**
                       - Apply industry best practices
                       - Consider lessons learned from similar modifications
                       - Recommend implementation approach
                    
                    **Required Output:**
                    Provide a comprehensive analysis with:
                    - Executive summary
                    - Detailed findings for each criterion
                    - Risk assessment with confidence levels
                    - Specific recommendations
                    - Regulatory pathway determination
                    
                    Think step-by-step and show your reasoning process.
                    """;

                var enhancedResponse = await _aiService.ExtractInformationFromTextAsync(
                    input.ProblemDescription + " " + input.ProposedSolution, 
                    enhancedPrompt);
                
                // Standard decision engine analysis
                var (mtRequired, reason, designType) = _decisionEngine.DetermineMTRequirement(input);
                var standardAnalysis = new MTAnalysisResult
                {
                    RequiresLicenseAmendment = mtRequired,
                    Reason = reason,
                    DesignType = designType.ToString(),
                    Confidence = 0.8
                };
                
                // Create enhanced response
                var response = new EnhancedMTResponse
                {
                    AnalysisId = Guid.NewGuid().ToString(),
                    StandardAnalysis = standardAnalysis,
                    EnhancedAnalysis = enhancedResponse,
                    ConfidenceScore = CalculateConfidenceScore(enhancedResponse, standardAnalysis),
                    KeyFindings = ExtractKeyFindings(enhancedResponse),
                    RegulatoryPath = DetermineRegulatoryPath(standardAnalysis, enhancedResponse),
                    Recommendations = ExtractRecommendations(enhancedResponse),
                    RiskAssessment = ExtractRiskAssessment(enhancedResponse),
                    ComplianceStatus = AssessCompliance(standardAnalysis),
                    Timestamp = DateTime.UtcNow
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("confidence")]
        public async Task<ActionResult<ConfidenceAnalysis>> AnalyzeConfidenceAsync([FromBody] ConfidenceRequest request)
        {
            try
            {
                var prompt = $"""
                    Perform a Bayesian confidence analysis for this nuclear modification analysis:
                    
                    **Analysis Text:** {request.AnalysisText}
                    **Evidence Sources:** {string.Join(", ", request.EvidenceSources)}
                    
                    Assess confidence based on:
                    1. Evidence quality and completeness
                    2. Regulatory clarity
                    3. Historical precedent strength
                    4. Expert consensus level
                    5. Data reliability
                    
                    Provide a confidence score (0-100) with detailed justification.
                    """;

                var response = await _aiService.ExtractInformationFromTextAsync(
                    request.AnalysisText,
                    prompt);
                
                var analysis = new ConfidenceAnalysis
                {
                    OverallConfidence = ExtractConfidenceScore(response),
                    EvidenceQuality = AssessEvidenceQuality(request.EvidenceSources),
                    RegulatoryClarity = AssessRegulatoryClarity(response),
                    HistoricalPrecedent = AssessHistoricalPrecedent(response),
                    UncertaintyFactors = ExtractUncertaintyFactors(response),
                    Justification = response,
                    Timestamp = DateTime.UtcNow
                };

                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("extract-entities")]
        public async Task<ActionResult<SmartEntityResult>> ExtractEntitiesAsync([FromBody] EntityExtractionRequest request)
        {
            try
            {
                var prompt = $"""
                    Extract and classify nuclear-specific entities from this modification description:
                    
                    **Text:** {request.Text}
                    
                    Identify and categorize:
                    1. **Equipment/Components** (with safety classification)
                    2. **Nuclear Systems** (with safety function)
                    3. **Regulatory References** (CFR, Reg Guides, etc.)
                    4. **Safety Functions** (with classification)
                    5. **Modification Types** (with regulatory pathway)
                    
                    Format as structured JSON with confidence scores for each entity.
                    """;

                var response = await _aiService.ExtractInformationFromTextAsync(
                    request.Text,
                    prompt);
                
                var result = new SmartEntityResult
                {
                    Equipment = ExtractEquipment(response),
                    Systems = ExtractSystems(response),
                    Regulations = ExtractRegulations(response),
                    SafetyFunctions = ExtractSafetyFunctions(response),
                    ModificationTypes = ExtractModificationTypes(response),
                    ExtractionConfidence = 0.85, // Default confidence
                    ProcessingMethod = "AI-Enhanced NER",
                    Timestamp = DateTime.UtcNow
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #region Helper Methods

        private double CalculateConfidenceScore(string enhancedAnalysis, MTAnalysisResult standardAnalysis)
        {
            // Simple confidence calculation based on analysis completeness and consistency
            var baseScore = 0.7; // Base confidence
            
            if (enhancedAnalysis.Contains("high confidence") || enhancedAnalysis.Contains("strong evidence"))
                baseScore += 0.15;
            
            if (enhancedAnalysis.Contains("low confidence") || enhancedAnalysis.Contains("insufficient"))
                baseScore -= 0.2;
            
            if (standardAnalysis.RequiresLicenseAmendment)
                baseScore += 0.1; // Conservative approach increases confidence
            
            return Math.Max(0.1, Math.Min(1.0, baseScore));
        }

        private List<string> ExtractKeyFindings(string analysis)
        {
            var findings = new List<string>();
            
            // Simple extraction based on common patterns
            if (analysis.Contains("safety function"))
                findings.Add("Safety function impact identified");
            
            if (analysis.Contains("license amendment"))
                findings.Add("License amendment required");
            
            if (analysis.Contains("10 CFR 50.59"))
                findings.Add("50.59 evaluation applicable");
            
            if (analysis.Contains("risk"))
                findings.Add("Risk considerations identified");
            
            return findings.Any() ? findings : new List<string> { "Comprehensive analysis completed" };
        }

        private string DetermineRegulatoryPath(MTAnalysisResult standard, string enhanced)
        {
            if (standard.RequiresLicenseAmendment)
                return "License Amendment Required";
            
            if (enhanced.Contains("license amendment"))
                return "License Amendment Recommended";
            
            return "50.59 Evaluation";
        }

        private List<string> ExtractRecommendations(string analysis)
        {
            var recommendations = new List<string>();
            
            // Extract recommendation patterns
            var lines = analysis.Split('\n');
            foreach (var line in lines)
            {
                if (line.Contains("recommend") || line.Contains("should") || line.Contains("must"))
                {
                    recommendations.Add(line.Trim());
                }
            }
            
            return recommendations.Any() ? recommendations : 
                new List<string> { "Follow standard modification process", "Perform detailed engineering analysis" };
        }

        private EnhancedRiskAssessment ExtractRiskAssessment(string analysis)
        {
            return new EnhancedRiskAssessment
            {
                OverallRisk = analysis.Contains("high risk") ? "High" : 
                             analysis.Contains("low risk") ? "Low" : "Medium",
                RiskFactors = ExtractRiskFactors(analysis),
                Mitigations = ExtractMitigations(analysis),
                Confidence = 0.8
            };
        }

        private List<string> ExtractRiskFactors(string analysis)
        {
            var factors = new List<string>();
            
            if (analysis.Contains("safety system"))
                factors.Add("Safety system involvement");
            
            if (analysis.Contains("failure"))
                factors.Add("Potential failure modes identified");
            
            if (analysis.Contains("operator"))
                factors.Add("Human factors considerations");
            
            return factors.Any() ? factors : new List<string> { "Standard modification risks" };
        }

        private List<string> ExtractMitigations(string analysis)
        {
            return new List<string> 
            { 
                "Implement robust testing procedures",
                "Perform detailed design review",
                "Ensure operator training"
            };
        }

        private string AssessCompliance(MTAnalysisResult analysis)
        {
            return analysis.RequiresLicenseAmendment ? "Requires NRC Review" : "Compliant under 50.59";
        }

        private double ExtractConfidenceScore(string response)
        {
            // Simple pattern matching for confidence scores
            var confidencePatterns = new[]
            {
                @"confidence(?:\s+(?:score|level))?\s*:?\s*(\d+(?:\.\d+)?)",
                @"(\d+(?:\.\d+)?)\s*%?\s*confidence",
                @"confidence\s+of\s+(\d+(?:\.\d+)?)"
            };

            foreach (var pattern in confidencePatterns)
            {
                var match = System.Text.RegularExpressions.Regex.Match(response, pattern, 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success && double.TryParse(match.Groups[1].Value, out var score))
                {
                    return score > 1 ? score / 100 : score; // Normalize to 0-1 range
                }
            }
            
            return 0.75; // Default confidence
        }

        private double AssessEvidenceQuality(List<string> sources)
        {
            if (!sources.Any()) return 0.3;
            
            var qualityScore = 0.5; // Base score
            
            foreach (var source in sources)
            {
                if (source.Contains("CFR") || source.Contains("regulation"))
                    qualityScore += 0.2;
                if (source.Contains("precedent") || source.Contains("historical"))
                    qualityScore += 0.15;
                if (source.Contains("expert") || source.Contains("analysis"))
                    qualityScore += 0.1;
            }
            
            return Math.Min(1.0, qualityScore);
        }

        private double AssessRegulatoryClarity(string analysis)
        {
            return analysis.Contains("clear") || analysis.Contains("explicit") ? 0.9 : 0.7;
        }

        private double AssessHistoricalPrecedent(string analysis)
        {
            return analysis.Contains("precedent") || analysis.Contains("similar") ? 0.8 : 0.6;
        }

        private List<string> ExtractUncertaintyFactors(string analysis)
        {
            var factors = new List<string>();
            
            if (analysis.Contains("uncertain") || analysis.Contains("unclear"))
                factors.Add("Regulatory interpretation uncertainty");
            
            if (analysis.Contains("insufficient data"))
                factors.Add("Data completeness");
            
            if (analysis.Contains("novel") || analysis.Contains("first-of-kind"))
                factors.Add("Limited precedent");
            
            return factors.Any() ? factors : new List<string> { "Standard analysis uncertainty" };
        }

        // Simple entity extraction methods
        private List<EquipmentEntity> ExtractEquipment(string response)
        {
            return new List<EquipmentEntity>
            {
                new EquipmentEntity { Name = "Equipment identified in analysis", Type = "General", Confidence = 0.8 }
            };
        }

        private List<SystemEntity> ExtractSystems(string response)
        {
            return new List<SystemEntity>
            {
                new SystemEntity { Name = "System identified in analysis", Type = "Nuclear", Confidence = 0.8 }
            };
        }

        private List<RegulationEntity> ExtractRegulations(string response)
        {
            var regulations = new List<RegulationEntity>();
            
            if (response.Contains("10 CFR 50.59"))
                regulations.Add(new RegulationEntity { Reference = "10 CFR 50.59", Relevance = 0.95 });
            
            return regulations.Any() ? regulations : 
                new List<RegulationEntity> { new RegulationEntity { Reference = "General nuclear regulations", Relevance = 0.7 } };
        }

        private List<SafetyFunctionEntity> ExtractSafetyFunctions(string response)
        {
            return new List<SafetyFunctionEntity>
            {
                new SafetyFunctionEntity { Name = "Safety function evaluation", Classification = "To be determined", Confidence = 0.75 }
            };
        }

        private List<ModificationTypeEntity> ExtractModificationTypes(string response)
        {
            return new List<ModificationTypeEntity>
            {
                new ModificationTypeEntity { Type = "Modification requiring evaluation", RegulatoryPath = "50.59 or License Amendment", Confidence = 0.8 }
            };
        }

        #endregion
    }

    // Simple analysis result class
    public class MTAnalysisResult
    {
        public bool RequiresLicenseAmendment { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string DesignType { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    // Enhanced response models
    public class EnhancedMTResponse
    {
        public string AnalysisId { get; set; } = string.Empty;
        public MTAnalysisResult StandardAnalysis { get; set; } = new();
        public string EnhancedAnalysis { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public List<string> KeyFindings { get; set; } = new();
        public string RegulatoryPath { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = new();
        public EnhancedRiskAssessment RiskAssessment { get; set; } = new();
        public string ComplianceStatus { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class ConfidenceRequest
    {
        public string AnalysisText { get; set; } = string.Empty;
        public List<string> EvidenceSources { get; set; } = new();
    }

    public class ConfidenceAnalysis
    {
        public double OverallConfidence { get; set; }
        public double EvidenceQuality { get; set; }
        public double RegulatoryClarity { get; set; }
        public double HistoricalPrecedent { get; set; }
        public List<string> UncertaintyFactors { get; set; } = new();
        public string Justification { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class EntityExtractionRequest
    {
        public string Text { get; set; } = string.Empty;
        public string AnalysisType { get; set; } = string.Empty;
    }

    public class SmartEntityResult
    {
        public List<EquipmentEntity> Equipment { get; set; } = new();
        public List<SystemEntity> Systems { get; set; } = new();
        public List<RegulationEntity> Regulations { get; set; } = new();
        public List<SafetyFunctionEntity> SafetyFunctions { get; set; } = new();
        public List<ModificationTypeEntity> ModificationTypes { get; set; } = new();
        public double ExtractionConfidence { get; set; }
        public string ProcessingMethod { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class EnhancedRiskAssessment
    {
        public string OverallRisk { get; set; } = string.Empty;
        public List<string> RiskFactors { get; set; } = new();
        public List<string> Mitigations { get; set; } = new();
        public double Confidence { get; set; }
    }

    // Entity classes
    public class EquipmentEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class SystemEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class RegulationEntity
    {
        public string Reference { get; set; } = string.Empty;
        public double Relevance { get; set; }
    }

    public class SafetyFunctionEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Classification { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class ModificationTypeEntity
    {
        public string Type { get; set; } = string.Empty;
        public string RegulatoryPath { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }
    
    // New intelligent analysis models
    public class IntelligentAnalysisRequest
    {
        public string UserInput { get; set; } = string.Empty;
        public ModificationTravelerInput? StructuredInput { get; set; }
    }

    public class IntelligentChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string ConversationHistory { get; set; } = string.Empty;
    }

    public class IntelligentChatResponse
    {
        public string Response { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool ProcessedByGPT4 { get; set; }
    }

    public class ClassificationRequest
    {
        public string Description { get; set; } = string.Empty;
    }
}
