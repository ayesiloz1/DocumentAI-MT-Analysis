using System.Text.Json.Serialization;

namespace MTAnalyzer.Models
{
    public class DocumentAnalysisRequest
    {
        public IFormFile? PdfFile { get; set; }
        public string? DocumentText { get; set; }
        public string? DocumentType { get; set; } = "general";
        public bool PerformGrammarCheck { get; set; } = true;
        public bool PerformStyleCheck { get; set; } = true;
        public bool PerformTechnicalReview { get; set; } = true;
        public bool PerformComplianceCheck { get; set; } = false;
    }

    public class DocumentAnalysisResult
    {
        public string DocumentId { get; set; } = Guid.NewGuid().ToString();
        public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;
        public DocumentMetadata Metadata { get; set; } = new();
        public OverallQualityScore QualityScore { get; set; } = new();
        public GrammarAnalysis Grammar { get; set; } = new();
        public StyleAnalysis Style { get; set; } = new();
        public TechnicalAnalysis Technical { get; set; } = new();
        public ComplianceAnalysis? Compliance { get; set; }
        public List<ImprovementSuggestion> Suggestions { get; set; } = new();
        public string Summary { get; set; } = string.Empty;
        public bool IsAnalysisSuccessful { get; set; } = true;
        public string? ErrorMessage { get; set; }
    }

    public class DocumentMetadata
    {
        public string FileName { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int PageCount { get; set; }
        public int WordCount { get; set; }
        public int CharacterCount { get; set; }
        public int ParagraphCount { get; set; }
        public int SentenceCount { get; set; }
        public double ReadabilityScore { get; set; }
        public string ReadabilityLevel { get; set; } = string.Empty;
    }

    public class OverallQualityScore
    {
        public double Overall { get; set; } // 0-100
        public double Grammar { get; set; } // 0-100
        public double Style { get; set; } // 0-100
        public double Clarity { get; set; } // 0-100
        public double Technical { get; set; } // 0-100
        public double Compliance { get; set; } // 0-100
        public QualityRating Rating { get; set; } = QualityRating.Unknown;
        public string Explanation { get; set; } = string.Empty;
    }

    public class GrammarAnalysis
    {
        public int TotalIssues { get; set; }
        public List<GrammarIssue> Issues { get; set; } = new();
        public Dictionary<string, int> IssueTypeFrequency { get; set; } = new();
        public double AccuracyScore { get; set; } // 0-100
    }

    public class GrammarIssue
    {
        public string Type { get; set; } = string.Empty; // "spelling", "grammar", "punctuation"
        public string Description { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public string Suggestion { get; set; } = string.Empty;
        public int StartPosition { get; set; }
        public int Length { get; set; }
        public Severity Severity { get; set; } = Severity.Low;
        public double Confidence { get; set; } // 0-100
    }

    public class StyleAnalysis
    {
        public double ClarityScore { get; set; } // 0-100
        public double ConsistencyScore { get; set; } // 0-100
        public double ConcisionScore { get; set; } // 0-100
        public double ProfessionalismScore { get; set; } // 0-100
        public List<StyleIssue> Issues { get; set; } = new();
        public WritingStatistics Statistics { get; set; } = new();
    }

    public class StyleIssue
    {
        public string Type { get; set; } = string.Empty; // "wordiness", "passive_voice", "tone", "consistency"
        public string Description { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public string Suggestion { get; set; } = string.Empty;
        public Severity Severity { get; set; } = Severity.Low;
    }

    public class WritingStatistics
    {
        public double AverageSentenceLength { get; set; }
        public double AverageWordsPerParagraph { get; set; }
        public int PassiveVoiceCount { get; set; }
        public int ComplexSentenceCount { get; set; }
        public Dictionary<string, int> WordFrequency { get; set; } = new();
        public List<string> TechnicalTerms { get; set; } = new();
    }

    public class TechnicalAnalysis
    {
        public double TechnicalAccuracyScore { get; set; } // 0-100
        public double TerminologyConsistencyScore { get; set; } // 0-100
        public double StructureScore { get; set; } // 0-100
        public List<TechnicalIssue> Issues { get; set; } = new();
        public List<string> IdentifiedStandards { get; set; } = new();
        public List<string> TechnicalTerms { get; set; } = new();
        public bool HasProperTechnicalStructure { get; set; }
    }

    public class TechnicalIssue
    {
        public string Type { get; set; } = string.Empty; // "terminology", "structure", "standards", "accuracy"
        public string Description { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public string Suggestion { get; set; } = string.Empty;
        public Severity Severity { get; set; } = Severity.Low;
        public List<string> RelatedStandards { get; set; } = new();
    }

    public class ComplianceAnalysis
    {
        public string ComplianceFramework { get; set; } = string.Empty; // "Nuclear", "ISO", "IEEE", etc.
        public double ComplianceScore { get; set; } // 0-100
        public List<ComplianceIssue> Issues { get; set; } = new();
        public List<string> RequiredElements { get; set; } = new();
        public List<string> MissingElements { get; set; } = new();
        public bool MeetsMinimumRequirements { get; set; }
    }

    public class ComplianceIssue
    {
        public string Standard { get; set; } = string.Empty;
        public string Requirement { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public string Suggestion { get; set; } = string.Empty;
        public Severity Severity { get; set; } = Severity.Low;
        public bool IsMandatory { get; set; }
    }

    public class ImprovementSuggestion
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Category { get; set; } = string.Empty; // "Grammar", "Style", "Technical", "Compliance"
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DetailedExplanation { get; set; } = string.Empty;
        public string BeforeExample { get; set; } = string.Empty;
        public string AfterExample { get; set; } = string.Empty;
        public Priority Priority { get; set; } = Priority.Medium;
        public Severity Impact { get; set; } = Severity.Medium;
        public int EstimatedEffortMinutes { get; set; }
        public List<string> ApplicableSections { get; set; } = new();
        public bool IsActionable { get; set; } = true;
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum QualityRating
    {
        Unknown,
        Excellent,      // 90-100
        Good,          // 80-89
        Satisfactory,  // 70-79
        NeedsImprovement, // 60-69
        Poor           // 0-59
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum Severity
    {
        Low,
        Medium,
        High,
        Critical
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum Priority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public class DocumentAnalysisSettings
    {
        public GrammarSettings Grammar { get; set; } = new();
        public StyleSettings Style { get; set; } = new();
        public TechnicalSettings Technical { get; set; } = new();
        public ComplianceSettings Compliance { get; set; } = new();
    }

    public class GrammarSettings
    {
        public bool EnableSpellCheck { get; set; } = true;
        public bool EnableGrammarCheck { get; set; } = true;
        public bool EnablePunctuationCheck { get; set; } = true;
        public double MinConfidenceThreshold { get; set; } = 0.7;
        public List<string> CustomDictionary { get; set; } = new();
        public List<string> TechnicalTermsWhitelist { get; set; } = new();
    }

    public class StyleSettings
    {
        public int MaxSentenceLength { get; set; } = 25;
        public int MaxParagraphLength { get; set; } = 150;
        public double PassiveVoiceThreshold { get; set; } = 0.2; // 20%
        public bool CheckReadability { get; set; } = true;
        public bool CheckConsistency { get; set; } = true;
        public bool CheckProfessionalism { get; set; } = true;
    }

    public class TechnicalSettings
    {
        public bool ValidateTerminology { get; set; } = true;
        public bool CheckStandardsCompliance { get; set; } = true;
        public bool ValidateStructure { get; set; } = true;
        public List<string> RequiredSections { get; set; } = new();
        public Dictionary<string, List<string>> TerminologyStandards { get; set; } = new();
    }

    public class ComplianceSettings
    {
        public string Framework { get; set; } = "Nuclear"; // Nuclear, ISO, IEEE, etc.
        public bool StrictMode { get; set; } = false;
        public List<string> RequiredElements { get; set; } = new();
        public List<string> ProhibitedElements { get; set; } = new();
        public Dictionary<string, double> WeightingFactors { get; set; } = new();
    }
}