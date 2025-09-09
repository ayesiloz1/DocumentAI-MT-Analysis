using MTAnalyzer.Services;
using Azure.AI.OpenAI;
using Azure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Add Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Azure OpenAI Client
builder.Services.AddSingleton<OpenAIClient>(provider =>
{
    var endpoint = builder.Configuration["AzureOpenAI:Endpoint"];
    var apiKey = builder.Configuration["AzureOpenAI:ApiKey"];
    return new OpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey!));
});

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add MT Analyzer services
builder.Services.AddScoped<IMTDecisionEngine, MTDecisionEngine>();
builder.Services.AddScoped<IAzureOpenAIService, AzureOpenAIService>();
// builder.Services.AddScoped<IEnhancedMTAnalyzer, EnhancedMTAnalyzer>(); // Replaced by IntelligentMTService

// Add new embedding service
builder.Services.AddScoped<IEmbeddingService, EmbeddingService>();

// Add new intelligent GPT-4 service
builder.Services.AddScoped<IIntelligentMTService, IntelligentMTService>();

// Add logging
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddConsole();
    loggingBuilder.SetMinimumLevel(LogLevel.Information);
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Disabled for local development
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
