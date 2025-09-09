import React, { useState, useEffect } from 'react';
import questionnaire from '../data/mt-questionnaire.json';
import { MTAnalysisResponse } from '../services/mtAnalyzerAPI';
import { mtDocumentService } from '../services/mtDocumentService';

interface MTQuestionnaireFormProps {
  onAnalysisComplete: (analysis: MTAnalysisResponse) => void;
}

interface QuestionnaireData {
  modificationTravelerQuestionnaire: {
    version: string;
    description: string;
    sections: Section[];
    validation_rules: any;
    guidance_text: any;
  };
}

interface Section {
  sectionNumber: number;
  sectionTitle: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  rows?: number;
  conditional?: {
    depends_on: string;
    show_when: string[];
  };
}

interface FormData {
  [key: string]: any;
}

const MTQuestionnaireForm: React.FC<MTQuestionnaireFormProps> = ({ onAnalysisComplete }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [showGuidance, setShowGuidance] = useState(false);
  const [mtAnalysis, setMtAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const data = questionnaire as QuestionnaireData;
  const sections = data.modificationTravelerQuestionnaire.sections;

  const updateFormData = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Update document in real-time as user fills form
    const documentUpdate: any = {};
    
    // Map questionnaire fields to document fields
    switch (questionId) {
      case 'project_number':
        documentUpdate.projectNumber = value;
        break;
      case 'project_title':
        documentUpdate.projectTitle = value;
        break;
      case 'requested_by':
        documentUpdate.requestedBy = value;
        break;
      case 'organization':
        documentUpdate.organization = value;
        break;
      case 'problem_description':
        documentUpdate.problemDescription = value;
        break;
      case 'proposed_solution':
        documentUpdate.proposedSolution = value;
        break;
      case 'justification':
        documentUpdate.justification = value;
        break;
      case 'safety_classification':
        documentUpdate.safetyClassification = value;
        break;
      case 'hazard_category':
        documentUpdate.hazardCategory = value;
        break;
    }
    
    // Update the document service if we have relevant data
    if (Object.keys(documentUpdate).length > 0) {
      documentUpdate.requestDate = new Date().toLocaleDateString();
      mtDocumentService.updateDocument(documentUpdate);
    }
  };

  const shouldShowQuestion = (question: Question): boolean => {
    if (!question.conditional) return true;
    
    const dependentValue = formData[question.conditional.depends_on];
    return question.conditional.show_when.includes(dependentValue);
  };

  const renderQuestion = (question: Question) => {
    if (!shouldShowQuestion(question)) return null;

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            id={question.id}
            className="mt-form-input"
            placeholder={question.placeholder}
            value={formData[question.id] || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={question.id}
            className="mt-form-input"
            value={formData[question.id] || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={question.id}
            rows={question.rows || 3}
            className="mt-form-input"
            placeholder={question.placeholder}
            value={formData[question.id] || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={formData[question.id] === option.value}
                  onChange={(e) => updateFormData(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            id={question.id}
            className="w-full p-3 border-2 border-gray-600 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData[question.id] || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(formData[question.id] || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = formData[question.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    updateFormData(question.id, newValues);
                  }}
                  className="text-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={question.id}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={question.placeholder}
            value={formData[question.id] || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
          />
        );
    }
  };

  const generateMTAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/enhanced-mt/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemDescription: formData.problem_description || '',
          proposedSolution: formData.proposed_solution || '',
          projectNumber: formData.project_number || '',
          projectType: formData.project_type || '',
          designAuthority: 'TBD',
          justification: formData.justification || '',
          safetyClassification: formData.safety_classification || '',
          hazardCategory: formData.hazard_category || '',
          isTemporary: formData.is_temporary === 'yes',
          isPhysicalChange: formData.is_physical_change === 'yes',
          isIdenticalReplacement: formData.is_identical_replacement === 'yes',
          requiresNewProcedures: formData.requires_new_procedures === 'yes',
          requiresHoistingRigging: formData.requires_hoisting_rigging === 'yes'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMtAnalysis(result.enhancedAnalysis || 'Analysis completed successfully.');
        
        // Create MTAnalysisResponse object for callback
        const analysisResponse: MTAnalysisResponse = {
          analysisId: `questionnaire-${Date.now()}`,
          timestamp: new Date().toISOString(),
          projectNumber: formData.project_number || 'Unknown',
          mtRequired: result.mtRequired || true,
          mtRequiredReason: result.mtRequiredReason || 'Based on questionnaire responses',
          designType: result.designType || 2,
          designInputs: {
            problemStatement: formData.problem_description || '',
            proposedSolution: formData.proposed_solution || '',
            designConstraints: [],
            safetyRequirements: [],
            environmentalConsiderations: [],
            operationalImpacts: []
          },
          expectedOutputs: [],
          impactedDocuments: [],
          missingElements: [],
          inconsistencies: [],
          suggestedActions: result.suggestedActions || [],
          attachmentAChecklist: {
            a1DesignOutputCheck: { items: [], completionPercentage: 0, riskLevel: 'Medium' },
            a2EngineeringImpacts: { items: [], completionPercentage: 0, riskLevel: 'Medium' },
            a3NonEngineeringImpacts: { items: [], completionPercentage: 0, riskLevel: 'Low' },
            a4SystemAcceptability: { items: [], completionPercentage: 0, riskLevel: 'Medium' },
            a5InterfaceReviews: { items: [], completionPercentage: 0, riskLevel: 'Medium' }
          },
          riskAssessment: {
            overallRisk: 'Medium',
            safetyRisk: 'Medium',
            environmentalRisk: 'Low',
            operationalRisk: 'Medium',
            riskFactors: [],
            mitigationRecommendations: []
          },
          confidence: result.confidence || 85.0
        };
        
        // Call the callback to pass analysis to parent component
        onAnalysisComplete(analysisResponse);
        
        // Update the document service with complete analysis
        mtDocumentService.fromAnalysisResponse(analysisResponse, formData);
      } else {
        setMtAnalysis('Error performing analysis. Please check your inputs and try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMtAnalysis('Error connecting to analysis service. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCompletionPercentage = () => {
    const allQuestions = sections.flatMap(section => section.questions);
    const answeredQuestions = allQuestions.filter(q => 
      shouldShowQuestion(q) && formData[q.id] && formData[q.id] !== ''
    );
    return Math.round((answeredQuestions.length / allQuestions.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧠 Smart MT Analysis System
        </h1>
        <p className="text-gray-600 mb-4">
          {data.modificationTravelerQuestionnaire.description}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          Completion: {getCompletionPercentage()}%
        </p>
      </div>

      {/* Section Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                currentSection === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.sectionNumber}. {section.sectionTitle}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Section {sections[currentSection].sectionNumber}: {sections[currentSection].sectionTitle}
        </h2>

        <div className="space-y-6">
          {sections[currentSection].questions.map((question) => (
            shouldShowQuestion(question) && (
              <div key={question.id} className="space-y-3 mb-6">
                <label className="mt-form-label">
                  {question.question}
                  {question.required && <span className="mt-required-asterisk">*</span>}
                </label>
                {renderQuestion(question)}
              </div>
            )
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">
          Section {currentSection + 1} of {sections.length}
        </span>

        <button
          onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
          disabled={currentSection === sections.length - 1}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Analysis Button */}
      <div className="mb-8">
        <button
          onClick={generateMTAnalysis}
          disabled={isAnalyzing || getCompletionPercentage() < 20}
          className="mt-button-primary"
        >
          {isAnalyzing ? '🔍 Analyzing with AI...' : '🧠 Generate Smart MT Analysis'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Complete at least 20% of the form to generate enhanced AI analysis
        </p>
      </div>

      {/* Analysis Results */}
      {mtAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            🤖 Enhanced MT Analysis Results
          </h3>
          <div className="prose max-w-none text-gray-700">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{mtAnalysis}</pre>
          </div>
        </div>
      )}

      {/* Guidance Panel */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <button
          onClick={() => setShowGuidance(!showGuidance)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">
            📚 Design Type Guidance
          </h3>
          <span className="text-gray-500">
            {showGuidance ? '−' : '+'}
          </span>
        </button>
        
        {showGuidance && (
          <div className="mt-4 space-y-3">
            {Object.entries(data.modificationTravelerQuestionnaire.guidance_text.design_types).map(([type, description]) => (
              <div key={type} className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-medium text-gray-900">Type {type}</h4>
                <p className="text-gray-600 text-sm">{String(description)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample Data Button */}
      <div className="mt-6">
        <button
          onClick={() => {
            setFormData({
              title: "A/AX Retrieval Project - Chemical Addition Manifold Frame",
              project_number: "T2R02",
              design_type: "IV",
              project_type: "Retrieval",
              problem_description: "A chemical manifold is needed to support A and AX retrievals. The system was designed to be installed on location. The project has directed that the manifold be built off site. The current design has not been analyzed for hoisting and rigging nor shipping.",
              justification: "The current frame, as designed, needs to be analyzed and potentially modified to support off site fabrication. This manifold and the proposed analysis are needed to support A and AX retrievals.",
              proposed_solution: "Vendor to provide analysis and modifications (as necessary) to the support structure of the manifold to support offsite fabrication.",
              safety_classification: "GS",
              environmental_risk: "yes",
              radiological_risk: "no",
              is_physical_change: "yes",
              is_temporary: "no",
              is_identical_replacement: "no",
              requires_hoisting_rigging: "yes"
            });
            setCurrentSection(0);
          }}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          📄 Load Sample MT Data (Hanford A/AX Project)
        </button>
      </div>
    </div>
  );
};

export default MTQuestionnaireForm;
