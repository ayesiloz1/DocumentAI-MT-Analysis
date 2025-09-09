using MTAnalyzer.Models;

namespace MTAnalyzer.Controllers
{
    public class MTAnalysisRequest
    {
        public string Text { get; set; } = string.Empty;
        public string? ProjectNumber { get; set; }
        public string? ProjectType { get; set; }
        public string? DesignAuthority { get; set; }
        public string? ProblemDescription { get; set; }
        public string? ProposedSolution { get; set; }
        public string? Justification { get; set; }
        public string? SafetyClassification { get; set; }
        public string? HazardCategory { get; set; }
        public List<string> DesignConstraints { get; set; } = new();
        public List<string> RequiredProcedures { get; set; } = new();
        public bool IsTemporary { get; set; }
        public bool IsPhysicalChange { get; set; }
        public bool IsIdenticalReplacement { get; set; }
        public bool IsDesignOutsideDA { get; set; }
        public bool RequiresNewProcedures { get; set; }
        public bool RequiresMultipleDocuments { get; set; }
        public bool IsSingleDiscipline { get; set; }
        public bool RevisionsOutsideDA { get; set; }
        public bool RequiresSoftwareChange { get; set; }
        public bool RequiresHoistingRigging { get; set; }
        public bool FacilityChangePackageApplicable { get; set; }
    }

    public class MTAnalysisResponse
    {
        public bool MtRequired { get; set; }
        public int DesignType { get; set; }
        public string MtRequiredReason { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string ProjectNumber { get; set; } = string.Empty;
        public List<string> MissingElements { get; set; } = new();
        public List<string> Inconsistencies { get; set; } = new();
        public List<string> SuggestedActions { get; set; } = new();
        public List<DesignOutput> ExpectedOutputs { get; set; } = new();
        public List<ImpactedDocument> ImpactedDocuments { get; set; } = new();
        public RiskAssessment RiskAssessment { get; set; } = new();
        public AttachmentAChecklist AttachmentAChecklist { get; set; } = new();
    }

    public class DesignOutput
    {
        public string OutputType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }

    public class ImpactedDocument
    {
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string ImpactLevel { get; set; } = string.Empty;
        public string RequiredAction { get; set; } = string.Empty;
    }

    public class RiskAssessment
    {
        public string OverallRisk { get; set; } = string.Empty;
        public string SafetyRisk { get; set; } = string.Empty;
        public string EnvironmentalRisk { get; set; } = string.Empty;
        public string OperationalRisk { get; set; } = string.Empty;
        public List<string> RiskFactors { get; set; } = new();
        public List<string> MitigationRecommendations { get; set; } = new();
    }
}
