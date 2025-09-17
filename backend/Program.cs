// Import necessary namespaces for the application
using MTAnalyzer.Services;  // Our custom service classes
using MTAnalyzer.Middleware; // Our custom middleware classes
using Azure.AI.OpenAI;      // Azure OpenAI SDK for GPT integration
using Azure;                // Azure SDK core functionality
using DotNetEnv;           // For loading .env files

// Load environment variables from .env file
Env.Load();

// Create a web application builder - this is the foundation of our ASP.NET Core app
// The builder pattern allows us to configure services and middleware before building the app
var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// SERVICE REGISTRATION SECTION
// Here we register all the services our application will use
// These services can be injected into controllers and other services
// ============================================================================

// Add built-in ASP.NET Core services
builder.Services.AddControllers();  // Enables MVC controllers for API endpoints

// Add Swagger for API documentation
// Swagger generates interactive API documentation that developers can test
builder.Services.AddEndpointsApiExplorer();  // Discovers API endpoints automatically
builder.Services.AddSwaggerGen();            // Generates OpenAPI/Swagger documentation

// Register Azure OpenAI Client as a singleton service
// Singleton means one instance is created and shared across the entire application
builder.Services.AddSingleton<OpenAIClient>(provider =>
{
    // Read configuration values from appsettings.json
    var endpoint = builder.Configuration["AzureOpenAI:Endpoint"];  // Your Azure OpenAI endpoint URL
    var apiKey = builder.Configuration["AzureOpenAI:ApiKey"];      // Your Azure OpenAI API key
    
    // Create and return the OpenAI client with endpoint and credentials
    // This client will be used to communicate with Azure OpenAI GPT-4
    return new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
});

// Configure CORS (Cross-Origin Resource Sharing) for frontend communication
// CORS allows our React frontend to make API calls to this backend
builder.Services.AddCors(options =>
{
    // Define a CORS policy named "AllowFrontend"
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Allow requests from these frontend URLs (development and production)
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()      // Allow any HTTP headers
              .AllowAnyMethod()      // Allow any HTTP methods (GET, POST, PUT, DELETE, etc.)
              .AllowCredentials();   // Allow cookies and credentials to be sent
    });
});

// ============================================================================
// CUSTOM SERVICE REGISTRATION
// Register our custom business logic services
// Scoped means a new instance is created for each HTTP request
// ============================================================================

// Register MT Decision Engine - handles the decision tree logic for MT documents
builder.Services.AddScoped<IMTDecisionEngine, MTDecisionEngine>();

// Register Azure OpenAI Service - wrapper for OpenAI API calls
builder.Services.AddScoped<IAzureOpenAIService, AzureOpenAIService>();

// Note: EnhancedMTAnalyzer was replaced by IntelligentMTService for better functionality
// builder.Services.AddScoped<IEnhancedMTAnalyzer, EnhancedMTAnalyzer>(); 

// Register Embedding Service - handles document text embeddings for similarity matching
builder.Services.AddScoped<IEmbeddingService, EmbeddingService>();

// Register Intelligent MT Service - main service that uses GPT-4 for smart document analysis
builder.Services.AddScoped<IIntelligentMTService, IntelligentMTService>();

// Configure logging for the application
// Logging helps debug issues and monitor application behavior
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddConsole();                          // Log to console (terminal)
    loggingBuilder.SetMinimumLevel(LogLevel.Information); // Only log Info level and above
});

// ============================================================================
// APPLICATION BUILD AND MIDDLEWARE PIPELINE CONFIGURATION
// Build the application and configure how it handles HTTP requests
// ============================================================================

// Build the application with all the configured services
// After this point, no more services can be registered
var app = builder.Build();

// Configure the HTTP request pipeline - this defines the order of middleware
// Middleware processes HTTP requests and responses in a specific order

// Enable Swagger only in development environment
// Swagger provides interactive API documentation at /swagger endpoint
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();     // Generates OpenAPI specification
    app.UseSwaggerUI();   // Provides interactive web UI for testing APIs
}

// Configure middleware in the correct order:
// ⚠️ ORDER MATTERS! Middleware executes in the order it's added

// 0. FIRST: Global Exception Handling - Must be first to catch all errors
app.UseMiddleware<GlobalExceptionMiddleware>();

// 1. Request Logging - Log all requests for monitoring and debugging
app.UseMiddleware<RequestLoggingMiddleware>();

// 2. HTTPS Redirection (commented out for local development)
// app.UseHttpsRedirection(); // Would redirect HTTP to HTTPS in production

// 3. CORS Middleware - Must come before authorization and controllers
//    This allows cross-origin requests from our React frontend
app.UseCors("AllowFrontend");

// 4. Authorization Middleware - Handles authentication and authorization
//    Currently not configured but ready for future auth implementation
app.UseAuthorization();

// 5. Controller Mapping - Maps incoming requests to controller actions
//    This enables our API endpoints to receive and respond to requests
app.MapControllers();

// Start the web server and begin listening for HTTP requests
// The application will run until stopped (Ctrl+C) or the process is terminated
app.Run();
