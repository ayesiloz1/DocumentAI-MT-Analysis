using Azure.AI.OpenAI;
using Azure;
using MTAnalyzer.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace MTAnalyzer.Services
{
    public interface IAzureOpenAIService
    {
        Task<MTAnalysisReport> AnalyzeMTDocumentAsync(ModificationTravelerInput input);
        Task<string> ExtractInformationFromTextAsync(string documentText, string extractionPrompt);
    }

    public class AzureOpenAIService : IAzureOpenAIService
    {
        private readonly OpenAIClient _openAIClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AzureOpenAIService> _logger;
        private readonly IMTDecisionEngine _decisionEngine;

        public AzureOpenAIService(IConfiguration configuration, ILogger<AzureOpenAIService> logger, IMTDecisionEngine decisionEngine)
        {
            _configuration = configuration;
            _logger = logger;
            _decisionEngine = decisionEngine;

            var endpoint = _configuration["AzureOpenAI:Endpoint"];
            var apiKey = _configuration["AzureOpenAI:ApiKey"];

            _openAIClient = new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
        }

        public async Task<MTAnalysisReport> AnalyzeMTDocumentAsync(ModificationTravelerInput input)
        {
            try
            {
                // Get MT requirement determination from decision engine
                var (mtRequired, reason, designType) = _decisionEngine.DetermineMTRequirement(input);

                // Create the analysis report
                var report = new MTAnalysisReport
                {
                    ProjectNumber = input.ProjectNumber,
                    MTRequired = mtRequired,
                    MTRequiredReason = reason,
                    DesignType = designType,
                    DesignInputs = ExtractDesignInputs(input)
                };

                // Use Azure OpenAI to enhance the analysis
                await EnhanceAnalysisWithAIAsync(report, input);

                // Generate expected outputs based on design type
                report.ExpectedOutputs = GenerateExpectedOutputs(designType, input);

                // Identify impacted documents
                report.ImpactedDocuments = await IdentifyImpactedDocumentsAsync(input);

                // Generate Attachment A checklist
                report.AttachmentAChecklist = await GenerateAttachmentAChecklistAsync(input);

                // Perform risk assessment
                report.RiskAssessment = await PerformRiskAssessmentAsync(input);

                // Calculate overall confidence
                report.Confidence = CalculateConfidence(report);

                return report;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing MT document");
                throw;
            }
        }

        public async Task<string> ExtractInformationFromTextAsync(string documentText, string extractionPrompt)
        {
            try
            {
                var deploymentName = _configuration["AzureOpenAI:DeploymentName"];
                
                var systemPrompt = "You are an expert document analyzer specializing in engineering modification documents. Extract the requested information accurately and completely.";
                
                var chatCompletionsOptions = new ChatCompletionsOptions()
                {
                    DeploymentName = deploymentName,
                    Messages =
                    {
                        new ChatRequestSystemMessage(systemPrompt),
                        new ChatRequestUserMessage($"Document Text: {documentText}\n\nExtraction Request: {extractionPrompt}")
                    },
                    MaxTokens = 1000,
                    Temperature = 0.1f
                };

                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                return response.Value.Choices[0].Message.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting information from text");
                throw;
            }
        }

        private async Task EnhanceAnalysisWithAIAsync(MTAnalysisReport report, ModificationTravelerInput input)
        {
            var prompt = $@"
Analyze this modification traveler input and identify:
1. Missing required elements
2. Potential inconsistencies
3. Suggested next actions for the Design Authority

Input Details:
- Project: {input.ProjectNumber}
- Problem: {input.ProblemDescription}
- Solution: {input.ProposedSolution}
- Safety Classification: {input.SafetyClassification}
- Hazard Category: {input.HazardCategory}

Provide analysis in JSON format with arrays for missingElements, inconsistencies, and suggestedActions.";

            try
            {
                var aiResponse = await ExtractInformationFromTextAsync("", prompt);
                
                // Parse AI response and populate report fields
                var analysisData = JsonConvert.DeserializeObject<dynamic>(aiResponse);
                
                if (analysisData?.missingElements != null)
                {
                    report.MissingElements = analysisData.missingElements.ToObject<List<string>>() ?? new List<string>();
                }
                
                if (analysisData?.inconsistencies != null)
                {
                    report.Inconsistencies = analysisData.inconsistencies.ToObject<List<string>>() ?? new List<string>();
                }
                
                if (analysisData?.suggestedActions != null)
                {
                    report.SuggestedActions = analysisData.suggestedActions.ToObject<List<string>>() ?? new List<string>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not parse AI enhancement response, using defaults");
                
                // Fallback analysis
                report.MissingElements = PerformBasicMissingElementsCheck(input);
                report.Inconsistencies = PerformBasicInconsistencyCheck(input);
                report.SuggestedActions = GenerateBasicSuggestedActions(input);
            }
        }

        private DesignInputsSummary ExtractDesignInputs(ModificationTravelerInput input)
        {
            return new DesignInputsSummary
            {
                ProblemStatement = input.ProblemDescription,
                ProposedSolution = input.ProposedSolution,
                DesignConstraints = input.DesignConstraints,
                SafetyRequirements = ExtractSafetyRequirements(input),
                EnvironmentalConsiderations = ExtractEnvironmentalConsiderations(input),
                OperationalImpacts = ExtractOperationalImpacts(input)
            };
        }

        private List<DesignOutput> GenerateExpectedOutputs(DesignType designType, ModificationTravelerInput input)
        {
            var outputs = new List<DesignOutput>();

            // Base outputs for all design types
            outputs.Add(new DesignOutput { Type = "Design Drawings", Description = "Technical drawings and specifications", Required = true });
            outputs.Add(new DesignOutput { Type = "Calculations", Description = "Engineering calculations and analysis", Required = true });

            // Type-specific outputs
            switch (designType)
            {
                case DesignType.TypeI: // New Design
                    outputs.Add(new DesignOutput { Type = "PrHA", Description = "Process Hazard Analysis", Required = true });
                    outputs.Add(new DesignOutput { Type = "IQRPE", Description = "Installation, Qualification, Readiness, Performance Evaluation", Required = true });
                    outputs.Add(new DesignOutput { Type = "Environmental Assessment", Description = "Environmental impact evaluation", Required = true });
                    break;

                case DesignType.TypeII: // Modification
                    outputs.Add(new DesignOutput { Type = "Impact Analysis", Description = "Analysis of system impacts", Required = true });
                    outputs.Add(new DesignOutput { Type = "Procedure Updates", Description = "Updated operating procedures", Required = input.RequiresNewProcedures });
                    break;

                case DesignType.TypeIII: // Replacement
                    outputs.Add(new DesignOutput { Type = "Compatibility Analysis", Description = "Component compatibility verification", Required = true });
                    outputs.Add(new DesignOutput { Type = "Installation Plan", Description = "Replacement installation procedures", Required = true });
                    break;

                case DesignType.TypeIV: // Temporary
                    outputs.Add(new DesignOutput { Type = "Temporary Installation Plan", Description = "Temporary modification procedures", Required = true });
                    outputs.Add(new DesignOutput { Type = "Restoration Plan", Description = "Plan to restore original configuration", Required = true });
                    break;

                case DesignType.TypeV: // Identical Replacement
                    outputs.Add(new DesignOutput { Type = "Verification Documentation", Description = "Documentation proving identical replacement", Required = true });
                    break;
            }

            // Safety-critical outputs
            if (!string.IsNullOrEmpty(input.SafetyClassification) && input.SafetyClassification != "Non-Safety")
            {
                outputs.Add(new DesignOutput { Type = "Safety Analysis", Description = "Safety system impact analysis", Required = true });
            }

            // Software-related outputs
            if (input.RequiresSoftwareChange)
            {
                outputs.Add(new DesignOutput { Type = "Software Design Document", Description = "Software modification specifications", Required = true });
                outputs.Add(new DesignOutput { Type = "Testing Plan", Description = "Software testing and validation plan", Required = true });
            }

            return outputs;
        }

        private async Task<List<ImpactedDocument>> IdentifyImpactedDocumentsAsync(ModificationTravelerInput input)
        {
            var impactedDocs = new List<ImpactedDocument>();

            // Standard impacted documents based on change type
            if (input.IsPhysicalChange)
            {
                impactedDocs.Add(new ImpactedDocument
                {
                    DocumentType = "P&ID",
                    ImpactRationale = "Physical changes may affect piping and instrumentation",
                    RequiresUpdate = true,
                    SuggestedReviewers = new List<string> { "Process Engineering", "Instrumentation & Controls" }
                });

                impactedDocs.Add(new ImpactedDocument
                {
                    DocumentType = "System Description",
                    ImpactRationale = "System configuration changes",
                    RequiresUpdate = true,
                    SuggestedReviewers = new List<string> { "System Engineering" }
                });
            }

            if (input.RequiresNewProcedures)
            {
                impactedDocs.Add(new ImpactedDocument
                {
                    DocumentType = "Operating Procedures",
                    ImpactRationale = "New procedures required for operation",
                    RequiresUpdate = true,
                    SuggestedReviewers = new List<string> { "Operations", "Training" }
                });

                impactedDocs.Add(new ImpactedDocument
                {
                    DocumentType = "Maintenance Procedures",
                    ImpactRationale = "Maintenance activities may be affected",
                    RequiresUpdate = true,
                    SuggestedReviewers = new List<string> { "Maintenance", "Engineering" }
                });
            }

            if (!string.IsNullOrEmpty(input.SafetyClassification) && input.SafetyClassification != "Non-Safety")
            {
                impactedDocs.Add(new ImpactedDocument
                {
                    DocumentType = "Safety Analysis Report",
                    ImpactRationale = "Safety-related changes require SAR update",
                    RequiresUpdate = true,
                    SuggestedReviewers = new List<string> { "Nuclear Safety", "Regulatory Affairs" }
                });
            }

            return impactedDocs;
        }

        private async Task<AttachmentAChecklist> GenerateAttachmentAChecklistAsync(ModificationTravelerInput input)
        {
            var checklist = new AttachmentAChecklist();

            // A.1 - Design Output Check
            checklist.A1DesignOutputCheck = new ChecklistSection
            {
                Items = new List<ChecklistItem>
                {
                    new ChecklistItem { Description = "Design drawings complete and approved", Required = true },
                    new ChecklistItem { Description = "Calculations verified and checked", Required = true },
                    new ChecklistItem { Description = "Specifications properly defined", Required = true },
                    new ChecklistItem { Description = "Design standards compliance verified", Required = true }
                }
            };

            // A.2 - Engineering Impacts
            checklist.A2EngineeringImpacts = new ChecklistSection
            {
                Items = new List<ChecklistItem>
                {
                    new ChecklistItem { Description = "Structural impacts assessed", Required = input.IsPhysicalChange },
                    new ChecklistItem { Description = "Electrical system impacts evaluated", Required = input.IsPhysicalChange },
                    new ChecklistItem { Description = "Mechanical system compatibility verified", Required = input.IsPhysicalChange },
                    new ChecklistItem { Description = "Interface compatibility confirmed", Required = true }
                }
            };

            // A.3 - Non-Engineering Impacts
            checklist.A3NonEngineeringImpacts = new ChecklistSection
            {
                Items = new List<ChecklistItem>
                {
                    new ChecklistItem { Description = "Operations procedures updated", Required = input.RequiresNewProcedures },
                    new ChecklistItem { Description = "Training requirements identified", Required = input.RequiresNewProcedures },
                    new ChecklistItem { Description = "Maintenance impacts assessed", Required = true },
                    new ChecklistItem { Description = "Environmental compliance verified", Required = true }
                }
            };

            // A.4 - System Acceptability
            checklist.A4SystemAcceptability = new ChecklistSection
            {
                Items = new List<ChecklistItem>
                {
                    new ChecklistItem { Description = "Performance requirements met", Required = true },
                    new ChecklistItem { Description = "Safety requirements satisfied", Required = !string.IsNullOrEmpty(input.SafetyClassification) },
                    new ChecklistItem { Description = "Regulatory compliance confirmed", Required = true },
                    new ChecklistItem { Description = "Quality standards met", Required = true }
                }
            };

            // A.5 - Interface Reviews
            checklist.A5InterfaceReviews = new ChecklistSection
            {
                Items = new List<ChecklistItem>
                {
                    new ChecklistItem { Description = "System interfaces identified", Required = true },
                    new ChecklistItem { Description = "Interface compatibility verified", Required = true },
                    new ChecklistItem { Description = "Communication protocols defined", Required = input.RequiresSoftwareChange },
                    new ChecklistItem { Description = "Integration testing planned", Required = input.RequiresSoftwareChange }
                }
            };

            return checklist;
        }

        private async Task<RiskAssessment> PerformRiskAssessmentAsync(ModificationTravelerInput input)
        {
            var riskAssessment = new RiskAssessment();
            var riskFactors = new List<string>();
            var mitigations = new List<string>();

            // Safety risk assessment
            if (!string.IsNullOrEmpty(input.SafetyClassification))
            {
                switch (input.SafetyClassification.ToUpper())
                {
                    case "SAFETY-SIGNIFICANT":
                        riskAssessment.SafetyRisk = "Medium";
                        riskFactors.Add("Safety-significant system modification");
                        mitigations.Add("Comprehensive safety analysis required");
                        break;
                    case "SAFETY-CLASS":
                        riskAssessment.SafetyRisk = "High";
                        riskFactors.Add("Safety-class system modification");
                        mitigations.Add("Rigorous safety review and approval process");
                        break;
                    default:
                        riskAssessment.SafetyRisk = "Low";
                        break;
                }
            }

            // Environmental risk assessment
            if (input.IsPhysicalChange)
            {
                riskAssessment.EnvironmentalRisk = "Medium";
                riskFactors.Add("Physical changes may have environmental impacts");
                mitigations.Add("Environmental assessment and compliance review");
            }

            // Operational risk assessment
            if (input.RequiresNewProcedures || input.RequiresSoftwareChange)
            {
                riskAssessment.OperationalRisk = "Medium";
                riskFactors.Add("Operational procedures or software changes required");
                mitigations.Add("Comprehensive training and procedure validation");
            }

            // Overall risk calculation
            var risks = new[] { riskAssessment.SafetyRisk, riskAssessment.EnvironmentalRisk, riskAssessment.OperationalRisk };
            if (risks.Any(r => r == "High"))
                riskAssessment.OverallRisk = "High";
            else if (risks.Any(r => r == "Medium"))
                riskAssessment.OverallRisk = "Medium";
            else
                riskAssessment.OverallRisk = "Low";

            riskAssessment.RiskFactors = riskFactors;
            riskAssessment.MitigationRecommendations = mitigations;

            return riskAssessment;
        }

        private double CalculateConfidence(MTAnalysisReport report)
        {
            // Remove hardcoded confidence logic - should be dynamic based on actual analysis quality
            double confidence = 0.5; // Neutral base confidence

            // TODO: Implement proper confidence assessment based on analysis quality
            // rather than hardcoded field presence checks

            return Math.Max(0.0, Math.Min(1.0, confidence));
        }

        private List<string> ExtractSafetyRequirements(ModificationTravelerInput input)
        {
            var requirements = new List<string>();
            
            if (!string.IsNullOrEmpty(input.SafetyClassification))
            {
                requirements.Add($"Safety Classification: {input.SafetyClassification}");
            }
            
            if (!string.IsNullOrEmpty(input.HazardCategory))
            {
                requirements.Add($"Hazard Category: {input.HazardCategory}");
            }

            return requirements;
        }

        private List<string> ExtractEnvironmentalConsiderations(ModificationTravelerInput input)
        {
            var considerations = new List<string>();
            
            if (input.IsPhysicalChange)
            {
                considerations.Add("Physical modification may require environmental review");
                considerations.Add("Waste generation and disposal considerations");
            }

            return considerations;
        }

        private List<string> ExtractOperationalImpacts(ModificationTravelerInput input)
        {
            var impacts = new List<string>();
            
            if (input.RequiresNewProcedures)
            {
                impacts.Add("New operational procedures required");
                impacts.Add("Training for operators and maintenance staff");
            }
            
            if (input.RequiresSoftwareChange)
            {
                impacts.Add("Software system changes affecting operations");
            }

            return impacts;
        }

        private List<string> PerformBasicMissingElementsCheck(ModificationTravelerInput input)
        {
            var missing = new List<string>();
            
            if (string.IsNullOrEmpty(input.ProjectNumber))
                missing.Add("Project Number is required");
            
            if (string.IsNullOrEmpty(input.ProblemDescription))
                missing.Add("Problem Description is required");
            
            if (string.IsNullOrEmpty(input.ProposedSolution))
                missing.Add("Proposed Solution is required");
            
            if (string.IsNullOrEmpty(input.DesignAuthority))
                missing.Add("Design Authority assignment is required");

            return missing;
        }

        private List<string> PerformBasicInconsistencyCheck(ModificationTravelerInput input)
        {
            var inconsistencies = new List<string>();
            
            if (input.IsTemporary && input.RequiresMultipleDocuments)
                inconsistencies.Add("Temporary changes typically should not require multiple design documents");
            
            if (input.IsIdenticalReplacement && input.RequiresNewProcedures)
                inconsistencies.Add("Identical replacements typically should not require new procedures");

            return inconsistencies;
        }

        private List<string> GenerateBasicSuggestedActions(ModificationTravelerInput input)
        {
            var actions = new List<string>();
            
            actions.Add("Review and validate all input information");
            actions.Add("Coordinate with Design Authority for approval");
            
            // Determine MT requirement using decision engine
            var (mtRequired, _, _) = _decisionEngine.DetermineMTRequirement(input);
            if (mtRequired)
            {
                actions.Add("Proceed with Modification Traveler process per Section 4.1");
                actions.Add("Identify and engage all required reviewers");
            }
            
            actions.Add("Ensure all required design outputs are planned and scheduled");

            return actions;
        }
    }
}
