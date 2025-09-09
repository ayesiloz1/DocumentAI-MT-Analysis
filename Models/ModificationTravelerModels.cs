using Newtonsoft.Json;

namespace MTAnalyzer.Models
{
    public partial class ModificationTravelerInput
    {
        [JsonProperty("projectNumber")]
        public string ProjectNumber { get; set; } = string.Empty;

        [JsonProperty("projectType")]
        public string ProjectType { get; set; } = string.Empty;

        [JsonProperty("designAuthority")]
        public string DesignAuthority { get; set; } = string.Empty;

        [JsonProperty("problemDescription")]
        public string ProblemDescription { get; set; } = string.Empty;

        [JsonProperty("proposedSolution")]
        public string ProposedSolution { get; set; } = string.Empty;

        [JsonProperty("justification")]
        public string Justification { get; set; } = string.Empty;

        [JsonProperty("safetyClassification")]
        public string SafetyClassification { get; set; } = string.Empty;

        [JsonProperty("hazardCategory")]
        public string HazardCategory { get; set; } = string.Empty;

        [JsonProperty("designConstraints")]
        public List<string> DesignConstraints { get; set; } = new();

        [JsonProperty("requiredProcedures")]
        public List<string> RequiredProcedures { get; set; } = new();

        [JsonProperty("isTemporary")]
        public bool IsTemporary { get; set; }

        [JsonProperty("isPhysicalChange")]
        public bool IsPhysicalChange { get; set; }

        [JsonProperty("isIdenticalReplacement")]
        public bool IsIdenticalReplacement { get; set; }

        [JsonProperty("isDesignOutsideDA")]
        public bool IsDesignOutsideDA { get; set; }

        [JsonProperty("requiresNewProcedures")]
        public bool RequiresNewProcedures { get; set; }

        [JsonProperty("requiresMultipleDocuments")]
        public bool RequiresMultipleDocuments { get; set; }

        [JsonProperty("isSingleDiscipline")]
        public bool IsSingleDiscipline { get; set; }

        [JsonProperty("revisionsOutsideDA")]
        public bool RevisionsOutsideDA { get; set; }

        [JsonProperty("requiresSoftwareChange")]
        public bool RequiresSoftwareChange { get; set; }

        [JsonProperty("requiresHoistingRigging")]
        public bool RequiresHoistingRigging { get; set; }

        [JsonProperty("facilityChangePackageApplicable")]
        public bool FacilityChangePackageApplicable { get; set; }
    }

    public enum DesignType
    {
        TypeI,    // New Design
        TypeII,   // Modification
        TypeIII,  // Replacement
        TypeIV,   // Temporary
        TypeV     // Identical Replacement
    }

    public class DesignOutput
    {
        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;

        [JsonProperty("description")]
        public string Description { get; set; } = string.Empty;

        [JsonProperty("required")]
        public bool Required { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; } = "Pending";
    }

    public class ImpactedDocument
    {
        [JsonProperty("documentId")]
        public string DocumentId { get; set; } = string.Empty;

        [JsonProperty("documentType")]
        public string DocumentType { get; set; } = string.Empty;

        [JsonProperty("impactRationale")]
        public string ImpactRationale { get; set; } = string.Empty;

        [JsonProperty("requiresUpdate")]
        public bool RequiresUpdate { get; set; }

        [JsonProperty("suggestedReviewers")]
        public List<string> SuggestedReviewers { get; set; } = new();
    }
}

// Extension to add missing properties to ModificationTravelerInput
namespace MTAnalyzer.Models
{
    public partial class ModificationTravelerInput
    {
        [JsonProperty("modificationTitle")]
        public string ModificationTitle { get; set; } = string.Empty;

        [JsonProperty("systemsAffected")]
        public string SystemsAffected { get; set; } = string.Empty;

        [JsonProperty("equipmentType")]
        public string EquipmentType { get; set; } = string.Empty;

        [JsonProperty("designBasisDocumentsAffected")]
        public List<string>? DesignBasisDocumentsAffected { get; set; }

        [JsonProperty("qualityAssuranceRequirements")]
        public string QualityAssuranceRequirements { get; set; } = string.Empty;

        [JsonProperty("designVerificationMethod")]
        public string DesignVerificationMethod { get; set; } = string.Empty;
    }
}
