# 🔍 Azure Cognitive Search Setup Guide

## Step 1: Create Azure Cognitive Search Service

### **Option A: Azure Portal (Recommended)**
1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"+ Create a resource"**
3. Search for **"Azure Cognitive Search"**
4. Click **"Create"**

### **Fill in the details:**
```
Subscription: Your subscription
Resource Group: Same as your OpenAI service
Service Name: documentai-search (or any unique name)
Location: Same region as your OpenAI service (for best performance)
Pricing Tier: Basic (sufficient for testing, ~$250/month)
```

5. Click **"Review + Create"** → **"Create"**
6. Wait 2-3 minutes for deployment

### **Option B: Quick CLI Commands**
```bash
# Create search service
az search service create \
  --name documentai-search \
  --resource-group your-resource-group \
  --sku Basic \
  --location eastus
```

## Step 2: Get Your Search Service Details

After creation:
1. Go to your new search service in Azure Portal
2. Copy these values:
   - **URL**: https://documentai-search.search.windows.net
   - **Admin Key**: Go to "Keys" → Copy "Primary admin key"

## Step 3: Update Your Configuration

Update `appsettings.json` with real values:
```json
{
  "AzureCognitiveSearch": {
    "Endpoint": "https://documentai-search.search.windows.net",
    "ApiKey": "YOUR_ACTUAL_ADMIN_KEY_HERE",
    "IndexName": "mt-knowledge-base",
    "SemanticConfigName": "mt-semantic-config"
  }
}
```

## Step 4: Create the Knowledge Base Index

We'll create an index specifically for nuclear MT knowledge:

### **Index Schema:**
- **Document ID**
- **Title** (regulation name, procedure title)
- **Content** (full text)
- **Type** (regulation, procedure, precedent, equipment-spec)
- **Tags** (equipment types, MT types)
- **Confidence** (how authoritative the source is)

### **Documents to Index:**
1. **Nuclear Regulations**: 10 CFR 50.59, related guidance
2. **Equipment Specifications**: Fisher 667ED specs, common valve types
3. **Historical MT Decisions**: Past Type V classifications
4. **Procedures**: Your facility's MT procedures

## Step 5: Test the Setup

Once configured, your system will:
1. **Understand context** from regulations
2. **Cite specific sections** in responses
3. **Reference precedent** decisions
4. **Provide authoritative** guidance

---

## Quick Test Commands

After setup, test with:
```
"What does 10 CFR 50.59 say about identical replacements?"
```

Expected: AI will search the indexed regulations and provide specific citations!
