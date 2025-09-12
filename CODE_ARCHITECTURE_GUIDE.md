# MT Document Analysis System - Code Architecture Guide

This guide explains the complete codebase architecture with line-by-line explanations to help you understand how everything works together.

## 🏗️ Overall System Architecture

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐    Azure API    ┌─────────────────┐
│   React Frontend│ ───────────────►│  .NET Backend   │ ───────────────►│  Azure OpenAI   │
│   (Next.js)     │                 │   (Web API)     │                 │    (GPT-4)      │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
│                                   │
│ • User Interface                  │ • Business Logic
│ • Document Display                │ • API Endpoints  
│ • File Upload                     │ • AI Integration
│ • Chat Interface                  │ • Data Processing
```

## 📁 Project Structure Deep Dive

### Backend (.NET 8 Web API)
```
backend/
├── Program.cs              # Application entry point and configuration
├── Controllers/            # API endpoints that handle HTTP requests
│   └── MTController.cs     # Main controller for MT document operations
├── Services/               # Business logic layer
│   ├── AzureOpenAIService.cs     # Direct Azure OpenAI API integration
│   ├── IntelligentMTService.cs   # Main AI-powered analysis service
│   ├── MTDecisionEngine.cs       # Decision tree logic for MT requirements
│   └── EmbeddingService.cs       # Text embeddings for similarity matching
├── Models/                 # Data models and DTOs
│   ├── ApiModels.cs        # Request/response models for API
│   ├── MTModels.cs         # MT document data structures
│   └── AnalysisModels.cs   # Analysis result models
└── appsettings.json        # Configuration (Azure OpenAI keys, connection strings)
```

### Frontend (Next.js React App)
```
frontend/src/
├── app/                    # Next.js 13+ app router
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Home page component
│   └── globals.css         # Global CSS styles
├── components/             # Reusable React components
│   ├── MTAnalyzerWrapper.tsx     # Main layout wrapper
│   ├── ChatInterface_Pure.tsx    # Core chat interface with AI
│   ├── MTDocumentModal.tsx       # Modal for displaying MT documents
│   └── FormConfigurator.tsx      # Form configuration component
├── services/               # Frontend business logic
│   ├── mtDocumentService.ts      # MT document generation and management
│   └── mtAnalyzerAPI.ts          # API communication with backend
├── styles/                 # CSS styling
│   └── components/         # Organized component styles
│       ├── index.css       # Main CSS entry point
│       ├── layout.css      # Layout and grid styles
│       ├── sidebar.css     # Chat sidebar styles
│       ├── navigation.css  # Navigation and header styles
│       ├── messages.css    # Chat message styles
│       ├── input.css       # Input and form styles
│       ├── responsive.css  # Responsive design rules
│       └── README.md       # CSS architecture documentation
└── utils/                  # Utility functions
    └── createFillableForm.ts     # PDF form generation utilities
```

## 🔄 Data Flow Explanation

### 1. User Interaction Flow
```
User Types Message → ChatInterface_Pure.tsx → Backend API → Azure OpenAI → MT Document
```

**Step-by-step breakdown:**

1. **User Input**: User types a message in the chat interface
2. **Frontend Processing**: `ChatInterface_Pure.tsx` processes the input
3. **API Call**: Frontend calls `POST /api/MT/intelligent-chat`
4. **Backend Routing**: ASP.NET Core routes to `MTController.IntelligentChatAsync()`
5. **Service Layer**: Controller calls `IntelligentMTService.GenerateIntelligentResponseAsync()`
6. **AI Processing**: Service sends prompt to Azure OpenAI GPT-4
7. **Response Processing**: AI response is parsed and structured
8. **Document Generation**: `mtDocumentService.ts` generates MT document HTML
9. **UI Update**: Chat interface displays response and document preview

### 2. MT Document Generation Flow
```
AI Response → Extract Data → Generate HTML → Display Modal → Download Option
```

## 🧩 Key Components Explained

### Backend Components

#### Program.cs - Application Startup
```csharp
// This file configures the entire .NET application
var builder = WebApplication.CreateBuilder(args);

// Register services in dependency injection container
builder.Services.AddScoped<IIntelligentMTService, IntelligentMTService>();

// Build and configure middleware pipeline
var app = builder.Build();
app.UseCors("AllowFrontend");  // Enable cross-origin requests
app.MapControllers();          // Route HTTP requests to controllers
app.Run();                     // Start the web server
```

**Key Concepts:**
- **Dependency Injection**: Services are registered and automatically injected where needed
- **Middleware Pipeline**: HTTP requests flow through middleware in specific order
- **Configuration**: Settings loaded from `appsettings.json`

#### MTController.cs - API Endpoints
```csharp
[ApiController]
[Route("api/[controller]")]
public class MTController : ControllerBase
{
    // Dependency injection through constructor
    public MTController(IIntelligentMTService intelligentService) { }
    
    // API endpoint that accepts POST requests
    [HttpPost("intelligent-chat")]
    public async Task<ActionResult<IntelligentChatResponse>> IntelligentChatAsync([FromBody] IntelligentChatRequest request)
    {
        // Call business logic service
        var response = await _intelligentService.GenerateIntelligentResponseAsync(request.Message);
        return Ok(response);  // Return HTTP 200 with response data
    }
}
```

**Key Concepts:**
- **REST API**: HTTP verbs (GET, POST) map to specific operations
- **Model Binding**: `[FromBody]` automatically deserializes JSON to C# objects
- **Async/Await**: Non-blocking operations for better performance
- **Action Results**: Standard HTTP responses (Ok, BadRequest, etc.)

#### IntelligentMTService.cs - Core Business Logic
```csharp
public class IntelligentMTService : IIntelligentMTService
{
    private readonly OpenAIClient _openAIClient;
    
    public async Task<string> GenerateIntelligentResponseAsync(string userMessage)
    {
        // Create chat completion request
        var chatCompletionsOptions = new ChatCompletionsOptions()
        {
            DeploymentName = "gpt-4",
            Messages = {
                new ChatRequestSystemMessage("You are an expert MT document analyzer..."),
                new ChatRequestUserMessage(userMessage)
            }
        };
        
        // Call Azure OpenAI
        var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
        return response.Value.Choices[0].Message.Content;
    }
}
```

**Key Concepts:**
- **Service Pattern**: Business logic separated from controllers
- **Azure OpenAI Integration**: Direct API calls to GPT-4
- **Prompt Engineering**: System messages guide AI behavior
- **Error Handling**: Try-catch blocks manage exceptions

### Frontend Components

#### ChatInterface_Pure.tsx - Main Chat Component
```tsx
export default function ChatInterface_Pure() {
    // React hooks for state management
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Function to handle user input
    const handleConversationalInput = async () => {
        setIsLoading(true);
        
        try {
            // Call backend API
            const response = await fetch('http://localhost:5000/api/mt/intelligent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputValue })
            });
            
            const result = await response.json();
            
            // Update UI with response
            setMessages(prev => [...prev, newMessage]);
            
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="chat-container">
            {/* Render messages */}
            {messages.map(message => (
                <div key={message.id} className="message">
                    {message.content}
                </div>
            ))}
            
            {/* Input area */}
            <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
            />
        </div>
    );
}
```

**Key Concepts:**
- **React Hooks**: `useState` manages component state, `useEffect` handles side effects
- **Event Handling**: Functions respond to user interactions
- **API Communication**: `fetch()` makes HTTP requests to backend
- **Conditional Rendering**: UI updates based on state changes
- **JSX**: JavaScript XML syntax for defining UI structure

#### mtDocumentService.ts - Document Management
```typescript
class MTDocumentService {
    private documentData: MTDocumentData = {};
    
    // Update document with new data
    updateDocument(data: Partial<MTDocumentData>): void {
        this.documentData = { ...this.documentData, ...data };
        this.notifyProgressUpdate();
    }
    
    // Generate HTML preview of the document
    generatePreviewHTML(): string {
        return `
            <div class="mt-document-container">
                <h1>MODIFICATION TRAVELER</h1>
                <table class="mt-table">
                    <tr>
                        <td>MT No:</td>
                        <td>${this.documentData.mtNumber || ''}</td>
                    </tr>
                    <!-- More table rows... -->
                </table>
            </div>
        `;
    }
    
    // Download document as DOCX file
    async downloadDocument(): Promise<void> {
        const blob = await this.generateDocxDocument();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MT_Document.docx';
        a.click();
    }
}

// Export singleton instance
export const mtDocumentService = MTDocumentService.getInstance();
```

**Key Concepts:**
- **Singleton Pattern**: One instance shared across the application
- **Template Literals**: Backticks (`) for multi-line strings with variables
- **Observer Pattern**: Callbacks notify components of changes
- **File Download**: Browser API to download generated files
- **Async/Await**: Handle asynchronous operations like file generation

## 🔗 Integration Points

### Backend to Azure OpenAI
```csharp
// Configuration from appsettings.json
{
    "AzureOpenAI": {
        "Endpoint": "https://your-resource.openai.azure.com/",
        "ApiKey": "your-api-key",
        "DeploymentName": "gpt-4"
    }
}

// Service registration in Program.cs
builder.Services.AddSingleton<OpenAIClient>(provider => {
    var endpoint = builder.Configuration["AzureOpenAI:Endpoint"];
    var apiKey = builder.Configuration["AzureOpenAI:ApiKey"];
    return new OpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
});
```

### Frontend to Backend API
```typescript
// API service for backend communication
export class MTAnalyzerAPI {
    private baseUrl = 'http://localhost:5000/api';
    
    async sendChatMessage(message: string): Promise<ChatResponse> {
        const response = await fetch(`${this.baseUrl}/MT/intelligent-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
}
```

## 🔧 Configuration Management

### Backend Configuration (appsettings.json)
```json
{
    "AzureOpenAI": {
        "Endpoint": "https://your-openai-resource.openai.azure.com/",
        "ApiKey": "your-api-key-here",
        "DeploymentName": "gpt-4",
        "ApiVersion": "2024-06-01"
    },
    "ConnectionStrings": {
        "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MTAnalysisDB;Trusted_Connection=true"
    },
    "Logging": {
        "LogLevel": {
            "Default": "Information"
        }
    }
}
```

### Frontend Environment Variables (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## 🎯 Key Patterns and Principles

### 1. Dependency Injection Pattern
**Purpose**: Loose coupling between components
```csharp
// Interface defines contract
public interface IIntelligentMTService {
    Task<string> GenerateResponseAsync(string input);
}

// Implementation provides actual functionality
public class IntelligentMTService : IIntelligentMTService {
    // Implementation here
}

// Controller receives interface, not concrete class
public MTController(IIntelligentMTService service) {
    _service = service;  // Can be any implementation of the interface
}
```

### 2. Repository Pattern (Database Layer)
```csharp
public interface IMTDocumentRepository {
    Task<MTDocument> GetByIdAsync(int id);
    Task<int> CreateAsync(MTDocument document);
    Task UpdateAsync(MTDocument document);
}

public class MTDocumentRepository : IMTDocumentRepository {
    private readonly ApplicationDbContext _context;
    // Database operations implementation
}
```

### 3. Service Layer Pattern
```csharp
// Controllers handle HTTP concerns
public class MTController {
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest request) {
        var result = await _service.AnalyzeAsync(request);  // Delegate to service
        return Ok(result);
    }
}

// Services handle business logic
public class IntelligentMTService {
    public async Task<AnalysisResult> AnalyzeAsync(AnalyzeRequest request) {
        // Complex business logic here
        // AI processing, data validation, etc.
    }
}
```

### 4. Observer Pattern (Frontend State Management)
```typescript
class MTDocumentService {
    private callbacks: ((data: MTDocumentData) => void)[] = [];
    
    // Subscribe to changes
    onDocumentUpdate(callback: (data: MTDocumentData) => void): void {
        this.callbacks.push(callback);
    }
    
    // Notify all subscribers when data changes
    private notifyUpdate(): void {
        this.callbacks.forEach(callback => callback(this.documentData));
    }
}
```

## 🚀 Performance Optimizations

### Backend Optimizations
1. **Async/Await**: Non-blocking operations
2. **Scoped Services**: Per-request instances
3. **Singleton OpenAI Client**: Reuse connection
4. **Response Caching**: Cache frequent requests

### Frontend Optimizations
1. **React.memo**: Prevent unnecessary re-renders
2. **useCallback**: Memoize event handlers
3. **Lazy Loading**: Dynamic imports for components
4. **Service Worker**: Cache API responses

## 🔍 Debugging and Monitoring

### Backend Logging
```csharp
public class IntelligentMTService {
    private readonly ILogger<IntelligentMTService> _logger;
    
    public async Task<string> ProcessAsync(string input) {
        _logger.LogInformation("Processing request with input length: {Length}", input.Length);
        
        try {
            var result = await _openAIClient.GetCompletionAsync(input);
            _logger.LogInformation("Successfully processed request");
            return result;
        }
        catch (Exception ex) {
            _logger.LogError(ex, "Error processing request");
            throw;
        }
    }
}
```

### Frontend Error Handling
```typescript
const handleApiCall = async () => {
    try {
        setIsLoading(true);
        const response = await api.sendMessage(message);
        setMessages(prev => [...prev, response]);
    } catch (error) {
        console.error('API call failed:', error);
        setError('Failed to send message. Please try again.');
    } finally {
        setIsLoading(false);
    }
};
```

## 📚 Learning Path

To fully understand this codebase:

1. **Start with Program.cs** - Understand application startup
2. **Study MTController.cs** - Learn API endpoint patterns
3. **Explore IntelligentMTService.cs** - Understand business logic
4. **Examine ChatInterface_Pure.tsx** - Learn React patterns
5. **Review mtDocumentService.ts** - Understand state management
6. **Practice with API calls** - Use Swagger UI to test endpoints

## 🔧 Common Debugging Scenarios

### "Service not registered" Error
**Problem**: Dependency injection can't find service
**Solution**: Check service registration in Program.cs
```csharp
// Missing this line in Program.cs
builder.Services.AddScoped<IMyService, MyService>();
```

### "CORS Error" in Frontend
**Problem**: Cross-origin request blocked
**Solution**: Verify CORS policy in Program.cs
```csharp
app.UseCors("AllowFrontend");  // Must come before UseAuthorization()
```

### "Cannot read properties of undefined"
**Problem**: State not initialized in React
**Solution**: Add null checks and default values
```typescript
const [data, setData] = useState<MyData | null>(null);
return data ? <Component data={data} /> : <Loading />;
```

This architecture provides a solid foundation for building enterprise-grade document analysis systems with modern web technologies and AI integration.