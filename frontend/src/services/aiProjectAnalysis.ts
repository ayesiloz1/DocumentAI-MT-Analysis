// ============================================================================
// AI-BASED ANALYSIS SERVICE
// Dynamic project analysis using AI instead of hardcoded mappings
// ============================================================================

interface ProjectAnalysisRequest {
  problemDescription: string;
  conversationContext?: string;
  facility?: string;
  additionalContext?: any;
}

interface ProjectAnalysisResult {
  relatedSystems: string;
  relatedBuildings: string;
  relatedEquipment: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  projectType: string;
  cacn: string;
  safetyClassification: string;
  estimatedComplexity: string;
  recommendedApproach: string;
  potentialRisks: string[];
  requiredApprovals: string[];
  confidence: number; // 0-1 scale
}

export class AIProjectAnalysisService {
  private apiEndpoint: string;
  
  constructor(apiEndpoint: string = 'http://localhost:5000/api/MT/intelligent-chat') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Analyze project requirements using AI instead of hardcoded rules
   */
  async analyzeProject(request: ProjectAnalysisRequest): Promise<ProjectAnalysisResult> {
    const analysisPrompt = this.buildAnalysisPrompt(request);
    
    try {
      // Call existing backend intelligent chat endpoint
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: analysisPrompt,
          conversationHistory: JSON.stringify([]),
          context: request
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const aiResult = await response.json();
      // Parse the intelligent chat response
      const aiResponseText = aiResult.response || aiResult.Response || aiResult;
      return this.parseAIResponse(aiResponseText, request);
      
    } catch (error) {
      console.error('AI project analysis failed:', error);
      return this.getFallbackAnalysis(request);
    }
  }

  private buildAnalysisPrompt(request: ProjectAnalysisRequest): string {
    return `
Analyze the following nuclear facility modification request and provide detailed project information:

PROBLEM DESCRIPTION: ${request.problemDescription}

CONVERSATION CONTEXT: ${request.conversationContext || 'None provided'}

FACILITY: ${request.facility || 'Nuclear facility'}

Please analyze this request and provide:

1. RELATED SYSTEMS: Identify all nuclear systems that could be affected by this modification
2. RELATED BUILDINGS: Specify which facility buildings/areas will be involved
3. RELATED EQUIPMENT: List specific equipment, components, and instrumentation involved
4. PRIORITY: Assess priority level (Low/Medium/High/Critical) based on safety significance
5. PROJECT TYPE: Categorize the type of modification (e.g., "Safety System Upgrade", "Component Replacement", etc.)
6. CACN: Generate an appropriate Cost Account Charge Number following nuclear industry standards
7. SAFETY CLASSIFICATION: Determine safety class (Safety-Related, Important-to-Safety, etc.)
8. COMPLEXITY: Assess project complexity (Simple/Moderate/Complex/Highly Complex)
9. APPROACH: Recommend implementation approach
10. RISKS: Identify potential technical and safety risks
11. APPROVALS: List required regulatory and internal approvals
12. CONFIDENCE: Rate your confidence in this analysis (0.0-1.0)

Provide comprehensive, technically accurate responses suitable for nuclear modification documentation.
Focus on safety, regulatory compliance, and technical feasibility.

IMPORTANT: Base your analysis on nuclear industry standards, regulatory requirements (10 CFR, etc.), and safety principles.
`;
  }

  private parseAIResponse(aiResponseText: string, request: ProjectAnalysisRequest): ProjectAnalysisResult {
    try {
      // Parse the AI text response
      const analysis = typeof aiResponseText === 'string' ? aiResponseText : JSON.stringify(aiResponseText);
      
      return {
        relatedSystems: this.extractValue(analysis, 'RELATED SYSTEMS', 'Systems identified through AI analysis'),
        relatedBuildings: this.extractValue(analysis, 'RELATED BUILDINGS', 'Buildings identified through AI analysis'),
        relatedEquipment: this.extractValue(analysis, 'RELATED EQUIPMENT', 'Equipment identified through AI analysis'),
        priority: this.extractPriority(analysis),
        projectType: this.extractValue(analysis, 'PROJECT TYPE', 'AI-Determined Project Type'),
        cacn: this.extractValue(analysis, 'CACN', this.generateDynamicCACN()),
        safetyClassification: this.extractValue(analysis, 'SAFETY CLASSIFICATION', 'To Be Determined'),
        estimatedComplexity: this.extractValue(analysis, 'COMPLEXITY', 'Moderate'),
        recommendedApproach: this.extractValue(analysis, 'APPROACH', 'Standard modification process'),
        potentialRisks: this.extractArray(analysis, 'RISKS'),
        requiredApprovals: this.extractArray(analysis, 'APPROVALS'),
        confidence: this.extractConfidence(analysis)
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackAnalysis(request);
    }
  }

  private extractValue(text: string, section: string, defaultValue: string): string {
    const regex = new RegExp(`${section}:?\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : defaultValue;
  }

  private extractPriority(text: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const priorityMatch = text.match(/PRIORITY:?\s*(Low|Medium|High|Critical)/i);
    if (priorityMatch) {
      return priorityMatch[1] as 'Low' | 'Medium' | 'High' | 'Critical';
    }
    
    // AI-based priority detection
    const lowerText = text.toLowerCase();
    if (lowerText.includes('safety') && lowerText.includes('critical')) return 'Critical';
    if (lowerText.includes('emergency') || lowerText.includes('reactor')) return 'High';
    if (lowerText.includes('important') || lowerText.includes('significant')) return 'Medium';
    return 'Medium';
  }

  private extractArray(text: string, section: string): string[] {
    const regex = new RegExp(`${section}:?\\s*([^\\n]+(?:\\n\\s*-[^\\n]+)*)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    return match[1]
      .split(/\n\s*-/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/CONFIDENCE:?\s*([0-9.]+)/i);
    if (confidenceMatch) {
      return Math.max(0, Math.min(1, parseFloat(confidenceMatch[1])));
    }
    return 0.8; // Default confidence
  }

  private generateDynamicCACN(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${year}-AI-${randomNum}`;
  }

  private getFallbackAnalysis(request: ProjectAnalysisRequest): ProjectAnalysisResult {
    return {
      relatedSystems: 'System analysis pending detailed engineering review',
      relatedBuildings: 'Building assessment pending site survey',
      relatedEquipment: 'Equipment identification pending technical analysis',
      priority: 'Medium',
      projectType: 'Modification - Type To Be Determined',
      cacn: this.generateDynamicCACN(),
      safetyClassification: 'To Be Determined',
      estimatedComplexity: 'To Be Assessed',
      recommendedApproach: 'Standard engineering analysis and review process',
      potentialRisks: ['Technical feasibility assessment required', 'Regulatory review needed'],
      requiredApprovals: ['Engineering approval', 'Safety review'],
      confidence: 0.5
    };
  }

  /**
   * Quick analysis for real-time UI updates
   */
  async quickAnalyze(problemDescription: string): Promise<Partial<ProjectAnalysisResult>> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Quickly analyze this nuclear modification: "${problemDescription}". Provide: system type, priority level, project category.`,
          conversationHistory: JSON.stringify([])
        })
      });

      if (response.ok) {
        const result = await response.json();
        const aiText = result.response || result.Response || '';
        return {
          projectType: this.extractValue(aiText, 'PROJECT TYPE', 'Analysis in progress'),
          priority: this.extractPriority(aiText) || 'Medium',
          relatedSystems: this.extractValue(aiText, 'RELATED SYSTEMS', 'Analysis in progress')
        };
      }
    } catch (error) {
      console.error('Quick analysis failed:', error);
    }

    return {
      projectType: 'AI Analysis in Progress',
      priority: 'Medium',
      relatedSystems: 'Analyzing...'
    };
  }
}

// Export singleton instance
export const aiProjectAnalysis = new AIProjectAnalysisService();

// Export for dependency injection/testing
export default AIProjectAnalysisService;