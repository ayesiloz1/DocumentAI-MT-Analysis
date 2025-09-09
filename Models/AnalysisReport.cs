using Newtonsoft.Json;

namespace MTAnalyzer.Models
{
    public class MTAnalysisReport
    {
        [JsonProperty("analysisId")]
        public string AnalysisId { get; set; } = Guid.NewGuid().ToString();

        [JsonProperty("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonProperty("projectNumber")]
        public string ProjectNumber { get; set; } = string.Empty;

        [JsonProperty("mtRequired")]
        public bool MTRequired { get; set; }

        [JsonProperty("mtRequiredReason")]
        public string MTRequiredReason { get; set; } = string.Empty;

        [JsonProperty("designType")]
        public DesignType DesignType { get; set; }

        [JsonProperty("designInputs")]
        public DesignInputsSummary DesignInputs { get; set; } = new();

        [JsonProperty("expectedOutputs")]
        public List<DesignOutput> ExpectedOutputs { get; set; } = new();

        [JsonProperty("impactedDocuments")]
        public List<ImpactedDocument> ImpactedDocuments { get; set; } = new();

        [JsonProperty("missingElements")]
        public List<string> MissingElements { get; set; } = new();

        [JsonProperty("inconsistencies")]
        public List<string> Inconsistencies { get; set; } = new();

        [JsonProperty("suggestedActions")]
        public List<string> SuggestedActions { get; set; } = new();

        [JsonProperty("attachmentAChecklist")]
        public AttachmentAChecklist AttachmentAChecklist { get; set; } = new();

        [JsonProperty("riskAssessment")]
        public RiskAssessment RiskAssessment { get; set; } = new();

        [JsonProperty("confidence")]
        public double Confidence { get; set; }
    }

    public class DesignInputsSummary
    {
        [JsonProperty("problemStatement")]
        public string ProblemStatement { get; set; } = string.Empty;

        [JsonProperty("proposedSolution")]
        public string ProposedSolution { get; set; } = string.Empty;

        [JsonProperty("designConstraints")]
        public List<string> DesignConstraints { get; set; } = new();

        [JsonProperty("safetyRequirements")]
        public List<string> SafetyRequirements { get; set; } = new();

        [JsonProperty("environmentalConsiderations")]
        public List<string> EnvironmentalConsiderations { get; set; } = new();

        [JsonProperty("operationalImpacts")]
        public List<string> OperationalImpacts { get; set; } = new();
    }

    public class DesignInput
    {
        [JsonProperty("documentType")]
        public string DocumentType { get; set; } = string.Empty;

        [JsonProperty("documentNumber")]
        public string DocumentNumber { get; set; } = string.Empty;

        [JsonProperty("title")]
        public string Title { get; set; } = string.Empty;
    }

    public class AttachmentAChecklist
    {
        [JsonProperty("a1DesignOutputCheck")]
        public ChecklistSection A1DesignOutputCheck { get; set; } = new();

        [JsonProperty("a2EngineeringImpacts")]
        public ChecklistSection A2EngineeringImpacts { get; set; } = new();

        [JsonProperty("a3NonEngineeringImpacts")]
        public ChecklistSection A3NonEngineeringImpacts { get; set; } = new();

        [JsonProperty("a4SystemAcceptability")]
        public ChecklistSection A4SystemAcceptability { get; set; } = new();

        [JsonProperty("a5InterfaceReviews")]
        public ChecklistSection A5InterfaceReviews { get; set; } = new();
    }

    public class ChecklistSection
    {
        [JsonProperty("items")]
        public List<ChecklistItem> Items { get; set; } = new();

        [JsonProperty("completionPercentage")]
        public double CompletionPercentage { get; set; }

        [JsonProperty("riskLevel")]
        public string RiskLevel { get; set; } = "Low";
    }

    public class ChecklistItem
    {
        [JsonProperty("description")]
        public string Description { get; set; } = string.Empty;

        [JsonProperty("status")]
        public string Status { get; set; } = "Not Reviewed"; // Not Reviewed, Complete, Missing, N/A

        [JsonProperty("comments")]
        public string Comments { get; set; } = string.Empty;

        [JsonProperty("required")]
        public bool Required { get; set; }
    }

    public class RiskAssessment
    {
        [JsonProperty("overallRisk")]
        public string OverallRisk { get; set; } = "Low";

        [JsonProperty("safetyRisk")]
        public string SafetyRisk { get; set; } = "Low";

        [JsonProperty("environmentalRisk")]
        public string EnvironmentalRisk { get; set; } = "Low";

        [JsonProperty("operationalRisk")]
        public string OperationalRisk { get; set; } = "Low";

        [JsonProperty("riskFactors")]
        public List<string> RiskFactors { get; set; } = new();

        [JsonProperty("mitigationRecommendations")]
        public List<string> MitigationRecommendations { get; set; } = new();
    }
}
