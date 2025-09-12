using System.Net;
using System.Text.Json;

namespace MTAnalyzer.Middleware
{
    // ============================================================================
    // GLOBAL EXCEPTION HANDLING MIDDLEWARE
    // Catches all unhandled exceptions and returns standardized error responses
    // Prevents sensitive information from being exposed to clients
    // ============================================================================
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;                    // Next middleware in pipeline
        private readonly ILogger<GlobalExceptionMiddleware> _logger; // Logger for error tracking
        private readonly IWebHostEnvironment _environment;         // Environment info (Development/Production)

        // Constructor - receives dependencies via dependency injection
        public GlobalExceptionMiddleware(
            RequestDelegate next, 
            ILogger<GlobalExceptionMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        // InvokeAsync - called for every HTTP request
        // Wraps the entire request in a try-catch block
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // ============================================================================
                // NORMAL REQUEST PROCESSING
                // Pass control to the next middleware in the pipeline
                // ============================================================================
                await _next(context);
            }
            catch (Exception ex)
            {
                // ============================================================================
                // EXCEPTION HANDLING
                // Any unhandled exception from controllers or services ends up here
                // ============================================================================
                await HandleExceptionAsync(context, ex);
            }
        }

        // Handle exceptions and return appropriate HTTP responses
        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // ============================================================================
            // EXCEPTION LOGGING
            // Log detailed error information for debugging and monitoring
            // ============================================================================
            
            // Log the full exception with stack trace for debugging
            _logger.LogError(exception, 
                "🚨 Unhandled exception occurred during request {Method} {Path}: {ErrorMessage}",
                context.Request.Method, 
                context.Request.Path, 
                exception.Message
            );

            // ============================================================================
            // RESPONSE CONFIGURATION
            // Set response headers and content type for error response
            // ============================================================================
            
            // Clear any existing response content
            context.Response.Clear();
            
            // Set content type to JSON for consistent API responses
            context.Response.ContentType = "application/json";

            // ============================================================================
            // ERROR CATEGORIZATION AND HTTP STATUS CODES
            // Different exception types get different HTTP status codes
            // ============================================================================
            
            var (statusCode, message, errorCode) = exception switch
            {
                // Azure OpenAI specific errors
                Azure.RequestFailedException azureEx when azureEx.Status == 401 => 
                    (HttpStatusCode.Unauthorized, "Azure OpenAI authentication failed", "AZURE_AUTH_ERROR"),
                
                Azure.RequestFailedException azureEx when azureEx.Status == 429 => 
                    (HttpStatusCode.TooManyRequests, "Azure OpenAI rate limit exceeded", "RATE_LIMIT_ERROR"),
                
                Azure.RequestFailedException azureEx when azureEx.Status == 404 => 
                    (HttpStatusCode.BadRequest, "Azure OpenAI deployment not found", "DEPLOYMENT_ERROR"),
                
                // HTTP specific errors
                HttpRequestException httpEx => 
                    (HttpStatusCode.ServiceUnavailable, "External service unavailable", "SERVICE_ERROR"),
                
                // Argument validation errors
                ArgumentException or ArgumentNullException => 
                    (HttpStatusCode.BadRequest, "Invalid request parameters", "VALIDATION_ERROR"),
                
                // JSON serialization errors
                JsonException => 
                    (HttpStatusCode.BadRequest, "Invalid JSON format", "JSON_ERROR"),
                
                // Timeout errors
                TimeoutException => 
                    (HttpStatusCode.RequestTimeout, "Request timeout", "TIMEOUT_ERROR"),
                
                // File/IO errors
                FileNotFoundException => 
                    (HttpStatusCode.NotFound, "Requested resource not found", "RESOURCE_ERROR"),
                
                UnauthorizedAccessException => 
                    (HttpStatusCode.Forbidden, "Access denied", "ACCESS_ERROR"),
                
                // Default catch-all for unknown errors
                _ => (HttpStatusCode.InternalServerError, "An internal server error occurred", "INTERNAL_ERROR")
            };

            // Set the HTTP status code
            context.Response.StatusCode = (int)statusCode;

            // ============================================================================
            // ERROR RESPONSE CREATION
            // Create standardized error response object
            // ============================================================================
            
            // Create base error object
            var errorObject = new
            {
                code = errorCode,
                message = message,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                requestId = context.TraceIdentifier, // Unique ID for tracking this request
                path = context.Request.Path.ToString()
            };

            // ============================================================================
            // SPECIAL HANDLING FOR AZURE OPENAI ERRORS
            // Provide specific guidance for AI-related issues
            // ============================================================================
            
            object errorResponse;
            
            if (exception is Azure.RequestFailedException azureException)
            {
                _logger.LogError(
                    "🤖 Azure OpenAI Error: Status {Status}, Code {ErrorCode}, Message: {Message}",
                    azureException.Status, azureException.ErrorCode, azureException.Message
                );

                // Add Azure-specific troubleshooting information
                var troubleshooting = azureException.Status switch
                {
                    401 => "Check your Azure OpenAI API key and endpoint configuration",
                    429 => "Reduce request frequency or upgrade your Azure OpenAI quota",
                    404 => "Verify your deployment name matches the one in Azure OpenAI Studio",
                    _ => "Check Azure OpenAI service status and configuration"
                };

                // Create Azure-specific error response
                if (_environment.IsDevelopment())
                {
                    errorResponse = new
                    {
                        error = errorObject,
                        details = new
                        {
                            exceptionType = exception.GetType().Name,
                            stackTrace = exception.StackTrace,
                            innerException = exception.InnerException?.Message,
                            troubleshooting = troubleshooting,
                            azureDetails = new
                            {
                                status = azureException.Status,
                                errorCode = azureException.ErrorCode,
                                message = azureException.Message
                            }
                        }
                    };
                }
                else
                {
                    errorResponse = new
                    {
                        error = errorObject,
                        troubleshooting = troubleshooting
                    };
                }
            }
            else
            {
                // Create standard error response for non-Azure exceptions
                errorResponse = new
                {
                    error = errorObject,
                    details = _environment.IsDevelopment() ? new
                    {
                        exceptionType = exception.GetType().Name,
                        stackTrace = exception.StackTrace,
                        innerException = exception.InnerException?.Message
                    } : null
                };
            }

            // ============================================================================
            // RESPONSE SERIALIZATION AND TRANSMISSION
            // Convert error object to JSON and send to client
            // ============================================================================
            
            try
            {
                // Configure JSON serialization options
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase, // Use camelCase for JS compatibility
                    WriteIndented = _environment.IsDevelopment()        // Pretty-print in development
                };

                // Serialize error response to JSON
                var jsonResponse = JsonSerializer.Serialize(errorResponse, jsonOptions);
                
                // Send JSON response to client
                await context.Response.WriteAsync(jsonResponse);
            }
            catch (Exception serializationEx)
            {
                // If JSON serialization fails, send a simple error message
                _logger.LogError(serializationEx, "Failed to serialize error response");
                
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = new
                    {
                        code = "SERIALIZATION_ERROR",
                        message = "An error occurred while processing the error response",
                        timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    }
                }));
            }
        }
    }
}