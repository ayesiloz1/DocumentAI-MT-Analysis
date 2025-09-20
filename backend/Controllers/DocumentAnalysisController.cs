using Microsoft.AspNetCore.Mvc;
using MTAnalyzer.Models;
using MTAnalyzer.Services;
using System.ComponentModel.DataAnnotations;

namespace MTAnalyzer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class DocumentAnalysisController : ControllerBase
    {
        private readonly IDocumentAnalysisService _documentAnalysisService;
        private readonly ILogger<DocumentAnalysisController> _logger;

        public DocumentAnalysisController(
            IDocumentAnalysisService documentAnalysisService,
            ILogger<DocumentAnalysisController> logger)
        {
            _documentAnalysisService = documentAnalysisService;
            _logger = logger;
        }

        /// <summary>
        /// Analyze a PDF document for quality, grammar, style, and compliance issues
        /// </summary>
        /// <param name="request">Analysis configuration and PDF file</param>
        /// <returns>Comprehensive document analysis results</returns>
        [HttpPost("analyze-pdf")]
        [ProducesResponseType(typeof(DocumentAnalysisResult), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<ActionResult<DocumentAnalysisResult>> AnalyzePdf([FromForm] DocumentAnalysisRequest request)
        {
            try
            {
                _logger.LogInformation("Starting PDF document analysis");

                // Validate request
                if (request.PdfFile == null || request.PdfFile.Length == 0)
                {
                    return BadRequest("PDF file is required");
                }

                // Check file size (50MB limit)
                if (request.PdfFile.Length > 50 * 1024 * 1024)
                {
                    return BadRequest("PDF file size exceeds 50MB limit");
                }

                // Check file type
                if (!request.PdfFile.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Only PDF files are supported");
                }

                var result = await _documentAnalysisService.AnalyzePdfDocumentAsync(request.PdfFile, request);

                if (!result.IsAnalysisSuccessful)
                {
                    return BadRequest(result.ErrorMessage);
                }

                _logger.LogInformation($"PDF analysis completed successfully. Overall score: {result.QualityScore.Overall:F1}");
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing PDF document");
                return StatusCode(500, "An error occurred while analyzing the document");
            }
        }

        /// <summary>
        /// Analyze text content for quality, grammar, style, and compliance issues
        /// </summary>
        /// <param name="request">Analysis configuration and text content</param>
        /// <returns>Comprehensive document analysis results</returns>
        [HttpPost("analyze-text")]
        [ProducesResponseType(typeof(DocumentAnalysisResult), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<ActionResult<DocumentAnalysisResult>> AnalyzeText([FromBody] AnalyzeTextRequest request)
        {
            try
            {
                _logger.LogInformation("Starting text document analysis");

                // Validate request
                if (string.IsNullOrWhiteSpace(request.DocumentText))
                {
                    return BadRequest("Document text is required");
                }

                if (request.DocumentText.Length > 1000000) // 1MB text limit
                {
                    return BadRequest("Document text exceeds 1MB limit");
                }

                var analysisRequest = new DocumentAnalysisRequest
                {
                    DocumentText = request.DocumentText,
                    DocumentType = request.DocumentType,
                    PerformGrammarCheck = request.PerformGrammarCheck,
                    PerformStyleCheck = request.PerformStyleCheck,
                    PerformTechnicalReview = request.PerformTechnicalReview,
                    PerformComplianceCheck = request.PerformComplianceCheck
                };

                var result = await _documentAnalysisService.AnalyzeDocumentAsync(request.DocumentText, analysisRequest);

                if (!result.IsAnalysisSuccessful)
                {
                    return BadRequest(result.ErrorMessage);
                }

                _logger.LogInformation($"Text analysis completed successfully. Overall score: {result.QualityScore.Overall:F1}");
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing text document");
                return StatusCode(500, "An error occurred while analyzing the document");
            }
        }

        /// <summary>
        /// Get improvement suggestions for a previously analyzed document
        /// </summary>
        /// <param name="documentId">Document analysis ID</param>
        /// <returns>List of improvement suggestions</returns>
        [HttpGet("suggestions/{documentId}")]
        [ProducesResponseType(typeof(List<ImprovementSuggestion>), 200)]
        [ProducesResponseType(typeof(string), 404)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<ActionResult<List<ImprovementSuggestion>>> GetSuggestions(string documentId)
        {
            try
            {
                // This would typically retrieve from a cache or database
                // For now, return a placeholder response
                _logger.LogInformation($"Retrieving suggestions for document {documentId}");
                
                return Ok(new List<ImprovementSuggestion>
                {
                    new ImprovementSuggestion
                    {
                        Category = "General",
                        Title = "Document suggestions available",
                        Description = "Suggestions are generated as part of the analysis response",
                        Priority = Priority.Medium
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving suggestions for document {documentId}");
                return StatusCode(500, "An error occurred while retrieving suggestions");
            }
        }

        /// <summary>
        /// Get analysis history for documents (placeholder for future implementation)
        /// </summary>
        /// <returns>List of previous analyses</returns>
        [HttpGet("history")]
        [ProducesResponseType(typeof(List<DocumentAnalysisHistoryItem>), 200)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<ActionResult<List<DocumentAnalysisHistoryItem>>> GetAnalysisHistory()
        {
            try
            {
                _logger.LogInformation("Retrieving analysis history");
                
                // Placeholder for future database implementation
                return Ok(new List<DocumentAnalysisHistoryItem>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving analysis history");
                return StatusCode(500, "An error occurred while retrieving analysis history");
            }
        }

        /// <summary>
        /// Get supported document types and analysis capabilities
        /// </summary>
        /// <returns>Analysis capabilities information</returns>
        [HttpGet("capabilities")]
        [ProducesResponseType(typeof(AnalysisCapabilities), 200)]
        public ActionResult<AnalysisCapabilities> GetCapabilities()
        {
            return Ok(new AnalysisCapabilities
            {
                SupportedFileTypes = new[] { "application/pdf" },
                MaxFileSize = 50 * 1024 * 1024, // 50MB
                MaxTextLength = 1000000, // 1MB
                SupportedDocumentTypes = new[] { "general", "technical", "nuclear", "regulatory", "procedure", "specification" },
                AnalysisFeatures = new[]
                {
                    "Grammar checking",
                    "Style analysis",
                    "Technical review",
                    "Compliance checking",
                    "Readability assessment",
                    "AI-powered suggestions",
                    "Quality scoring"
                },
                ComplianceFrameworks = new[] { "Nuclear", "ISO", "IEEE", "ASME" }
            });
        }
    }

    // Supporting models for the API
    public class AnalyzeTextRequest
    {
        [Required]
        [StringLength(1000000, MinimumLength = 10)]
        public string DocumentText { get; set; } = string.Empty;

        public string? DocumentType { get; set; } = "general";

        public bool PerformGrammarCheck { get; set; } = true;

        public bool PerformStyleCheck { get; set; } = true;

        public bool PerformTechnicalReview { get; set; } = true;

        public bool PerformComplianceCheck { get; set; } = false;
    }

    public class DocumentAnalysisHistoryItem
    {
        public string DocumentId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public DateTime AnalysisDate { get; set; }
        public double OverallScore { get; set; }
        public QualityRating Rating { get; set; }
        public int IssuesFound { get; set; }
    }

    public class AnalysisCapabilities
    {
        public string[] SupportedFileTypes { get; set; } = Array.Empty<string>();
        public long MaxFileSize { get; set; }
        public int MaxTextLength { get; set; }
        public string[] SupportedDocumentTypes { get; set; } = Array.Empty<string>();
        public string[] AnalysisFeatures { get; set; } = Array.Empty<string>();
        public string[] ComplianceFrameworks { get; set; } = Array.Empty<string>();
    }
}