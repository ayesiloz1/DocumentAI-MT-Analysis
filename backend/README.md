# DocumentAI Backend

This is the .NET 8 backend API for the DocumentAI multi-assistant platform supporting MT (Modification Traveler), GRB, USQ, and FSAR analysis.

## Architecture

```
backend/
├── Controllers/           # API Controllers
│   └── EnhancedMTController.cs   # GPT-4 powered MT analysis
├── Services/             # Business Logic Services  
│   ├── AzureOpenAIService.cs     # GPT-4 integration
│   ├── IntelligentMTService.cs   # Smart MT analysis
│   └── MTDecisionEngine.cs       # Decision tree logic
├── Models/               # Data Models
│   ├── MTAnalysisModels.cs       # MT analysis DTOs
│   └── DatabaseModels.cs         # Entity models
├── Repositories/         # Data Access Layer
└── Program.cs           # Application entry point
```

## Key Features

- **GPT-4 Integration**: Advanced AI-powered MT analysis
- **Intelligent Chat**: Natural language processing for complex scenarios
- **Decision Engine**: Rule-based MT classification system
- **RESTful API**: Clean HTTP endpoints for frontend integration

## API Endpoints

### EnhancedMT Controller
- `POST /api/enhancedmt/intelligent-chat` - Natural language MT analysis
- `POST /api/enhancedmt/analyze-with-gpt4` - Structured GPT-4 analysis

## Running the Backend

```bash
cd backend
dotnet restore
dotnet run --urls="http://localhost:5001"
```

## Configuration

Edit `appsettings.json` to configure:
- Azure OpenAI connection strings
- Database connection strings  
- API keys and endpoints

## Dependencies

- .NET 8.0
- Azure.AI.OpenAI
- Swashbuckle (API documentation)
- Entity Framework (future database integration)

## Development

The backend is designed to work with the Next.js frontend located in the `../frontend` directory.
