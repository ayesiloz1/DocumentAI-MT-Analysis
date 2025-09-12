# Configuration Templates for MT Document Analysis System

## Backend Configuration (appsettings.json)

Copy this template to `backend/appsettings.json` and fill in your Azure OpenAI details:

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://YOUR-RESOURCE-NAME.openai.azure.com/",
    "ApiKey": "YOUR-AZURE-OPENAI-API-KEY-HERE",
    "DeploymentName": "YOUR-GPT4-DEPLOYMENT-NAME",
    "ApiVersion": "2024-06-01"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MTAnalysisDB;Trusted_Connection=true;MultipleActiveResultSets=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

## Frontend Configuration (.env.local)

Copy this template to `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Add additional environment variables as needed
```

## Azure OpenAI Setup Steps

### 1. Create Azure OpenAI Resource
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure OpenAI"
4. Click "Create"
5. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Region**: Choose an available region (e.g., East US, West Europe)
   - **Name**: `mt-analyzer-openai` (or your preferred name)
   - **Pricing Tier**: Standard S0

### 2. Deploy GPT-4 Model
1. Go to [Azure OpenAI Studio](https://oai.azure.com/)
2. Select your resource
3. Go to "Deployments" tab
4. Click "Create new deployment"
5. Configure:
   - **Model**: Select `gpt-4` or `gpt-4-turbo`
   - **Deployment name**: `gpt4-mt-analyzer` (remember this name)
   - **Model version**: Use latest stable version
   - **Tokens per minute rate limit**: 10K (adjust based on needs)

### 3. Get API Credentials
1. In Azure Portal, go to your OpenAI resource
2. Go to "Keys and Endpoint" section
3. Copy:
   - **Endpoint**: `https://your-resource-name.openai.azure.com/`
   - **Key 1**: Your API key
   - **Deployment Name**: The name you created in step 2

### 4. Update Configuration
Replace placeholders in `backend/appsettings.json`:
- `YOUR-RESOURCE-NAME` → Your Azure OpenAI resource name
- `YOUR-AZURE-OPENAI-API-KEY-HERE` → Your API Key 1
- `YOUR-GPT4-DEPLOYMENT-NAME` → Your deployment name (e.g., `gpt4-mt-analyzer`)

## Database Configuration (Optional)

### Local Database (SQL Server LocalDB)
The default configuration uses SQL Server LocalDB which comes with Visual Studio:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MTAnalysisDB;Trusted_Connection=true;MultipleActiveResultSets=true;"
}
```

### Azure SQL Database
For production, use Azure SQL Database:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=tcp:your-server.database.windows.net,1433;Initial Catalog=MTAnalysisDB;Persist Security Info=False;User ID=your-username;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}
```

### PostgreSQL (Alternative)
If you prefer PostgreSQL:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=MTAnalysisDB;Username=your-username;Password=your-password"
}
```

## Environment-Specific Configurations

### Development (appsettings.Development.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

### Production (appsettings.Production.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "yourdomain.com,*.yourdomain.com"
}
```

## Security Best Practices

### 1. API Key Management
- Never commit API keys to source control
- Use Azure Key Vault for production
- Rotate keys regularly
- Use managed identities when possible

### 2. CORS Configuration
Update `Program.cs` for production:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", builder =>
    {
        builder.WithOrigins("https://yourdomain.com")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

### 3. HTTPS Configuration
Ensure HTTPS is enabled in production:
```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://*:443"
      }
    }
  }
}
```

## Testing Configuration

### Test API Key (for development only)
You can use a separate Azure OpenAI resource for testing to avoid quota limits.

### Mock Configuration (for CI/CD)
```json
{
  "AzureOpenAI": {
    "Endpoint": "https://mock-endpoint/",
    "ApiKey": "mock-key",
    "DeploymentName": "mock-deployment",
    "ApiVersion": "2024-06-01"
  }
}
```

## Troubleshooting Common Configuration Issues

### Issue: "Invalid API Key"
- Verify the API key is correct and not expired
- Check the endpoint URL format
- Ensure the resource is in the same subscription

### Issue: "Deployment not found"
- Verify the deployment name exactly matches
- Check the deployment is in "Succeeded" status
- Ensure the model is deployed in the correct region

### Issue: "Quota exceeded"
- Check your Azure OpenAI quota limits
- Consider upgrading your subscription
- Use rate limiting in your application

### Issue: "CORS errors"
- Verify CORS policy allows your frontend URL
- Check both HTTP and HTTPS URLs if needed
- Ensure credentials are included if required