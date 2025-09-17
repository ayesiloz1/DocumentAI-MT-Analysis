# Secure Configuration Setup

## ⚠️ IMPORTANT: No More Hardcoded Credentials!

This project now uses `.env` files for configuration. **Never put real API keys directly in `appsettings.json`**.

## 🔧 Development Setup (.env file)

### Step 1: Copy the template and add your credentials

```powershell
# Navigate to backend directory
cd backend

# Copy the template
copy .env.template .env

# Edit .env file with your actual credentials
notepad .env
```

### Step 2: Update .env with your Azure OpenAI credentials
```env
# Azure OpenAI Configuration
AZUREOPENAI__ENDPOINT=https://your-resource-name.openai.azure.com/
AZUREOPENAI__APIKEY=your-actual-api-key-here
AZUREOPENAI__DEPLOYMENTNAME=gpt-4
AZUREOPENAI__EMBEDDINGDEPLOYMENTNAME=text-embedding-ada-002
AZUREOPENAI__APIVERSION=2025-01-01-preview

# Application Settings
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000
```

### Step 3: Run the project
```powershell
dotnet run
```

## 🚀 Production Setup (Environment Variables)

### Option 1: Environment Variables
```powershell
# Set environment variables (Windows)
$env:AzureOpenAI__Endpoint = "https://your-resource-name.openai.azure.com/"
$env:AzureOpenAI__ApiKey = "your-actual-api-key-here"

# For Linux/macOS
export AzureOpenAI__Endpoint="https://your-resource-name.openai.azure.com/"
export AzureOpenAI__ApiKey="your-actual-api-key-here"
```

### Option 2: Azure App Service Configuration
1. Go to Azure Portal → App Service → Configuration
2. Add Application Settings:
   - Name: `AzureOpenAI__Endpoint`
   - Value: `https://your-resource-name.openai.azure.com/`
   - Name: `AzureOpenAI__ApiKey`
   - Value: `your-actual-api-key-here`

### Option 3: Azure Key Vault (Recommended for Production)
```json
{
  "AzureOpenAI": {
    "Endpoint": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/openai-endpoint/)",
    "ApiKey": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/openai-apikey/)"
  }
}
```

## 📋 Quick Setup Commands

### For New Developers
1. **Clone the repository**
2. **Copy template**: `cp appsettings.template.json appsettings.json` (if needed)
3. **Set your secrets**:
   ```powershell
   cd backend
   dotnet user-secrets set "AzureOpenAI:Endpoint" "YOUR_ENDPOINT_HERE"
   dotnet user-secrets set "AzureOpenAI:ApiKey" "YOUR_API_KEY_HERE"
   ```
4. **Run the project**: `dotnet run`

## 🔒 Security Benefits

✅ **No credentials in source control**  
✅ **Encrypted storage in development**  
✅ **Environment-specific configuration**  
✅ **Easy secret rotation**  
✅ **Team-friendly setup**

## 🗂️ File Structure

```
backend/
├── appsettings.json              # Public settings (no secrets)
├── appsettings.template.json     # Template with placeholders
├── appsettings.Development.json  # Dev-specific overrides
└── appsettings.Production.json   # Prod-specific overrides
```

## 🚨 Troubleshooting

### "Configuration value is null or empty"
- Verify your user secrets are set: `dotnet user-secrets list`
- Check environment variable names use double underscores: `AzureOpenAI__ApiKey`
- Ensure you're in the correct project directory

### "Invalid endpoint URL"
- Verify your endpoint includes `https://` and ends with `/`
- Check your Azure OpenAI resource name is correct

### "Authentication failed"
- Verify your API key is current and valid
- Check your Azure OpenAI resource has the required models deployed