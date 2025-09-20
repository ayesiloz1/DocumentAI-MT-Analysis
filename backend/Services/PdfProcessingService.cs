using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using System.Text;
using System.Text.RegularExpressions;

namespace MTAnalyzer.Services
{
    public interface IPdfProcessingService
    {
        Task<string> ExtractTextFromPdfAsync(Stream pdfStream);
        Task<string> ExtractTextFromPdfAsync(byte[] pdfBytes);
        Task<PdfMetadata> GetPdfMetadataAsync(Stream pdfStream);
        bool ValidatePdfFormat(Stream pdfStream);
    }

    public class PdfProcessingService : IPdfProcessingService
    {
        private readonly ILogger<PdfProcessingService> _logger;
        private static readonly string[] SupportedMimeTypes = { "application/pdf" };
        private const int MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB limit

        public PdfProcessingService(ILogger<PdfProcessingService> logger)
        {
            _logger = logger;
        }

        public async Task<string> ExtractTextFromPdfAsync(Stream pdfStream)
        {
            try
            {
                if (!ValidatePdfFormat(pdfStream))
                {
                    throw new InvalidOperationException("Invalid PDF format");
                }

                pdfStream.Position = 0;
                var extractedText = new StringBuilder();

                // Try primary extraction method using PdfPig
                try
                {
                    using var document = UglyToad.PdfPig.PdfDocument.Open(pdfStream);
                    foreach (var page in document.GetPages())
                    {
                        var pageText = page.Text;
                        extractedText.AppendLine(pageText);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"PdfPig extraction failed, trying iTextSharp: {ex.Message}");
                    
                    // Fallback to iTextSharp
                    pdfStream.Position = 0;
                    using var reader = new PdfReader(pdfStream);
                    for (int page = 1; page <= reader.NumberOfPages; page++)
                    {
                        var pageText = PdfTextExtractor.GetTextFromPage(reader, page);
                        extractedText.AppendLine(pageText);
                    }
                }

                var finalText = extractedText.ToString();
                
                // Clean up extracted text
                finalText = CleanExtractedText(finalText);

                _logger.LogInformation($"Successfully extracted {finalText.Length} characters from PDF");
                return finalText;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text from PDF");
                throw new InvalidOperationException($"Failed to extract text from PDF: {ex.Message}", ex);
            }
        }

        public async Task<string> ExtractTextFromPdfAsync(byte[] pdfBytes)
        {
            using var stream = new MemoryStream(pdfBytes);
            return await ExtractTextFromPdfAsync(stream);
        }

        public async Task<PdfMetadata> GetPdfMetadataAsync(Stream pdfStream)
        {
            try
            {
                pdfStream.Position = 0;
                using var reader = new PdfReader(pdfStream);
                
                var metadata = new PdfMetadata
                {
                    PageCount = reader.NumberOfPages,
                    Title = reader.Info.ContainsKey("Title") ? reader.Info["Title"] : "Unknown",
                    Author = reader.Info.ContainsKey("Author") ? reader.Info["Author"] : "Unknown",
                    Subject = reader.Info.ContainsKey("Subject") ? reader.Info["Subject"] : "",
                    Creator = reader.Info.ContainsKey("Creator") ? reader.Info["Creator"] : "",
                    Producer = reader.Info.ContainsKey("Producer") ? reader.Info["Producer"] : "",
                    CreationDate = reader.Info.ContainsKey("CreationDate") ? reader.Info["CreationDate"] : "",
                    ModificationDate = reader.Info.ContainsKey("ModDate") ? reader.Info["ModDate"] : "",
                    IsEncrypted = reader.IsEncrypted(),
                    FileSize = pdfStream.Length
                };

                return metadata;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting PDF metadata");
                return new PdfMetadata { PageCount = 0, Title = "Error reading metadata" };
            }
        }

        public bool ValidatePdfFormat(Stream pdfStream)
        {
            try
            {
                if (pdfStream == null || pdfStream.Length == 0)
                    return false;

                if (pdfStream.Length > MaxFileSizeBytes)
                {
                    _logger.LogWarning($"PDF file too large: {pdfStream.Length} bytes");
                    return false;
                }

                pdfStream.Position = 0;
                var header = new byte[5];
                pdfStream.Read(header, 0, 5);
                pdfStream.Position = 0;

                // Check for PDF signature
                var headerString = Encoding.ASCII.GetString(header);
                return headerString.StartsWith("%PDF-");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating PDF format");
                return false;
            }
        }

        private string CleanExtractedText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Remove excessive whitespace and normalize line breaks
            text = Regex.Replace(text, @"\s+", " ");
            text = Regex.Replace(text, @"[ \t]*\r?\n[ \t]*", "\n");
            
            // Remove common PDF artifacts
            text = Regex.Replace(text, @"[^\x20-\x7E\n\r\t]", ""); // Remove non-printable chars
            text = Regex.Replace(text, @"\n{3,}", "\n\n"); // Limit consecutive newlines
            
            // Remove page numbers and headers/footers (common patterns)
            text = Regex.Replace(text, @"^\s*Page \d+\s*$", "", RegexOptions.Multiline);
            text = Regex.Replace(text, @"^\s*\d+\s*$", "", RegexOptions.Multiline);
            
            return text.Trim();
        }
    }

    public class PdfMetadata
    {
        public int PageCount { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Creator { get; set; } = string.Empty;
        public string Producer { get; set; } = string.Empty;
        public string CreationDate { get; set; } = string.Empty;
        public string ModificationDate { get; set; } = string.Empty;
        public bool IsEncrypted { get; set; }
        public long FileSize { get; set; }
    }
}