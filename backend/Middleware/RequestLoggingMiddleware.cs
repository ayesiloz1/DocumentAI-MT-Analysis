using System.Diagnostics;

namespace MTAnalyzer.Middleware
{
    // ============================================================================
    // REQUEST LOGGING MIDDLEWARE
    // Logs all HTTP requests with timing, status codes, and details
    // Essential for debugging, monitoring, and performance analysis
    // ============================================================================
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;           // Next middleware in pipeline
        private readonly ILogger<RequestLoggingMiddleware> _logger; // Logger for output

        // Constructor - receives next middleware and logger via dependency injection
        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        // InvokeAsync - called for every HTTP request
        // This is where the middleware logic executes
        public async Task InvokeAsync(HttpContext context)
        {
            // ============================================================================
            // REQUEST LOGGING - BEFORE PROCESSING
            // Log incoming request details for debugging and monitoring
            // ============================================================================
            
            // Start timing the request processing
            var stopwatch = Stopwatch.StartNew();
            
            // Extract request information
            var method = context.Request.Method;           // GET, POST, PUT, DELETE, etc.
            var path = context.Request.Path;               // /api/MT/intelligent-chat
            var queryString = context.Request.QueryString; // ?param=value
            var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
            var clientIP = context.Connection.RemoteIpAddress?.ToString();
            
            // Log the incoming request with context information
            _logger.LogInformation(
                "🌐 HTTP {Method} {Path}{QueryString} started from {ClientIP} using {UserAgent}",
                method, path, queryString, clientIP, userAgent
            );

            // ============================================================================
            // AZURE OPENAI SPECIFIC LOGGING
            // Special handling for AI-related endpoints to track usage and costs
            // ============================================================================
            
            // Check if this is an AI-related request (important for cost tracking)
            var isAIRequest = path.StartsWithSegments("/api/MT/intelligent-chat") || 
                             path.StartsWithSegments("/api/MT/analyze-with-gpt4");
            
            if (isAIRequest)
            {
                _logger.LogInformation("🤖 AI Request detected - tracking for usage analytics");
            }

            try
            {
                // ============================================================================
                // CALL NEXT MIDDLEWARE
                // Pass control to the next middleware in the pipeline
                // This is where the actual request processing happens
                // ============================================================================
                await _next(context);
            }
            catch (Exception ex)
            {
                // ============================================================================
                // ERROR LOGGING
                // If any middleware or controller throws an exception, log it here
                // ============================================================================
                _logger.LogError(ex, 
                    "❌ Request {Method} {Path} failed with exception: {ErrorMessage}",
                    method, path, ex.Message
                );
                
                // Re-throw the exception so it can be handled by error middleware
                throw;
            }
            finally
            {
                // ============================================================================
                // RESPONSE LOGGING - AFTER PROCESSING
                // Log response details and performance metrics
                // This block always executes, even if exceptions occurred
                // ============================================================================
                
                // Stop timing and calculate request duration
                stopwatch.Stop();
                var duration = stopwatch.ElapsedMilliseconds;
                
                // Get response information
                var statusCode = context.Response.StatusCode;
                var responseSize = context.Response.ContentLength ?? 0;
                
                // Determine log level based on response status
                var logLevel = statusCode >= 400 ? LogLevel.Warning : LogLevel.Information;
                
                // Log completion with performance metrics
                _logger.Log(logLevel,
                    "✅ HTTP {Method} {Path} completed with {StatusCode} in {Duration}ms (Size: {ResponseSize} bytes)",
                    method, path, statusCode, duration, responseSize
                );

                // ============================================================================
                // PERFORMANCE MONITORING
                // Track slow requests and AI usage for optimization
                // ============================================================================
                
                // Flag slow requests for performance investigation
                if (duration > 5000) // More than 5 seconds
                {
                    _logger.LogWarning(
                        "🐌 SLOW REQUEST: {Method} {Path} took {Duration}ms - investigate performance",
                        method, path, duration
                    );
                }
                
                // Track AI request costs and performance
                if (isAIRequest)
                {
                    _logger.LogInformation(
                        "💰 AI Request completed: {Duration}ms, Status: {StatusCode} - Azure OpenAI usage tracked",
                        duration, statusCode
                    );
                }
            }
        }
    }
}