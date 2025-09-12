# MT Document Analysis System - Complete Setup Guide

This guide will help you set up the MT Document Analysis system on a new computer from scratch.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
3. **Visual Studio Code** - [Download](https://code.visualstudio.com/)
4. **Git** - [Download](https://git-scm.com/)
5. **SQL Server** (optional for database features) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)

### Azure Services Required
1. **Azure OpenAI Service** with GPT-4 deployment
2. **Azure Account** with active subscription

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository
```bash
# Open terminal/command prompt
cd C:\
mkdir Personal_Projects
cd Personal_Projects

# Clone the repository
git clone https://github.com/yourusername/DocumentAI-MT-Analysis.git
cd DocumentAI-MT-Analysis
```

### Step 2: Backend Setup (.NET 8 API)

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Restore NuGet Packages
```bash
dotnet restore
```

#### 2.3 Configure Azure OpenAI Settings
Edit `appsettings.json`:
```json
{
  "AzureOpenAI": {
    "Endpoint": "https://your-openai-resource.openai.azure.com/",
    "ApiKey": "your-azure-openai-api-key",
    "DeploymentName": "your-gpt4-deployment-name",
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

#### 2.4 Build the Backend
```bash
dotnet build
```

#### 2.5 Run Database Migrations (if using database)
```bash
# Install EF Core tools if not already installed
dotnet tool install --global dotnet-ef

# Create and run migrations
dotnet ef migrations add InitialCreate
dotnet ef database update
```

#### 2.6 Test Backend
```bash
dotnet run
```
Backend should start on: `http://localhost:5000`

### Step 3: Frontend Setup (Next.js)

#### 3.1 Navigate to Frontend Directory
```bash
# Open new terminal window
cd C:\Personal_Projects\DocumentAI-MT-Analysis\frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Configure Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### 3.4 Build and Test Frontend
```bash
# Development mode
npm run dev
```
Frontend should start on: `http://localhost:3000`

### Step 4: Azure OpenAI Configuration

#### 4.1 Create Azure OpenAI Resource
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new resource → AI + Machine Learning → Azure OpenAI
3. Configure:
   - **Name**: `mt-analyzer-openai`
   - **Region**: Choose available region
   - **Pricing tier**: Standard S0

#### 4.2 Deploy GPT-4 Model
1. Go to Azure OpenAI Studio
2. Navigate to Deployments
3. Create new deployment:
   - **Model**: `gpt-4` or `gpt-4-turbo`
   - **Deployment name**: `gpt4-mt-analyzer`
   - **Version**: Latest stable

#### 4.3 Get API Credentials
1. Go to Keys and Endpoint section
2. Copy:
   - **Endpoint URL**
   - **API Key 1**
   - **Deployment Name**

### Step 5: Project Structure Overview

```
DocumentAI-MT-Analysis/
├── backend/                 # .NET 8 Web API
│   ├── Controllers/         # API endpoints
│   ├── Services/           # Business logic
│   ├── Models/             # Data models
│   ├── Program.cs          # App configuration
│   └── appsettings.json    # Configuration
├── frontend/               # Next.js React App
│   ├── src/
│   │   ├── app/           # Next.js 13+ app router
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS styles
│   │   └── utils/         # Utility functions
│   ├── package.json       # Dependencies
│   └── next.config.ts     # Next.js config
├── test_api.ps1           # API testing script
├── test_data.json         # Test data
└── README.md              # Project documentation
```

### Step 6: Testing the Complete System

#### 6.1 Start Both Services
```bash
# Terminal 1 - Backend
cd backend
dotnet run

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

#### 6.2 Run Automated Tests
```bash
# In project root directory
.\test_api.ps1
```

#### 6.3 Manual Testing
1. Open `http://localhost:3000`
2. Paste test paragraph:
```
I need to analyze a Modification Traveler document for upgrading the ventilation system in Building 241-AY-102 at the Hanford Site. This is Project Number WP-2024-0156 titled 'HVAC System Modernization for Tank Farm Operations'. The modification involves replacing outdated HEPA filtration units with new high-efficiency models to improve air quality and reduce contamination risks.
```
3. Verify MT document is generated with proper formatting

### Step 7: Production Deployment (Optional)

#### 7.1 Backend Deployment Options
- **Azure App Service**
- **IIS on Windows Server**
- **Docker containers**

#### 7.2 Frontend Deployment Options
- **Vercel** (recommended for Next.js)
- **Azure Static Web Apps**
- **Netlify**

## 🔧 Configuration Files You Need to Create

### backend/appsettings.json
```json
{
  "AzureOpenAI": {
    "Endpoint": "YOUR_AZURE_OPENAI_ENDPOINT",
    "ApiKey": "YOUR_AZURE_OPENAI_KEY",
    "DeploymentName": "YOUR_GPT4_DEPLOYMENT_NAME",
    "ApiVersion": "2024-06-01"
  },
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_DATABASE_CONNECTION_STRING"
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

### frontend/.env.local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot find module 'pdf-lib'"
**Solution:**
```bash
cd frontend
npm install pdf-lib
```

### Issue 2: Azure OpenAI API errors
**Solution:**
- Verify API key and endpoint in `appsettings.json`
- Check deployment name matches exactly
- Ensure quota is not exceeded

### Issue 3: CORS errors
**Solution:**
- Verify CORS configuration in `Program.cs`
- Check frontend URL is allowed

### Issue 4: Database connection errors
**Solution:**
```bash
# Update database
dotnet ef database update

# If migrations missing
dotnet ef migrations add InitialCreate
```

## 📝 Development Workflow

### Daily Development
1. Start backend: `cd backend && dotnet run`
2. Start frontend: `cd frontend && npm run dev`
3. Make changes
4. Test with `.\test_api.ps1`

### Before Committing
1. Run tests: `.\test_api.ps1`
2. Check linting: `cd frontend && npm run lint`
3. Build both projects to verify no errors

## 🔐 Security Notes

### API Keys
- Never commit API keys to source control
- Use environment variables or Azure Key Vault
- Rotate keys regularly

### Database
- Use strong connection strings
- Enable SSL/TLS for production
- Regular backups

## 📞 Support

### Documentation
- See `README.md` for project overview
- Check `TEST_CASES.md` for testing scenarios
- Review `CONTRIBUTING.md` for development guidelines

### Common Commands
```bash
# Backend
dotnet build          # Build project
dotnet run            # Run development server
dotnet ef --help      # Database commands

# Frontend  
npm install           # Install dependencies
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Run linting
```

## ✅ Verification Checklist

- [ ] Node.js and .NET 8 installed
- [ ] Repository cloned successfully
- [ ] Backend builds without errors
- [ ] Frontend dependencies installed
- [ ] Azure OpenAI configured correctly
- [ ] Database connection working (if using)
- [ ] Both services start successfully
- [ ] API tests pass
- [ ] MT document generation works
- [ ] UI displays correctly

## 🎯 Next Steps After Setup

1. **Customize for your organization**
   - Update branding and styling
   - Configure specific MT form requirements
   - Add organization-specific validation rules

2. **Enhance functionality**
   - Add user authentication
   - Implement approval workflows
   - Add document templates

3. **Deploy to production**
   - Set up CI/CD pipelines
   - Configure monitoring and logging
   - Implement backup strategies

---

**Estimated Setup Time**: 2-3 hours for complete setup
**Difficulty Level**: Intermediate (requires basic knowledge of .NET and Node.js)

For additional help, refer to the project documentation or create an issue in the repository.