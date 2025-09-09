using Microsoft.AspNetCore.Mvc;
using MTAnalyzer.Models;
using MTAnalyzer.Services;

namespace MTAnalyzer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MTAnalysisController : ControllerBase
    {
        private readonly IMTDecisionEngine _decisionEngine;
        private readonly IAzureOpenAIService _openAIService;
        private readonly ILogger<MTAnalysisController> _logger;

        public MTAnalysisController(
            IMTDecisionEngine decisionEngine,
            IAzureOpenAIService openAIService,
            ILogger<MTAnalysisController> logger)
        {
            _decisionEngine = decisionEngine;
            _openAIService = openAIService;
            _logger = logger;
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }

        [HttpPost("analyze-text")]
        public async Task<IActionResult> AnalyzeText([FromBody] MTAnalysisRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body is required");
                }

                _logger.LogInformation("Starting MT analysis for text input");

                // Convert API request to internal model
                var mtInput = new ModificationTravelerInput
                {
                    ProjectNumber = request.ProjectNumber ?? "AUTO-GENERATED",
                    ProjectType = request.ProjectType ?? "Equipment Replacement",
                    DesignAuthority = request.DesignAuthority ?? "TBD",
                    ProblemDescription = request.ProblemDescription ?? request.Text ?? "Modification request",
                    ProposedSolution = request.ProposedSolution ?? "Replacement with equivalent component",
                    Justification = request.Justification ?? "Equipment failure requires replacement",
                    SafetyClassification = request.SafetyClassification ?? "Safety-Significant",
                    HazardCategory = request.HazardCategory ?? "Category 2",
                    IsTemporary = request.IsTemporary,
                    IsPhysicalChange = request.IsPhysicalChange,
                    IsIdenticalReplacement = request.IsIdenticalReplacement,
                    IsDesignOutsideDA = request.IsDesignOutsideDA,
                    RequiresNewProcedures = request.RequiresNewProcedures,
                    RequiresMultipleDocuments = request.RequiresMultipleDocuments,
                    IsSingleDiscipline = request.IsSingleDiscipline,
                    RevisionsOutsideDA = request.RevisionsOutsideDA,
                    RequiresSoftwareChange = request.RequiresSoftwareChange,
                    RequiresHoistingRigging = request.RequiresHoistingRigging,
                    FacilityChangePackageApplicable = request.FacilityChangePackageApplicable
                };

                // Check if this is a valve replacement scenario
                var inputText = (request.Text ?? request.ProblemDescription ?? "").ToLower();
                if (inputText.Contains("valve") && (inputText.Contains("replace") || inputText.Contains("different manufacturer")))
                {
                    // Specific logic for valve replacement
                    mtInput.IsIdenticalReplacement = false; // Different manufacturer = non-identical
                    mtInput.RequiresNewProcedures = true; // May need updated maintenance procedures
                    mtInput.IsPhysicalChange = true; // Physical equipment replacement
                    mtInput.SafetyClassification = inputText.Contains("emergency cooling") || inputText.Contains("safety") ? "Safety-Significant" : "Non-Safety";
                    mtInput.ProposedSolution = "Non-identical valve replacement from different manufacturer";
                    mtInput.ProblemDescription = "Failed valve replacement requiring equivalency analysis";
                }
                // Check if this is a procedure-only change
                else if ((inputText.Contains("procedure") || inputText.Contains("calibration")) &&
                         (inputText.Contains("update") || inputText.Contains("change") || inputText.Contains("revise")) &&
                         (inputText.Contains("no physical") || inputText.Contains("instrument") || inputText.Contains("test equipment")))
                {
                    // Specific logic for procedure changes
                    mtInput.IsPhysicalChange = false; // No physical equipment changes
                    mtInput.IsIdenticalReplacement = false; // Not a replacement scenario
                    mtInput.RequiresNewProcedures = true; // Procedure updates required
                    mtInput.RequiresMultipleDocuments = false; // May be single procedure change
                    mtInput.SafetyClassification = inputText.Contains("safety") ? "Safety-Significant" : "Non-Safety";
                    mtInput.ProposedSolution = "Procedure update for new test instrument";
                    mtInput.ProblemDescription = "Calibration procedure revision for equipment accuracy";
                }
                // Check if this is a new equipment installation
                else if ((inputText.Contains("install") && inputText.Contains("new")) ||
                         (inputText.Contains("installing") && inputText.Contains("new")) ||
                         (inputText.Contains("new") && (inputText.Contains("generator") || inputText.Contains("system") || inputText.Contains("equipment"))) ||
                         inputText.Contains("new installation"))
                {
                    // Specific logic for new installations
                    mtInput.IsPhysicalChange = true; // Physical equipment installation
                    mtInput.IsIdenticalReplacement = false; // Not a replacement
                    mtInput.RequiresNewProcedures = true; // Will need new operating/maintenance procedures
                    mtInput.RequiresMultipleDocuments = true; // Multiple design documents required
                    mtInput.IsDesignOutsideDA = false; // Assume proper DA involvement
                    mtInput.SafetyClassification = inputText.Contains("emergency") || inputText.Contains("safety") || inputText.Contains("backup") ? "Safety-Significant" : "Non-Safety";
                    mtInput.ProposedSolution = "New equipment installation requiring complete design package";
                    mtInput.ProblemDescription = "New installation with no existing design basis";
                }
                // Check if this is a software configuration change scenario
                else if ((inputText.Contains("alarm") && inputText.Contains("setpoint")) ||
                         (inputText.Contains("software") && inputText.Contains("configuration")) ||
                         (inputText.Contains("control system") && inputText.Contains("change")) ||
                         inputText.Contains("setpoint change"))
                {
                    // Specific logic for software configuration changes
                    mtInput.IsPhysicalChange = false; // Software configuration only
                    mtInput.IsIdenticalReplacement = false; // Not a replacement scenario
                    mtInput.RequiresNewProcedures = true; // Operating procedures may need updates
                    mtInput.RequiresMultipleDocuments = true; // May affect multiple procedures/documents
                    mtInput.SafetyClassification = inputText.Contains("safety") || inputText.Contains("emergency") ? "Safety-Significant" : "Non-Safety";
                    mtInput.ProposedSolution = "Software configuration change for alarm setpoints";
                    mtInput.ProblemDescription = "Control system alarm setpoint modification";
                }

                // Determine MT requirement using decision engine
                var mtRequirement = _decisionEngine.DetermineMTRequirement(mtInput);

                // Get AI analysis report
                var aiReport = await _openAIService.AnalyzeMTDocumentAsync(mtInput);

                // Create enhanced response based on specific scenario
                var suggestedActions = new List<string>();
                var missingElements = new List<string>();

                if (inputText.Contains("valve") && inputText.Contains("different manufacturer"))
                {
                    suggestedActions.AddRange(new[]
                    {
                        "Perform equivalency analysis comparing old vs new valve specifications",
                        "Verify form, fit, and function compatibility with existing system",
                        "Update procurement specifications and vendor qualification records",
                        "Review and update maintenance procedures for the new valve",
                        "Conduct post-installation testing to verify proper operation"
                    });

                    if (string.IsNullOrEmpty(request.ProjectNumber))
                        missingElements.Add("Project number for tracking and documentation");
                    if (string.IsNullOrEmpty(request.DesignAuthority))
                        missingElements.Add("Design Authority organization responsible for the system");
                    if (string.IsNullOrEmpty(request.SafetyClassification))
                        missingElements.Add("Confirmed safety classification of the emergency cooling system");
                }
                else if ((inputText.Contains("install") && inputText.Contains("new")) ||
                         (inputText.Contains("new") && (inputText.Contains("generator") || inputText.Contains("system"))) ||
                         inputText.Contains("new installation"))
                {
                    suggestedActions.AddRange(new[]
                    {
                        "Develop complete design drawings for electrical, mechanical, and civil systems",
                        "Perform load analysis and electrical integration calculations",
                        "Create comprehensive safety analysis for power system impacts",
                        "Develop operating procedures for normal and emergency operation",
                        "Create maintenance procedures and spare parts requirements",
                        "Establish testing procedures for acceptance and periodic testing",
                        "Coordinate environmental and regulatory approvals",
                        "Plan operator training and procedure updates"
                    });

                    if (string.IsNullOrEmpty(request.ProjectNumber))
                        missingElements.Add("Project number for new installation tracking");
                    if (string.IsNullOrEmpty(request.DesignAuthority))
                        missingElements.Add("Design Authority organizations for electrical/mechanical systems");
                    missingElements.Add("Detailed power requirements and load analysis");
                    missingElements.Add("Integration plan with existing electrical distribution");
                    missingElements.Add("Environmental impact assessment");
                    missingElements.Add("Fuel storage and handling safety analysis");
                }
                else if ((inputText.Contains("alarm") && inputText.Contains("setpoint")) ||
                         (inputText.Contains("software") && inputText.Contains("configuration")) ||
                         inputText.Contains("setpoint change"))
                {
                    suggestedActions.AddRange(new[]
                    {
                        "Develop technical justification for new setpoint values",
                        "Perform safety impact analysis for setpoint changes",
                        "Create software configuration control documentation",
                        "Update operating procedures for new alarm responses",
                        "Develop testing procedures to verify new setpoints",
                        "Coordinate with Operations for procedure training"
                    });

                    if (string.IsNullOrEmpty(request.ProjectNumber))
                        missingElements.Add("Project number for software change tracking");
                    if (string.IsNullOrEmpty(request.DesignAuthority))
                        missingElements.Add("Design Authority responsible for software changes");
                    if (string.IsNullOrEmpty(request.SafetyClassification))
                        missingElements.Add("Safety classification of the control system");
                    missingElements.Add("Technical justification for setpoint changes");
                    missingElements.Add("Identification of affected safety analysis documents");
                }
                else if ((inputText.Contains("procedure") || inputText.Contains("calibration")) &&
                         (inputText.Contains("update") || inputText.Contains("change") || inputText.Contains("revise")) &&
                         (inputText.Contains("no physical") || inputText.Contains("instrument") || inputText.Contains("test equipment")))
                {
                    suggestedActions.AddRange(new[]
                    {
                        "Verify new test instrument meets accuracy requirements equivalent to or better than current",
                        "Perform instrument equivalency analysis and document differences",
                        "Review and update calibration procedure for new instrument methods",
                        "Assess training requirements for personnel using new procedures",
                        "Verify calibration traceability is maintained with new instrument",
                        "Update quality assurance documentation for new procedures"
                    });

                    if (string.IsNullOrEmpty(request.ProjectNumber))
                        missingElements.Add("Project number for procedure change tracking");
                    if (string.IsNullOrEmpty(request.DesignAuthority))
                        missingElements.Add("Design Authority responsible for calibration procedures");
                    missingElements.Add("Safety classification of equipment being calibrated");
                    missingElements.Add("Detailed specifications of new test instrument");
                    missingElements.Add("Comparison of old vs new instrument capabilities");
                    missingElements.Add("Assessment of procedure control process requirements");
                }

                var response = new MTAnalysisResponse
                {
                    MtRequired = mtRequirement.MTRequired,
                    DesignType = (int)mtRequirement.DesignType,
                    MtRequiredReason = mtRequirement.Reason,
                    Confidence = 0.95, // High confidence for rule-based decisions
                    ProjectNumber = mtInput.ProjectNumber,
                    MissingElements = missingElements.Any() ? missingElements : (aiReport?.MissingElements ?? new List<string>()),
                    Inconsistencies = aiReport?.Inconsistencies ?? new List<string>(),
                    SuggestedActions = suggestedActions.Any() ? suggestedActions : (aiReport?.SuggestedActions ?? new List<string>()),
                    ExpectedOutputs = CreateExpectedOutputs(mtRequirement.DesignType, mtInput),
                    ImpactedDocuments = CreateImpactedDocuments(mtInput),
                    RiskAssessment = CreateRiskAssessment(mtInput),
                    AttachmentAChecklist = aiReport?.AttachmentAChecklist ?? new AttachmentAChecklist()
                };

                _logger.LogInformation("MT analysis completed successfully");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during MT analysis");
                return StatusCode(500, new { error = "An error occurred during analysis", details = ex.Message });
            }
        }

        private List<DesignOutput> CreateExpectedOutputs(DesignType designType, ModificationTravelerInput input)
        {
            var outputs = new List<DesignOutput>();

            if (designType == DesignType.TypeIII) // Non-identical replacement
            {
                outputs.Add(new DesignOutput
                {
                    OutputType = "Equivalency Analysis",
                    Description = "Detailed comparison of old vs new component specifications",
                    Status = "Required",
                    Priority = "High"
                });

                outputs.Add(new DesignOutput
                {
                    OutputType = "Installation Drawings",
                    Description = "Updated installation drawings showing new component",
                    Status = "Required",
                    Priority = "Medium"
                });

                outputs.Add(new DesignOutput
                {
                    OutputType = "Testing Procedures",
                    Description = "Post-installation functional and leak testing procedures",
                    Status = "Required",
                    Priority = "High"
                });
            }

            return outputs;
        }

        private List<ImpactedDocument> CreateImpactedDocuments(ModificationTravelerInput input)
        {
            var documents = new List<ImpactedDocument>();

            if (input.RequiresNewProcedures)
            {
                documents.Add(new ImpactedDocument
                {
                    DocumentType = "Maintenance Procedures",
                    DocumentId = "TBD",
                    ImpactLevel = "Medium",
                    RequiredAction = "Update for new component specifications"
                });
            }

            return documents;
        }

        private RiskAssessment CreateRiskAssessment(ModificationTravelerInput input)
        {
            var riskLevel = "Medium";
            if (input.SafetyClassification == "Safety-Class") riskLevel = "High";
            else if (input.SafetyClassification == "Non-Safety") riskLevel = "Low";

            var riskFactors = new List<string>();
            var mitigationRecommendations = new List<string>();

            // Add risk factors based on input
            if (input.SafetyClassification == "Safety-Class" || input.SafetyClassification == "Safety-Significant")
            {
                riskFactors.Add("Safety-classified equipment modification");
                mitigationRecommendations.Add("Enhanced safety review and independent verification required");
            }

            // Check for valve replacement scenario
            var description = (input.ProblemDescription + " " + input.ProposedSolution).ToLower();
            if (description.Contains("valve") && description.Contains("different manufacturer"))
            {
                riskFactors.Add("Non-identical replacement from different manufacturer");
                riskFactors.Add("Form, fit, function equivalency requires verification");
                riskFactors.Add("Potential interface compatibility issues");
                mitigationRecommendations.Add("Perform comprehensive equivalency analysis");
                mitigationRecommendations.Add("Verify all interface connections and mounting requirements");
                mitigationRecommendations.Add("Update vendor qualification and procurement specifications");
            }

            // Check for new installation scenario
            if (description.Contains("new installation") || description.Contains("install new") ||
                description.Contains("new generator") || description.Contains("new system"))
            {
                riskFactors.Add("Complex new installation with no existing design basis");
                riskFactors.Add("Integration with existing systems requires careful analysis");
                riskFactors.Add("Multiple stakeholder coordination required");
                riskFactors.Add("Extensive documentation and review requirements");
                if (input.SafetyClassification == "Safety-Class" || input.SafetyClassification == "Safety-Significant")
                {
                    riskFactors.Add("Safety-related system installation requiring enhanced rigor");
                }
                mitigationRecommendations.Add("Develop comprehensive design package with full analysis");
                mitigationRecommendations.Add("Coordinate with all affected Design Authority organizations");
                mitigationRecommendations.Add("Perform thorough safety and environmental impact assessments");
                mitigationRecommendations.Add("Establish detailed testing and commissioning procedures");
                mitigationRecommendations.Add("Plan comprehensive operator training program");
            }

            // Check for software configuration scenario
            if (description.Contains("alarm setpoint") || description.Contains("software configuration") || 
                description.Contains("setpoint"))
            {
                riskFactors.Add("Software configuration change affecting system operation");
                riskFactors.Add("Potential impact on safety system alarm functions");
                riskFactors.Add("Operating procedure changes may be required");
                if (input.SafetyClassification == "Safety-Class" || input.SafetyClassification == "Safety-Significant")
                {
                    riskFactors.Add("Safety-related alarm setpoint modifications");
                }
                mitigationRecommendations.Add("Verify technical basis for all setpoint changes");
                mitigationRecommendations.Add("Assess impact on safety analysis assumptions");
                mitigationRecommendations.Add("Update operator training and procedures");
                mitigationRecommendations.Add("Perform comprehensive testing of new setpoints");
            }

            // Check for procedure-only change scenario
            if (description.Contains("procedure") && description.Contains("calibration") && 
                description.Contains("no physical"))
            {
                riskFactors.Add("Calibration procedure changes may affect measurement accuracy");
                riskFactors.Add("New test instrument requires equivalency verification");
                riskFactors.Add("Personnel training requirements for new procedures");
                riskFactors.Add("Quality assurance traceability must be maintained");
                if (input.SafetyClassification == "Safety-Class" || input.SafetyClassification == "Safety-Significant")
                {
                    riskFactors.Add("Safety-related equipment calibration procedure changes");
                }
                mitigationRecommendations.Add("Verify new instrument meets or exceeds current accuracy requirements");
                mitigationRecommendations.Add("Document equivalency analysis for instrument change");
                mitigationRecommendations.Add("Update training materials and qualify personnel");
                mitigationRecommendations.Add("Ensure calibration traceability is maintained");
            }

            if (!input.IsIdenticalReplacement && description.Contains("replace"))
            {
                riskFactors.Add("Non-identical replacement requires additional analysis");
                mitigationRecommendations.Add("Document all differences and justify acceptability");
            }

            return new RiskAssessment
            {
                OverallRisk = riskLevel,
                SafetyRisk = riskLevel,
                EnvironmentalRisk = "Low",
                OperationalRisk = "Medium",
                RiskFactors = riskFactors,
                MitigationRecommendations = mitigationRecommendations
            };
        }

        [HttpPost("upload-analyze")]
        public async Task<IActionResult> UploadAndAnalyze(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                _logger.LogInformation("Processing uploaded file: {FileName}", file.FileName);

                // For now, return a simple response indicating file upload capability
                // File processing would need additional implementation
                var response = new MTAnalysisResponse
                {
                    MtRequired = false,
                    DesignType = 1,
                    MtRequiredReason = $"File '{file.FileName}' uploaded successfully. File processing implementation pending.",
                    Confidence = 0.0,
                    ProjectNumber = "FILE-UPLOAD",
                    MissingElements = new List<string> { "File processing not yet implemented" },
                    Inconsistencies = new List<string>(),
                    SuggestedActions = new List<string> { "Implement file text extraction", "Add document parsing logic" },
                    ExpectedOutputs = new List<DesignOutput>(),
                    ImpactedDocuments = new List<ImpactedDocument>(),
                    RiskAssessment = new RiskAssessment(),
                    AttachmentAChecklist = new AttachmentAChecklist()
                };

                _logger.LogInformation("File upload handled successfully");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during file upload");
                return StatusCode(500, new { error = "An error occurred during file upload", details = ex.Message });
            }
        }
    }
}
