using Azure.AI.OpenAI;
using Azure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace MTAnalyzer.Services
{
    public class EquipmentClassification
    {
        public string BestMatch { get; set; } = "";
        public double ConfidenceScore { get; set; }
        public List<string> SecondaryEquipment { get; set; } = new();
        public string TechnicalCategory { get; set; } = "";
    }

    public class MTTypeRecommendation
    {
        public MTTypeRecommendationDetail? PrimaryRecommendation { get; set; }
        public double ConfidenceScore { get; set; }
        public string Reasoning { get; set; } = "";
        public List<string> AlternativeTypes { get; set; } = new();
    }

    public class MTTypeRecommendationDetail
    {
        public string MTType { get; set; } = "";
        public double Confidence { get; set; }
    }

    public interface IEmbeddingService
    {
        Task<EquipmentClassification> ClassifyEquipmentAsync(string description);
        Task<MTTypeRecommendation> RecommendMTTypeAsync(string description);
        Task<double[]> GenerateEmbeddingAsync(string text);
        Task<List<string>> FindSimilarEquipmentAsync(string description, int maxResults = 5);
    }

    public class EmbeddingService : IEmbeddingService
    {
        private readonly OpenAIClient _openAIClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmbeddingService> _logger;
        private readonly string _embeddingDeploymentName;

        // Pre-computed embeddings for common nuclear equipment
        private static readonly Dictionary<string, double[]> _equipmentEmbeddings = new();
        private static readonly Dictionary<string, double[]> _mtTypeEmbeddings = new();
        private static bool _embeddingsInitialized = false;

        public EmbeddingService(
            IConfiguration configuration,
            ILogger<EmbeddingService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var endpoint = _configuration["AzureOpenAI:Endpoint"];
            var apiKey = _configuration["AzureOpenAI:ApiKey"];
            _openAIClient = new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
            
            _embeddingDeploymentName = _configuration["AzureOpenAI:EmbeddingDeploymentName"] ?? "text-embedding-ada-002";
        }

        public async Task<double[]> GenerateEmbeddingAsync(string text)
        {
            try
            {
                var embeddingOptions = new EmbeddingsOptions(_embeddingDeploymentName, new[] { text });
                var response = await _openAIClient.GetEmbeddingsAsync(embeddingOptions);
                
                var embedding = response.Value.Data[0].Embedding.ToArray().Select(f => (double)f).ToArray();
                _logger.LogInformation("Generated embedding with {Dimensions} dimensions", embedding.Length);
                
                return embedding;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate embedding for text: {Text}", text[..Math.Min(100, text.Length)]);
                throw;
            }
        }

        public async Task<EquipmentClassification> ClassifyEquipmentAsync(string description)
        {
            try
            {
                await EnsureEmbeddingsInitializedAsync();
                
                var inputEmbedding = await GenerateEmbeddingAsync(description);
                
                var bestMatch = _equipmentEmbeddings
                    .Select(kv => new { Equipment = kv.Key, Similarity = CosineSimilarity(inputEmbedding, kv.Value) })
                    .OrderByDescending(x => x.Similarity)
                    .FirstOrDefault();

                var confidence = bestMatch?.Similarity ?? 0;
                _logger.LogInformation("Equipment classification confidence: {Confidence}", confidence);

                return new EquipmentClassification
                {
                    BestMatch = bestMatch?.Equipment ?? "Unknown",
                    ConfidenceScore = confidence,
                    TechnicalCategory = GetTechnicalCategory(bestMatch?.Equipment ?? ""),
                    SecondaryEquipment = new List<string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to classify equipment");
                return new EquipmentClassification { BestMatch = "Unknown", ConfidenceScore = 0 };
            }
        }

        public async Task<MTTypeRecommendation> RecommendMTTypeAsync(string description)
        {
            try
            {
                await EnsureEmbeddingsInitializedAsync();
                
                var inputEmbedding = await GenerateEmbeddingAsync(description);
                
                var bestMatch = _mtTypeEmbeddings
                    .Select(kv => new { Type = kv.Key, Similarity = CosineSimilarity(inputEmbedding, kv.Value) })
                    .OrderByDescending(x => x.Similarity)
                    .FirstOrDefault();

                var confidence = bestMatch?.Similarity ?? 0;
                _logger.LogInformation("MT type recommendation confidence: {Confidence:F4}", confidence);

                return new MTTypeRecommendation
                {
                    PrimaryRecommendation = new MTTypeRecommendationDetail
                    {
                        MTType = bestMatch?.Type ?? "Type I",
                        Confidence = confidence
                    },
                    ConfidenceScore = confidence,
                    Reasoning = $"Based on similarity analysis: {confidence:F2}% confidence",
                    AlternativeTypes = new List<string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to recommend MT type");
                return new MTTypeRecommendation 
                { 
                    PrimaryRecommendation = new MTTypeRecommendationDetail { MTType = "Type I", Confidence = 0 },
                    ConfidenceScore = 0 
                };
            }
        }

        public async Task<List<string>> FindSimilarEquipmentAsync(string description, int maxResults = 5)
        {
            try
            {
                await EnsureEmbeddingsInitializedAsync();
                
                var inputEmbedding = await GenerateEmbeddingAsync(description);
                
                var similarities = _equipmentEmbeddings
                    .Select(kv => new { Equipment = kv.Key, Similarity = CosineSimilarity(inputEmbedding, kv.Value) })
                    .OrderByDescending(x => x.Similarity)
                    .Take(maxResults)
                    .Select(x => x.Equipment)
                    .ToList();

                return similarities;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to find similar equipment");
                return new List<string>();
            }
        }

        private async Task EnsureEmbeddingsInitializedAsync()
        {
            if (_embeddingsInitialized)
                return;

            _logger.LogInformation("Initializing equipment embeddings...");

            // Define common nuclear equipment with technical descriptions
            var equipmentDefinitions = new Dictionary<string, string>
            {
                ["reactor coolant pump, RCP"] = "reactor coolant pump RCP coolant circulation pump reactor pump primary cooling pump mechanical seal",
                ["emergency diesel generator, EDG"] = "emergency diesel generator EDG backup generator standby power diesel engine emergency power",
                ["containment isolation valve, isolation valve"] = "containment isolation valve isolation valve containment penetration CIV containment barrier Fisher 6",
                ["pressure transmitter, pressure sensor"] = "pressure transmitter pressure sensor PT pressure measurement pressure monitor transducer"
            };

            foreach (var equipment in equipmentDefinitions)
            {
                var embedding = await GenerateEmbeddingAsync(equipment.Value);
                _equipmentEmbeddings[equipment.Key] = embedding;
                _logger.LogInformation("Generated embedding for equipment: {Equipment}", equipment.Key);
            }

            _logger.LogInformation("Initializing MT type embeddings...");

            // Define MT types with their characteristics
            var mtTypeDefinitions = new Dictionary<string, string>
            {
                ["new design, first installation"] = "new design first installation never installed new system installation new equipment design change",
                ["modification, change"] = "modification change alter modify existing system change procedure change configuration change",
                ["different manufacturer, non-identical"] = "different manufacturer non-identical equivalency different specifications replacement with different",
                ["identical, same manufacturer"] = "identical same manufacturer like-for-like exact same same part number identical replacement same spe"
            };

            foreach (var mtType in mtTypeDefinitions)
            {
                var embedding = await GenerateEmbeddingAsync(mtType.Value);
                _mtTypeEmbeddings[mtType.Key] = embedding;
                _logger.LogInformation("Generated embedding for MT type: {Type}", mtType.Key);
            }

            _embeddingsInitialized = true;
            _logger.LogInformation("All embeddings initialization complete");
        }

        private static double CosineSimilarity(double[] vectorA, double[] vectorB)
        {
            if (vectorA.Length != vectorB.Length)
                return 0;

            var dotProduct = vectorA.Zip(vectorB, (a, b) => a * b).Sum();
            var magnitudeA = Math.Sqrt(vectorA.Sum(a => a * a));
            var magnitudeB = Math.Sqrt(vectorB.Sum(b => b * b));

            if (magnitudeA == 0 || magnitudeB == 0)
                return 0;

            return dotProduct / (magnitudeA * magnitudeB);
        }

        private static string GetTechnicalCategory(string equipment)
        {
            var lowerEquipment = equipment.ToLower();
            
            if (lowerEquipment.Contains("pump") || lowerEquipment.Contains("rcp"))
                return "Mechanical Equipment";
            else if (lowerEquipment.Contains("generator") || lowerEquipment.Contains("edg"))
                return "Electrical Equipment";
            else if (lowerEquipment.Contains("valve") || lowerEquipment.Contains("isolation"))
                return "Flow Control";
            else if (lowerEquipment.Contains("transmitter") || lowerEquipment.Contains("sensor"))
                return "Instrumentation";
            else
                return "General Equipment";
        }
    }
}
