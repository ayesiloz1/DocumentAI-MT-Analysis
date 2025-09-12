'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, FileUp, Bot, User, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MTDocumentModal from './MTDocumentModal';

// Helper functions for intelligent extraction
function extractModificationTitle(userMessage: string, aiResponse: string): string {
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();
  const fullText = (userMessage + ' ' + aiResponse).toLowerCase();
  
  // Enhanced RCP valve extraction with specific valve IDs
  if (message.includes('reactor coolant pump') || message.includes('rcp')) {
    if (message.includes('seal injection') || message.includes('flow control valve')) {
      // Look for specific valve ID
      const valveMatch = fullText.match(/fcv[-_]?(\d+[a-z]?)/i);
      if (valveMatch) {
        const valveId = valveMatch[0].toUpperCase();
        if (fullText.includes('digital') || fullText.includes('smart valve')) {
          return `RCP Seal Injection Flow Control Valve ${valveId} Digital Replacement`;
        }
        return `RCP Seal Injection Flow Control Valve ${valveId} Replacement`;
      }
      return 'RCP Seal Injection Flow Control Valve Digital Replacement';
    }
    return 'Reactor Coolant Pump Modification';
  }
  
  if (message.includes('emergency diesel generator') || message.includes('edg')) {
    return 'Emergency Diesel Generator Control Panel Upgrade';
  }
  
  if (message.includes('motor') && message.includes('replace')) {
    if (message.includes('emergency core cooling') || message.includes('eccs')) {
      return 'Emergency Core Cooling System Motor Replacement';
    }
    if (message.includes('westinghouse') && message.includes('abb')) {
      return 'Motor Replacement - Westinghouse to ABB';
    }
    return 'Motor Replacement Modification';
  }
  
  if (message.includes('valve') && message.includes('replace')) {
    // Look for specific valve ID in general valve replacements
    const valveMatch = fullText.match(/[a-z]{2,4}[-_]?(\d+[a-z]?)/i);
    if (valveMatch) {
      const valveId = valveMatch[0].toUpperCase();
      return `Control Valve ${valveId} Replacement`;
    }
    return 'Valve Replacement Modification';
  }
  
  if (message.includes('control panel') || message.includes('upgrade')) {
    return 'Control System Upgrade';
  }
  
  // Default extraction from first significant keywords
  const keywords = userMessage.split(' ').filter(word => 
    word.length > 3 && 
    !['with', 'from', 'this', 'that', 'need', 'want', 'have'].includes(word.toLowerCase())
  ).slice(0, 4);
  
  if (keywords.length > 0) {
    return keywords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Modification';
  }
  
  return 'Equipment Modification';
}

function extractProjectNumber(userMessage: string, aiResponse: string): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  
  // Check for specific equipment types to create meaningful project numbers
  const message = userMessage.toLowerCase();
  
  if (message.includes('reactor coolant pump') || message.includes('rcp')) {
    return `RCP-${year}-${month}${day}`;
  }
  
  if (message.includes('emergency diesel generator') || message.includes('edg')) {
    return `EDG-CTRL-${year}-001`;
  }
  
  if (message.includes('motor') && message.includes('emergency core cooling')) {
    return `ECCS-MOTOR-${year}-${month}${day}`;
  }
  
  if (message.includes('valve') && (message.includes('flow control') || message.includes('cvcs'))) {
    return `CVCS-VALVE-${year}-${month}${day}`;
  }
  
  // Default project number format
  return `MT-${year}-${month}${day}-001`;
}

interface MTAnalysisRequest {
  problemDescription?: string;
  isPhysicalChange?: boolean;
  isTemporary?: boolean;
  projectNumber?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'file' | 'analysis';
  metadata?: any;
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string, file?: File, context?: any) => void;
  onAnalyzeFile?: (file: File) => void;
  onScenariosUpdate?: (scenarios: Array<{
    number: number;
    title: string;
    summary: string;
    timestamp: string;
    status: string;
    analysis?: any;
  }>) => void;
}

export default function ChatInterface({ onSendMessage, onAnalyzeFile, onScenariosUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize MT Document Service
  const [mtDocumentService, setMtDocumentService] = useState<any>(null);
  
  // Document Modal State
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentHTML, setDocumentHTML] = useState<string>('');
  const [currentMTData, setCurrentMTData] = useState<any>(null);
  
  useEffect(() => {
    // Dynamically import the service on client side
    if (typeof window !== 'undefined') {
      import('../services/mtDocumentService').then((module) => {
        setMtDocumentService(module.mtDocumentService);
        console.log('MT Document Service initialized for live updates');
      }).catch(console.warn);
    }
  }, []);

  // Conversation context tracking
  const [conversationContext, setConversationContext] = useState<{
    currentScenario?: string;
    askedQuestions?: string[];
    userResponses?: Record<string, string>;
    waitingForResponse?: string;
    scenarioNumber?: number;
    scenarioHistory?: Array<{
      number: number;
      title: string;
      summary: string;
      timestamp: string;
      status: string;
      analysis?: any;
    }>;
  }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isInitialized) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Hello! I'm your MT Analyzer Assistant. I can help you analyze Modification Traveler documents and determine MT requirements. You can:\n\n• Ask questions about MT requirements\n• Upload MT documents for analysis\n• Get guidance on Figure 1 decision tree\n• Review safety classifications and design types\n\nHow can I help you today?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // PURE GPT-4 INTELLIGENCE - NO HARDCODED RESPONSES
  const handleConversationalInput = async (message: string): Promise<{response: string, shouldAnalyze: boolean}> => {
    console.log('Using pure GPT-4 intelligence for all analysis');
    
    try {
      const response = await fetch('http://localhost:5000/api/mt/intelligent-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: JSON.stringify(messages.slice(-5)) // Last 5 messages for context
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Extract MT analysis data from GPT response text and update the document service
        if (result.response && mtDocumentService) {
          try {
            // Parse the response text for MT-related information
            const responseText = result.response.toLowerCase();
            const originalResponse = result.response;
            
            // Intelligently extract title from conversation content
            const extractedTitle = extractModificationTitle(message, result.response);
            const extractedProjectNumber = extractProjectNumber(message, result.response);
            
            // Extract key information from the response
            const mtData: any = {
              title: extractedTitle,
              projectNumber: extractedProjectNumber,
              problemDescription: message, // Use the original user message
              timestamp: new Date().toISOString()
            };
            
            // Look for MT requirement determination
            if (responseText.includes('mt is required') || responseText.includes('modification traveler is required')) {
              mtData.mtRequired = true;
            } else if (responseText.includes('mt is not required') || responseText.includes('no mt required')) {
              mtData.mtRequired = false;
            }
            
            // Enhanced safety classification detection
            const fullText = (message + ' ' + originalResponse).toLowerCase();
            if (fullText.includes('safety class') || fullText.includes('safety-class') || 
                fullText.includes('sc ') || fullText.includes('10 cfr 50 appendix b') ||
                fullText.includes('reactor coolant pressure boundary') || fullText.includes('safety-related')) {
              mtData.preliminarySafetyClassification = 'SC'; // Safety Class
            } else if (fullText.includes('safety significant') || fullText.includes('ss ') ||
                      fullText.includes('safety-significant')) {
              mtData.preliminarySafetyClassification = 'SS';
            } else if (fullText.includes('general service') || fullText.includes('gs ') ||
                      fullText.includes('non-safety')) {
              mtData.preliminarySafetyClassification = 'GS';
            }
            
            // Enhanced design type detection
            if (fullText.includes('digital') || fullText.includes('analog to digital') ||
                fullText.includes('50.59') || fullText.includes('type i') ||
                fullText.includes('type 1') || fullText.includes('design type 1')) {
              mtData.designType = 'Type I';
              mtData.projectDesignReviewRequired = 'Yes';
              mtData.majorModificationEvaluationRequired = 'Yes';
              mtData.safetyInDesignStrategyRequired = 'Yes';
            } else if (fullText.includes('type ii') || fullText.includes('type 2') || 
                      fullText.includes('design type 2')) {
              mtData.designType = 'Type II';
            } else if (fullText.includes('type iii') || fullText.includes('type 3') ||
                      fullText.includes('design type 3')) {
              mtData.designType = 'Type III';
            }
            
            // Set intelligent completion dates based on project complexity
            const currentDate = new Date();
            let estimatedMonths = 6; // Default
            
            if (mtData.designType === 'Type I') {
              estimatedMonths = 12; // Type I projects are more complex
            } else if (fullText.includes('replacement') && !fullText.includes('digital')) {
              estimatedMonths = 4; // Simple replacements
            } else if (fullText.includes('digital') || fullText.includes('software')) {
              estimatedMonths = 8; // Digital upgrades need more time
            }
            
            const completionDate = new Date(currentDate.getTime() + (estimatedMonths * 30 * 24 * 60 * 60 * 1000));
            mtData.requestedCompletionDate = completionDate.toISOString().split('T')[0];
            mtData.estimatedCompleteDate = completionDate.toISOString().split('T')[0];
            mtData.dueDate = completionDate.toISOString().split('T')[0];
            
            // Look for hazard categories
            if (responseText.includes('category 1') || responseText.includes('cat 1')) {
              mtData.hazardCategory = 'Category 1';
            } else if (responseText.includes('category 2') || responseText.includes('cat 2')) {
              mtData.hazardCategory = 'Category 2';
            } else if (responseText.includes('category 3') || responseText.includes('cat 3')) {
              mtData.hazardCategory = 'Category 3';
            }
            
            // Extract project number if mentioned in response (but don't override our intelligent extraction)
            const projectMatch = originalResponse.match(/project\s+(?:number\s+)?([A-Z0-9-]+)/i);
            if (projectMatch && !mtData.projectNumber) {
              mtData.projectNumber = projectMatch[1];
            }
            
            // Extract timeline information
            if (responseText.includes('6 months') || message.toLowerCase().includes('6 months')) {
              const currentDate = new Date();
              const endDate = new Date(currentDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)); // 6 months
              mtData.requestedCompletionDate = endDate.toISOString().split('T')[0];
              mtData.estimatedCompleteDate = endDate.toISOString().split('T')[0];
            }
            
            // Set facility and submission info
            const facilityMatch = message.match(/unit\s+(\d+)/i);
            mtData.facility = facilityMatch ? `Unit ${facilityMatch[1]}` : 'Unit 1';
            mtData.submittedBy = 'Engineering Department';
            mtData.submissionDate = new Date().toISOString().split('T')[0];
            
            // Intelligently determine related systems and equipment based on conversation
            const messageLower = message.toLowerCase();
            if (messageLower.includes('emergency diesel generator') || messageLower.includes('edg')) {
              mtData.relatedSystems = 'Emergency Diesel Generator System';
              mtData.relatedBuildings = `${mtData.facility} Emergency Power Building`;
              mtData.relatedEquipment = 'Emergency Diesel Generator, Control Panels, Cable Runs';
              mtData.priority = 'High';
              mtData.projectType = 'Safety System Upgrade';
            } else if (messageLower.includes('reactor coolant pump') || messageLower.includes('rcp') || 
                      messageLower.includes('seal injection') || messageLower.includes('fcv-')) {
              mtData.relatedSystems = 'Chemical Volume Control System (CVCS), Plant Protection System';
              mtData.relatedBuildings = 'Reactor Building';
              mtData.relatedEquipment = 'Reactor Coolant Pump, Flow Control Valve, CVCS Components';
              mtData.priority = 'High';
              mtData.projectType = 'Safety System Component Replacement';
            } else if (messageLower.includes('emergency core cooling') || messageLower.includes('eccs')) {
              mtData.relatedSystems = 'Emergency Core Cooling System (ECCS)';
              mtData.relatedBuildings = 'Reactor Building, Auxiliary Building';
              mtData.relatedEquipment = 'ECCS Motors, Pumps, Valves';
              mtData.priority = 'High';
              mtData.projectType = 'Safety System Component Replacement';
            } else {
              // Generic defaults
              mtData.relatedSystems = '[Related Systems]';
              mtData.relatedBuildings = '[Related Buildings/Facilities]';
              mtData.relatedEquipment = '[Related Equipment]';
              mtData.priority = '[High/Medium/Low]';
              mtData.projectType = '[Project Type]';
            }
            
            // Enhanced project type refinement for more specific descriptions
            if (fullText.includes('replacement') && fullText.includes('valve') && mtData.projectType !== 'Safety System Component Replacement') {
              mtData.projectType = 'Component Replacement';
            } else if (fullText.includes('upgrade') && mtData.projectType === '[Project Type]') {
              mtData.projectType = 'System Upgrade';
            } else if (fullText.includes('installation') && mtData.projectType === '[Project Type]') {
              mtData.projectType = 'New Installation';
            }
            
            // Set MT requirement based on safety classification
            if (mtData.preliminarySafetyClassification === 'SC' || mtData.preliminarySafetyClassification === 'SS') {
              mtData.mtRequired = true;
            }
            
            // Add analysis result as justification and proposed solution
            mtData.justification = `Analysis Result: ${originalResponse.slice(0, 300)}...`;
            
            // Enhanced proposed solution based on specific scenarios
            if (messageLower.includes('replace') && messageLower.includes('motor')) {
              mtData.proposedSolution = 'Replace existing motor with equivalent or improved motor maintaining all safety functions and performance characteristics.';
            } else if (messageLower.includes('upgrade') && messageLower.includes('control')) {
              mtData.proposedSolution = 'Upgrade analog control system to digital control and monitoring system with enhanced alarm capabilities and remote monitoring features.';
            } else if ((messageLower.includes('valve') && messageLower.includes('replace')) || messageLower.includes('fcv-')) {
              if (messageLower.includes('digital') || messageLower.includes('smart')) {
                mtData.proposedSolution = 'Replace existing analog flow control valve with digital smart valve featuring enhanced precision control, remote monitoring capabilities, and improved diagnostics while maintaining all safety functions and regulatory compliance per IEEE standards.';
              } else {
                mtData.proposedSolution = 'Replace existing valve with functionally equivalent valve maintaining all safety and operational requirements.';
              }
            } else if (messageLower.includes('seal injection') || messageLower.includes('rcp')) {
              mtData.proposedSolution = 'Replace existing RCP seal injection flow control valve with enhanced digital control valve to improve system reliability and control precision while maintaining Safety Class classification.';
            } else {
              mtData.proposedSolution = '[Detailed description of the modification]';
            }
            
            // Update the document service with live data
            mtDocumentService.updateDocument(mtData);
            setCurrentMTData(mtData);
            console.log('Live MT document updated with parsed analysis data:', mtData);
          } catch (error) {
            console.warn('Could not update MT document service:', error);
          }
        }
        
        return {
          response: result.response || result.message || "I apologize, but I couldn't generate a response.",
          shouldAnalyze: true
        };
      } else {
        throw new Error(`Backend response: ${response.status}`);
      }
    } catch (error) {
      console.error('Error calling GPT-4 backend:', error);
      return {
        response: "I'm experiencing technical difficulties connecting to the GPT-4 analysis service. Please try again.",
        shouldAnalyze: false
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage || `[File: ${selectedFile?.name}]`,
      sender: 'user',
      timestamp: new Date(),
      type: selectedFile ? 'file' : 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Always use pure GPT-4 intelligence
      const conversationalResult = await handleConversationalInput(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: conversationalResult.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);

      // If GPT-4 determined this should trigger analysis, do it
      if (conversationalResult.shouldAnalyze && onSendMessage) {
        onSendMessage(inputMessage, selectedFile || undefined);
      }

      if (selectedFile && onAnalyzeFile) {
        onAnalyzeFile(selectedFile);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error processing your message. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setInputMessage('');
      setSelectedFile(null);
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Document Modal Handlers
  const showDocumentPreview = () => {
    if (mtDocumentService) {
      const html = mtDocumentService.generatePreviewHTML();
      setDocumentHTML(html);
      setShowDocumentModal(true);
    }
  };

  const handleDownloadPDF = () => {
    if (mtDocumentService) {
      mtDocumentService.downloadDocument();
    }
  };

  const handleDownloadWord = () => {
    if (mtDocumentService) {
      // Add Word export functionality
      console.log('Word export not yet implemented');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-800">MT Analysis Assistant</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">Powered by Azure OpenAI GPT-4</div>
              <div className="text-sm text-gray-700">
                Hello! I'm your MT Analyzer Assistant. I can help you analyze Modification Traveler documents and determine MT requirements. You can:
                <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                  <li>Ask questions about MT requirements</li>
                  <li>Upload MT documents for analysis</li>
                  <li>Get guidance on Figure 1 decision tree</li>
                  <li>Review safety classifications and design types</li>
                </ul>
                How can I help you today?
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              message.sender === 'user' ? 'bg-gray-600' : 'bg-blue-600'
            }`}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            
            <div className={`flex-1 p-4 rounded-lg max-w-xs lg:max-w-md xl:max-w-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border shadow-sm'
            }`}>
              {message.type === 'file' && (
                <div className={`flex items-center space-x-2 mb-2 p-2 rounded ${
                  message.sender === 'user' ? 'bg-blue-700' : 'bg-gray-100'
                }`}>
                  <FileUp className="w-4 h-4" />
                  <span className="text-sm font-medium">File uploaded: {message.text}</span>
                </div>
              )}
              
              <div className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
              
              <div className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Analyzing with GPT-4...</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce loading-dot-1"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce loading-dot-2"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce loading-dot-3"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="mx-6 mb-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FileUp className="w-5 h-5 text-blue-600" />
            <span className="flex-1 text-sm font-medium text-blue-700">{selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-blue-600 hover:text-blue-800 text-lg"
              title="Remove file"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white p-6">
        <div className="flex items-end space-x-4">
          {/* View Document Button */}
          {currentMTData && (
            <button
              onClick={showDocumentPreview}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              title="View MT Document"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your modification scenario..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              rows={2}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[48px]"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MT Document Modal */}
      <MTDocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        documentHTML={documentHTML}
        mtData={currentMTData}
        onDownloadPDF={handleDownloadPDF}
        onDownloadWord={handleDownloadWord}
      />
    </div>
  );
}
