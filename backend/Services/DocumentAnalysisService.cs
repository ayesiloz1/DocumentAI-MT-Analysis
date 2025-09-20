using MTAnalyzer.Models;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace MTAnalyzer.Services
{
    public interface IDocumentAnalysisService
    {
        Task<DocumentAnalysisResult> AnalyzeDocumentAsync(string documentText, DocumentAnalysisRequest request);
        Task<DocumentAnalysisResult> AnalyzePdfDocumentAsync(IFormFile pdfFile, DocumentAnalysisRequest request);
        Task<List<ImprovementSuggestion>> GenerateImprovementSuggestionsAsync(DocumentAnalysisResult analysis);
    }

    public class DocumentAnalysisService : IDocumentAnalysisService
    {
        private readonly IAzureOpenAIService _openAIService;
        private readonly IPdfProcessingService _pdfProcessingService;
        private readonly ILogger<DocumentAnalysisService> _logger;
        private readonly DocumentAnalysisSettings _settings;

        // Grammar and style patterns
        private static readonly Dictionary<string, Regex> GrammarPatterns = new()
        {
            ["repeated_words"] = new Regex(@"\b(\w+)\s+\1\b", RegexOptions.IgnoreCase),
            ["missing_apostrophe"] = new Regex(@"\b(dont|wont|cant|isnt|arent|wasnt|werent|havent|hasnt|hadnt|shouldnt|wouldnt|couldnt)\b", RegexOptions.IgnoreCase),
            ["double_space"] = new Regex(@"  +"),
            ["missing_comma"] = new Regex(@"\b(however|therefore|furthermore|moreover|nevertheless|consequently)\b(?!\s*,)", RegexOptions.IgnoreCase)
        };

        private static readonly Dictionary<string, Regex> StylePatterns = new()
        {
            ["passive_voice"] = new Regex(@"\b(was|were|is|are|am|be|been|being)\s+\w*ed\b", RegexOptions.IgnoreCase),
            ["wordy_phrases"] = new Regex(@"\b(in order to|due to the fact that|for the purpose of|it is important to note that|please be advised that)\b", RegexOptions.IgnoreCase),
            ["weak_verbs"] = new Regex(@"\b(is|are|was|were|have|has|had|make|get|do|go)\b", RegexOptions.IgnoreCase),
            ["redundant_phrases"] = new Regex(@"\b(actual fact|advance planning|future plans|past history|end result|final outcome)\b", RegexOptions.IgnoreCase)
        };

        private static readonly Dictionary<string, List<string>> TechnicalTerminology = new()
        {
            ["Nuclear"] = new() { "reactor", "containment", "safety system", "control rod", "coolant", "radiation", "criticality", "shutdown", "SCRAM", "reactor protection system" },
            ["Engineering"] = new() { "specification", "requirement", "design", "analysis", "verification", "validation", "testing", "inspection", "maintenance" },
            ["Regulatory"] = new() { "compliance", "standard", "regulation", "license", "permit", "approval", "documentation", "procedure", "quality assurance" }
        };

        public DocumentAnalysisService(
            IAzureOpenAIService openAIService,
            IPdfProcessingService pdfProcessingService,
            ILogger<DocumentAnalysisService> logger,
            IConfiguration configuration)
        {
            _openAIService = openAIService;
            _pdfProcessingService = pdfProcessingService;
            _logger = logger;
            
            // Load settings from configuration
            _settings = configuration.GetSection("DocumentAnalysis").Get<DocumentAnalysisSettings>() ?? new DocumentAnalysisSettings();
        }

        public async Task<DocumentAnalysisResult> AnalyzePdfDocumentAsync(IFormFile pdfFile, DocumentAnalysisRequest request)
        {
            try
            {
                if (pdfFile == null || pdfFile.Length == 0)
                {
                    return CreateErrorResult("No PDF file provided");
                }

                using var stream = pdfFile.OpenReadStream();
                
                // Validate PDF
                if (!_pdfProcessingService.ValidatePdfFormat(stream))
                {
                    return CreateErrorResult("Invalid PDF format");
                }

                // Extract text
                var documentText = await _pdfProcessingService.ExtractTextFromPdfAsync(stream);
                
                if (string.IsNullOrWhiteSpace(documentText))
                {
                    return CreateErrorResult("No extractable text found in PDF");
                }

                // Get PDF metadata
                stream.Position = 0;
                var pdfMetadata = await _pdfProcessingService.GetPdfMetadataAsync(stream);

                // Perform analysis
                var result = await AnalyzeDocumentAsync(documentText, request);
                
                // Update metadata with PDF info
                result.Metadata.FileName = pdfFile.FileName;
                result.Metadata.FileSize = pdfFile.Length;
                result.Metadata.PageCount = pdfMetadata.PageCount;

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing PDF document");
                return CreateErrorResult($"Analysis failed: {ex.Message}");
            }
        }

        public async Task<DocumentAnalysisResult> AnalyzeDocumentAsync(string documentText, DocumentAnalysisRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(documentText))
                {
                    return CreateErrorResult("No document text provided");
                }

                var result = new DocumentAnalysisResult();

                // Calculate basic metadata
                result.Metadata = CalculateDocumentMetadata(documentText, request.DocumentType ?? "general");

                // Perform different types of analysis based on request
                if (request.PerformGrammarCheck)
                {
                    result.Grammar = await PerformGrammarAnalysisAsync(documentText);
                }

                if (request.PerformStyleCheck)
                {
                    result.Style = await PerformStyleAnalysisAsync(documentText);
                }

                if (request.PerformTechnicalReview)
                {
                    result.Technical = await PerformTechnicalAnalysisAsync(documentText, request.DocumentType ?? "general");
                }

                if (request.PerformComplianceCheck)
                {
                    result.Compliance = await PerformComplianceAnalysisAsync(documentText, request.DocumentType ?? "general");
                }

                // Calculate overall quality scores
                result.QualityScore = CalculateOverallQualityScore(result);

                // Generate AI-powered improvement suggestions
                result.Suggestions = await GenerateImprovementSuggestionsAsync(result);

                // Generate AI summary
                result.Summary = await GenerateAnalysisSummaryAsync(documentText, result);

                result.IsAnalysisSuccessful = true;

                _logger.LogInformation($"Document analysis completed successfully. Overall score: {result.QualityScore.Overall:F1}");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing document analysis");
                return CreateErrorResult($"Analysis failed: {ex.Message}");
            }
        }

        private DocumentMetadata CalculateDocumentMetadata(string text, string documentType)
        {
            var words = Regex.Matches(text, @"\b\w+\b").Count;
            var sentences = Regex.Matches(text, @"[.!?]+").Count;
            var paragraphs = text.Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries).Length;

            return new DocumentMetadata
            {
                DocumentType = documentType,
                WordCount = words,
                CharacterCount = text.Length,
                SentenceCount = sentences,
                ParagraphCount = paragraphs,
                ReadabilityScore = CalculateReadabilityScore(text, words, sentences),
                ReadabilityLevel = GetReadabilityLevel(CalculateReadabilityScore(text, words, sentences))
            };
        }

        private double CalculateReadabilityScore(string text, int words, int sentences)
        {
            if (sentences == 0 || words == 0) return 0;

            var syllables = EstimateSyllables(text);
            var avgSentenceLength = (double)words / sentences;
            var avgSyllablesPerWord = (double)syllables / words;

            // Flesch Reading Ease Score
            var score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
            return Math.Max(0, Math.Min(100, score));
        }

        private int EstimateSyllables(string text)
        {
            var words = Regex.Matches(text, @"\b\w+\b");
            var totalSyllables = 0;

            foreach (Match word in words)
            {
                var syllables = Regex.Matches(word.Value.ToLower(), @"[aeiouy]+").Count;
                if (word.Value.EndsWith("e") && syllables > 1) syllables--;
                totalSyllables += Math.Max(1, syllables);
            }

            return totalSyllables;
        }

        private string GetReadabilityLevel(double score)
        {
            return score switch
            {
                >= 90 => "Very Easy",
                >= 80 => "Easy",
                >= 70 => "Fairly Easy",
                >= 60 => "Standard",
                >= 50 => "Fairly Difficult",
                >= 30 => "Difficult",
                _ => "Very Difficult"
            };
        }

        private async Task<GrammarAnalysis> PerformGrammarAnalysisAsync(string text)
        {
            var analysis = new GrammarAnalysis();
            var issues = new List<GrammarIssue>();

            // Pattern-based grammar checking
            foreach (var pattern in GrammarPatterns)
            {
                var matches = pattern.Value.Matches(text);
                foreach (Match match in matches)
                {
                    issues.Add(new GrammarIssue
                    {
                        Type = "grammar",
                        Description = GetGrammarIssueDescription(pattern.Key),
                        Context = GetContext(text, match.Index, match.Length),
                        Suggestion = GetGrammarSuggestion(pattern.Key, match.Value),
                        StartPosition = match.Index,
                        Length = match.Length,
                        Severity = GetGrammarIssueSeverity(pattern.Key),
                        Confidence = 0.8
                    });
                }
            }

            // AI-powered grammar analysis for more complex issues
            if (issues.Count < 10) // Don't overwhelm with AI analysis if already many issues
            {
                var aiGrammarIssues = await PerformAIGrammarAnalysisAsync(text);
                issues.AddRange(aiGrammarIssues);
            }

            analysis.Issues = issues;
            analysis.TotalIssues = issues.Count;
            analysis.IssueTypeFrequency = issues.GroupBy(i => i.Type).ToDictionary(g => g.Key, g => g.Count());
            analysis.AccuracyScore = Math.Max(0, 100 - (issues.Count * 5)); // Rough scoring

            return analysis;
        }

        private async Task<StyleAnalysis> PerformStyleAnalysisAsync(string text)
        {
            var analysis = new StyleAnalysis();
            var issues = new List<StyleIssue>();

            // Pattern-based style checking
            foreach (var pattern in StylePatterns)
            {
                var matches = pattern.Value.Matches(text);
                foreach (Match match in matches)
                {
                    issues.Add(new StyleIssue
                    {
                        Type = pattern.Key,
                        Description = GetStyleIssueDescription(pattern.Key),
                        Context = GetContext(text, match.Index, match.Length),
                        Suggestion = GetStyleSuggestion(pattern.Key, match.Value),
                        Severity = GetStyleIssueSeverity(pattern.Key)
                    });
                }
            }

            // Calculate style scores
            var sentences = Regex.Matches(text, @"[.!?]+").Count;
            var words = Regex.Matches(text, @"\b\w+\b").Count;
            var passiveVoiceCount = StylePatterns["passive_voice"].Matches(text).Count;

            analysis.Issues = issues;
            analysis.Statistics = CalculateWritingStatistics(text);
            analysis.ClarityScore = CalculateClarityScore(text, analysis.Statistics);
            analysis.ConsistencyScore = CalculateConsistencyScore(text);
            analysis.ConcisionScore = CalculateConcisionScore(text, issues);
            analysis.ProfessionalismScore = CalculateProfessionalismScore(text, issues);

            return analysis;
        }

        private async Task<TechnicalAnalysis> PerformTechnicalAnalysisAsync(string text, string documentType)
        {
            var analysis = new TechnicalAnalysis();
            var issues = new List<TechnicalIssue>();

            // Identify technical terms and check consistency
            var identifiedTerms = IdentifyTechnicalTerms(text, documentType);
            analysis.TechnicalTerms = identifiedTerms;

            // Check for proper technical structure
            analysis.HasProperTechnicalStructure = CheckTechnicalStructure(text, documentType);

            // AI-powered technical analysis
            var aiTechnicalAnalysis = await PerformAITechnicalAnalysisAsync(text, documentType);
            
            analysis.TechnicalAccuracyScore = aiTechnicalAnalysis.TechnicalAccuracyScore;
            analysis.TerminologyConsistencyScore = CalculateTerminologyConsistency(text, identifiedTerms);
            analysis.StructureScore = analysis.HasProperTechnicalStructure ? 85 : 60;
            analysis.Issues = aiTechnicalAnalysis.Issues;
            analysis.IdentifiedStandards = aiTechnicalAnalysis.IdentifiedStandards;

            return analysis;
        }

        private async Task<ComplianceAnalysis> PerformComplianceAnalysisAsync(string text, string documentType)
        {
            var framework = _settings.Compliance.Framework;
            var analysis = new ComplianceAnalysis
            {
                ComplianceFramework = framework
            };

            // AI-powered compliance analysis
            var aiCompliance = await PerformAIComplianceAnalysisAsync(text, documentType, framework);
            
            analysis.ComplianceScore = aiCompliance.ComplianceScore;
            analysis.Issues = aiCompliance.Issues;
            analysis.RequiredElements = aiCompliance.RequiredElements;
            analysis.MissingElements = aiCompliance.MissingElements;
            analysis.MeetsMinimumRequirements = aiCompliance.MeetsMinimumRequirements;

            return analysis;
        }

        public async Task<List<ImprovementSuggestion>> GenerateImprovementSuggestionsAsync(DocumentAnalysisResult analysis)
        {
            var suggestions = new List<ImprovementSuggestion>();

            // Generate suggestions based on identified issues
            suggestions.AddRange(CreateGrammarSuggestions(analysis.Grammar));
            suggestions.AddRange(CreateStyleSuggestions(analysis.Style));
            suggestions.AddRange(CreateTechnicalSuggestions(analysis.Technical));
            
            if (analysis.Compliance != null)
            {
                suggestions.AddRange(CreateComplianceSuggestions(analysis.Compliance));
            }

            // AI-powered improvement suggestions
            var aiSuggestions = await GenerateAISuggestionsAsync(analysis);
            suggestions.AddRange(aiSuggestions);

            // Prioritize and deduplicate suggestions
            return PrioritizeSuggestions(suggestions);
        }

        private async Task<string> GenerateAnalysisSummaryAsync(string documentText, DocumentAnalysisResult analysis)
        {
            var prompt = $@"
            Analyze the following document analysis results and provide a comprehensive summary in 2-3 paragraphs:

            Document Statistics:
            - Word Count: {analysis.Metadata.WordCount}
            - Readability Score: {analysis.Metadata.ReadabilityScore:F1} ({analysis.Metadata.ReadabilityLevel})
            - Overall Quality Score: {analysis.QualityScore.Overall:F1}/100

            Quality Breakdown:
            - Grammar: {analysis.QualityScore.Grammar:F1}/100 ({analysis.Grammar.TotalIssues} issues)
            - Style: {analysis.QualityScore.Style:F1}/100
            - Technical: {analysis.QualityScore.Technical:F1}/100
            - Clarity: {analysis.QualityScore.Clarity:F1}/100

            Provide a professional summary that:
            1. Highlights the document's strengths
            2. Identifies key areas for improvement
            3. Gives an overall assessment of document quality
            4. Provides encouraging and constructive feedback

            Focus on being helpful and encouraging while being honest about areas needing improvement.
            ";

            try
            {
                var response = await _openAIService.ExtractInformationFromTextAsync(documentText, prompt);
                return response?.Trim() ?? "Analysis completed successfully.";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate AI summary, using default");
                return GenerateDefaultSummary(analysis);
            }
        }

        #region Helper Methods

        private DocumentAnalysisResult CreateErrorResult(string errorMessage)
        {
            return new DocumentAnalysisResult
            {
                IsAnalysisSuccessful = false,
                ErrorMessage = errorMessage,
                Summary = $"Analysis failed: {errorMessage}"
            };
        }

        private string GetContext(string text, int position, int length)
        {
            var start = Math.Max(0, position - 50);
            var end = Math.Min(text.Length, position + length + 50);
            var context = text.Substring(start, end - start);
            
            if (start > 0) context = "..." + context;
            if (end < text.Length) context = context + "...";
            
            return context;
        }

        private OverallQualityScore CalculateOverallQualityScore(DocumentAnalysisResult result)
        {
            var grammarScore = result.Grammar.AccuracyScore;
            var styleScore = (result.Style.ClarityScore + result.Style.ConsistencyScore + 
                            result.Style.ConcisionScore + result.Style.ProfessionalismScore) / 4;
            var technicalScore = (result.Technical.TechnicalAccuracyScore + 
                                result.Technical.TerminologyConsistencyScore + 
                                result.Technical.StructureScore) / 3;
            var complianceScore = result.Compliance?.ComplianceScore ?? 80; // Default if not checked

            var overall = (grammarScore * 0.25 + styleScore * 0.35 + technicalScore * 0.25 + complianceScore * 0.15);

            return new OverallQualityScore
            {
                Overall = overall,
                Grammar = grammarScore,
                Style = styleScore,
                Technical = technicalScore,
                Clarity = result.Style.ClarityScore,
                Compliance = complianceScore,
                Rating = GetQualityRating(overall),
                Explanation = GetQualityExplanation(overall)
            };
        }

        private QualityRating GetQualityRating(double score)
        {
            return score switch
            {
                >= 90 => QualityRating.Excellent,
                >= 80 => QualityRating.Good,
                >= 70 => QualityRating.Satisfactory,
                >= 60 => QualityRating.NeedsImprovement,
                _ => QualityRating.Poor
            };
        }

        private string GetQualityExplanation(double score)
        {
            return score switch
            {
                >= 90 => "Excellent document quality with minimal issues. Ready for professional use.",
                >= 80 => "Good document quality with minor improvements needed.",
                >= 70 => "Satisfactory document quality. Some improvements would enhance readability.",
                >= 60 => "Document needs improvement in several areas before professional use.",
                _ => "Significant improvements required across multiple quality dimensions."
            };
        }

        // Placeholder methods for detailed implementations
        private async Task<List<GrammarIssue>> PerformAIGrammarAnalysisAsync(string text) => new();
        private async Task<TechnicalAnalysis> PerformAITechnicalAnalysisAsync(string text, string documentType) => new();
        private async Task<ComplianceAnalysis> PerformAIComplianceAnalysisAsync(string text, string documentType, string framework) => new();
        private async Task<List<ImprovementSuggestion>> GenerateAISuggestionsAsync(DocumentAnalysisResult analysis) => new();
        
        private string GetGrammarIssueDescription(string patternKey) => patternKey switch
        {
            "repeated_words" => "Repeated word detected",
            "missing_apostrophe" => "Missing apostrophe in contraction",
            "double_space" => "Multiple consecutive spaces",
            "missing_comma" => "Missing comma after transitional phrase",
            _ => "Grammar issue detected"
        };

        private string GetGrammarSuggestion(string patternKey, string match) => patternKey switch
        {
            "repeated_words" => "Remove the repeated word",
            "missing_apostrophe" => $"Consider: {AddApostrophe(match)}",
            "double_space" => "Use single space",
            "missing_comma" => "Add comma after transitional phrase",
            _ => "Review grammar"
        };

        private Severity GetGrammarIssueSeverity(string patternKey) => patternKey switch
        {
            "repeated_words" => Severity.Medium,
            "missing_apostrophe" => Severity.Low,
            "double_space" => Severity.Low,
            "missing_comma" => Severity.Medium,
            _ => Severity.Low
        };

        private string AddApostrophe(string word) => word.ToLower() switch
        {
            "dont" => "don't",
            "wont" => "won't",
            "cant" => "can't",
            "isnt" => "isn't",
            "arent" => "aren't",
            "wasnt" => "wasn't",
            "werent" => "weren't",
            "havent" => "haven't",
            "hasnt" => "hasn't",
            "hadnt" => "hadn't",
            "shouldnt" => "shouldn't",
            "wouldnt" => "wouldn't",
            "couldnt" => "couldn't",
            _ => word
        };

        // Additional helper method implementations would go here...
        private string GetStyleIssueDescription(string patternKey) => "Style issue detected";
        private string GetStyleSuggestion(string patternKey, string match) => "Consider revision";
        private Severity GetStyleIssueSeverity(string patternKey) => Severity.Low;
        private WritingStatistics CalculateWritingStatistics(string text) => new();
        private double CalculateClarityScore(string text, WritingStatistics stats) => 75.0;
        private double CalculateConsistencyScore(string text) => 80.0;
        private double CalculateConcisionScore(string text, List<StyleIssue> issues) => 70.0;
        private double CalculateProfessionalismScore(string text, List<StyleIssue> issues) => 85.0;
        private List<string> IdentifyTechnicalTerms(string text, string documentType) => new();
        private bool CheckTechnicalStructure(string text, string documentType) => true;
        private double CalculateTerminologyConsistency(string text, List<string> terms) => 80.0;
        private List<ImprovementSuggestion> CreateGrammarSuggestions(GrammarAnalysis grammar) => new();
        private List<ImprovementSuggestion> CreateStyleSuggestions(StyleAnalysis style) => new();
        private List<ImprovementSuggestion> CreateTechnicalSuggestions(TechnicalAnalysis technical) => new();
        private List<ImprovementSuggestion> CreateComplianceSuggestions(ComplianceAnalysis compliance) => new();
        private List<ImprovementSuggestion> PrioritizeSuggestions(List<ImprovementSuggestion> suggestions) => suggestions.Take(10).ToList();
        private string GenerateDefaultSummary(DocumentAnalysisResult analysis) => $"Document analysis completed with overall quality score of {analysis.QualityScore.Overall:F1}/100.";

        #endregion
    }
}