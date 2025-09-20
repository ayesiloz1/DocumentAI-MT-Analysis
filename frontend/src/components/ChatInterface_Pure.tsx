// ============================================================================
// REACT CLIENT COMPONENT DIRECTIVE
// 'use client' tells Next.js this is a client-side component that runs in the browser
// This is required for components that use React hooks and browser APIs
// ============================================================================
'use client';

// ============================================================================
// IMPORT STATEMENTS - EXTERNAL LIBRARIES AND COMPONENTS
// ============================================================================
import React, { useState, useRef, useEffect } from 'react'; // React hooks for state and lifecycle management
import { Bot, FileText, FileUp, Send } from 'lucide-react'; // Icon components
import MTDocumentModal from './MTDocumentModal'; // Custom modal component for displaying MT documents
import { ChatMessage, type Message } from './ChatMessage';
import { ChatSidebar, type ChatHistory } from './ChatSidebar';
import { SpaceshipAnimation } from './SpaceshipAnimation';
import { ChatInput } from './ChatInput';
import { extractModificationTitle, extractProjectNumber } from '../utils/dataExtraction';
import { aiProjectAnalysis } from '../services/aiProjectAnalysis';
import '../styles/components/index.css'; // Import CSS styles
import '../styles/components/chat-interface.css'; // Import chat interface specific styles

interface MTAnalysisRequest {
  problemDescription?: string;
  isPhysicalChange?: boolean;
  isTemporary?: boolean;
  projectNumber?: string;
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
  pendingAnalysisMessage?: string | null;
  onAnalysisMessageProcessed?: () => void;
}

export default function ChatInterface({ 
  onSendMessage, 
  onAnalyzeFile, 
  onScenariosUpdate, 
  pendingAnalysisMessage, 
  onAnalysisMessageProcessed 
}: ChatInterfaceProps) {
  // Chat History State Management
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar closed by default
  
  // Rename functionality state
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Current Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Paper plane animation state
  const [showPaperPlane, setShowPaperPlane] = useState(false);
  const [paperPlaneKey, setPaperPlaneKey] = useState(0);

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

  // Effect to handle pending analysis messages from PDF processing
  useEffect(() => {
    if (pendingAnalysisMessage && onAnalysisMessageProcessed) {
      const analysisMessage: Message = {
        id: Date.now().toString(),
        text: pendingAnalysisMessage,
        sender: 'ai',
        timestamp: new Date(),
        type: 'analysis'
      };
      
      setMessages(prev => [...prev, analysisMessage]);
      onAnalysisMessageProcessed();
    }
  }, [pendingAnalysisMessage, onAnalysisMessageProcessed]);

  useEffect(() => {
    if (!isInitialized) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `# MT Analyzer Assistant
**Welcome to the Modification Traveler Analysis System**

I'm your AI assistant for MT document analysis and regulatory compliance. I can help you with:

• **Document Analysis** - Upload and analyze MT documents

• **Decision Tree Guidance** - Navigate Figure 1 requirements

• **Safety Classifications** - Determine proper safety assignments

• **Design Assessment** - Evaluate modification complexity

• **Regulatory Compliance** - Ensure MT standards adherence

Simply ask questions or upload documents to get started. What can I help you analyze today?`,
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
      // Call the .NET backend directly
      const response = await fetch('http://localhost:5000/api/MT/intelligent-chat', {
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
              mtNumber: extractedProjectNumber, // Use same as project number for MT number
              problemDescription: message, // Use the original user message
              timestamp: new Date().toISOString()
            };
            
            // Look for MT requirement determination
            if (responseText.includes('mt is required') || responseText.includes('modification traveler is required')) {
              mtData.mtRequired = true;
            } else if (responseText.includes('mt is not required') || responseText.includes('no mt required')) {
              mtData.mtRequired = false;
            }
            
            // Enhanced safety classification detection for chemical systems
            const fullText = (message + ' ' + originalResponse).toLowerCase();
            if (fullText.includes('chemical addition manifold') || fullText.includes('chemical manifold')) {
              // Chemical addition manifolds are typically General Service (GS)
              mtData.preliminarySafetyClassification = 'GS';
              mtData.environmentalRisk = 'Yes'; // Chemical systems have environmental risk
              mtData.radiologicalRisk = 'No';   // Chemical addition typically not radiological
            } else if (fullText.includes('safety class') || fullText.includes('safety-class') || 
                fullText.includes('sc ') || fullText.includes('10 cfr 50 appendix b') ||
                fullText.includes('reactor coolant pressure boundary') || fullText.includes('safety-related') ||
                fullText.includes('safety-critical') || fullText.includes('reactor coolant system') ||
                fullText.includes('emergency diesel generator') || fullText.includes('emergency core cooling') ||
                fullText.includes('containment isolation') || fullText.includes('class 1e')) {
              mtData.preliminarySafetyClassification = 'SC'; // Safety Class
              mtData.environmentalRisk = 'Yes'; // Safety class typically has environmental considerations
              mtData.radiologicalRisk = 'Yes'; // Reactor systems have radiological risk
            } else if (fullText.includes('safety significant') || fullText.includes('ss ') ||
                      fullText.includes('safety-significant') || fullText.includes('chemical volume control') ||
                      fullText.includes('cvcs') || fullText.includes('auxiliary feedwater')) {
              mtData.preliminarySafetyClassification = 'SS';
              mtData.environmentalRisk = 'No';
              mtData.radiologicalRisk = 'Yes';
            } else if (fullText.includes('general service') || fullText.includes('gs ') ||
                      fullText.includes('non-safety')) {
              mtData.preliminarySafetyClassification = 'GS';
              mtData.environmentalRisk = 'No';
              mtData.radiologicalRisk = 'No';
            }
            
            // Enhanced design type detection with proper number mapping
            if (fullText.includes('type ii') || fullText.includes('type 2') || 
                fullText.includes('design type 2') || fullText.includes('like-for-like') ||
                fullText.includes('identical model') || fullText.includes('same manufacturer') ||
                fullText.includes('functionally equivalent') || fullText.includes('direct replacement') ||
                fullText.includes('identical westinghouse') || fullText.includes('same specifications') ||
                fullText.includes('no design changes') || fullText.includes('direct swap')) {
              mtData.designType = 2; // Pass as number for proper checkbox selection
              mtData.projectDesignReviewRequired = 'No';
              mtData.majorModificationEvaluationRequired = 'No';
              mtData.safetyInDesignStrategyRequired = 'No';
              // Remove hardcoded hazard category assignment
            } else if (fullText.includes('digital') || fullText.includes('analog to digital') ||
                fullText.includes('50.59') || fullText.includes('smart valve') || 
                fullText.includes('digital smart valve') || fullText.includes('smart motor-operated') ||
                fullText.includes('programmable logic controller') || fullText.includes('plc')) {
              mtData.designType = 1; // Pass as number for proper checkbox selection
              mtData.projectDesignReviewRequired = 'Yes';
              mtData.majorModificationEvaluationRequired = 'Yes';
              mtData.safetyInDesignStrategyRequired = 'Yes';
              // Remove hardcoded hazard category assignment
            } else if (fullText.includes('type i') || fullText.includes('type 1') || 
                      fullText.includes('design type 1')) {
              mtData.designType = 1; // Pass as number for proper checkbox selection
              mtData.projectDesignReviewRequired = 'Yes';
              mtData.majorModificationEvaluationRequired = 'Yes';
              mtData.safetyInDesignStrategyRequired = 'Yes';
              // Remove hardcoded hazard category assignment
            } else if (fullText.includes('type iii') || fullText.includes('type 3') ||
                      fullText.includes('design type 3')) {
              mtData.designType = 3; // Pass as number for proper checkbox selection
            } else if (fullText.includes('type iv') || fullText.includes('type 4') ||
                      fullText.includes('temporary')) {
              mtData.designType = 4; // Pass as number for proper checkbox selection
            } else if (fullText.includes('type v') || fullText.includes('type 5') ||
                      fullText.includes('identical replacement')) {
              mtData.designType = 5; // Pass as number for proper checkbox selection
            } else {
              // Default to Type II for modifications
              mtData.designType = 2; // Pass as number for proper checkbox selection
            }
            
            // Remove hardcoded timeline estimation - let backend or user determine dates
            // Keep completion dates as empty for user input
            mtData.requestedCompletionDate = '';
            mtData.estimatedCompleteDate = '';
            mtData.dueDate = '';
            
            // Remove hardcoded hazard category detection - let backend or user determine
            
            // Extract project number if mentioned in response (but don't override our intelligent extraction)
            const projectMatch = originalResponse.match(/project\s+(?:number\s+)?([A-Z0-9-]+)/i);
            if (projectMatch && !mtData.projectNumber) {
              mtData.projectNumber = projectMatch[1];
            }
            
            // Remove hardcoded timeline extraction - let user set dates
            
            // Set facility and submission info
            const facilityMatch = message.match(/unit\s+(\d+)/i);
            mtData.facility = facilityMatch ? `Unit ${facilityMatch[1]}` : 'Unit 1';
            mtData.submittedBy = 'Engineering Department';
            mtData.submissionDate = new Date().toISOString().split('T')[0];
            
            // Use AI analysis to determine project details instead of hardcoded mappings
            let analysisResult = null;
            try {
              analysisResult = await aiProjectAnalysis.analyzeProject({
                problemDescription: message,
                conversationContext: messages.map(m => m.text).join('\n'),
                facility: mtData.facility || 'Nuclear Facility',
                additionalContext: { fullText }
              });
              
              // Apply AI analysis results
              mtData.relatedSystems = analysisResult.relatedSystems;
              mtData.relatedBuildings = analysisResult.relatedBuildings;
              mtData.relatedEquipment = analysisResult.relatedEquipment;
              mtData.priority = analysisResult.priority;
              mtData.projectType = analysisResult.projectType;
              mtData.cacn = analysisResult.cacn;
              
              // Add AI-generated additional fields
              mtData.safetyClassification = analysisResult.safetyClassification;
              mtData.estimatedComplexity = analysisResult.estimatedComplexity;
              mtData.recommendedApproach = analysisResult.recommendedApproach;
              mtData.aiConfidence = analysisResult.confidence;
              
            } catch (error) {
              console.error('AI project analysis failed, using fallback:', error);
              
              // Minimal fallback - let AI analysis service handle this
              const fallbackResult = await aiProjectAnalysis.quickAnalyze(message);
              mtData.relatedSystems = fallbackResult.relatedSystems || 'Analysis pending';
              mtData.relatedBuildings = 'To be determined through detailed analysis';
              mtData.relatedEquipment = 'To be determined through detailed analysis';
              mtData.priority = fallbackResult.priority || 'Medium';
              mtData.projectType = fallbackResult.projectType || 'Modification';
              mtData.cacn = `${new Date().getFullYear()}-MT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            }
            
            // Set MT requirement based on safety classification
            if (mtData.preliminarySafetyClassification === 'SC' || mtData.preliminarySafetyClassification === 'SS') {
              mtData.mtRequired = true;
            }
            
            // Add analysis result as justification
            mtData.justification = `AI Analysis Result: ${originalResponse.slice(0, 300)}...`;
            
            // Generate proposed solution using AI analysis instead of hardcoded logic
            if (analysisResult && analysisResult.recommendedApproach) {
              mtData.proposedSolution = analysisResult.recommendedApproach;
            } else {
              // Fallback to AI-generated solution based on project type
              mtData.proposedSolution = `Implement ${mtData.projectType.toLowerCase()} following nuclear industry standards and regulatory requirements. Detailed engineering analysis and safety review required to determine specific implementation approach.`;
            }
            
            // Update the document service with live data
            console.log('🚀 Sending AI-analyzed data to MT Document Service:', mtData);
            mtDocumentService.updateDocument(mtData);
            setCurrentMTData(mtData);
            console.log('Live MT document updated with AI-analyzed data:', mtData);
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
    
    // Trigger paper plane animation
    setShowPaperPlane(true);
    setPaperPlaneKey(prev => prev + 1);
    
    // Hide paper plane after animation completes
    setTimeout(() => {
      setShowPaperPlane(false);
    }, 3500); // Increased to match new 3.5s animation
    
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

  // ============================================================================
  // CHAT HISTORY MANAGEMENT FUNCTIONS
  // ============================================================================

  // Generate title from first user message
  const generateChatTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    // Truncate long messages and add ellipsis
    const title = firstUserMessage.text.length > 50 
      ? firstUserMessage.text.substring(0, 50) + '...'
      : firstUserMessage.text;
    
    return title;
  };

  // Save current chat to history
  const saveCurrentChat = () => {
    if (messages.length === 0 || !currentChatId) return;
    
    const updatedHistories = chatHistories.map(chat => 
      chat.id === currentChatId 
        ? {
            ...chat,
            messages: [...messages],
            title: generateChatTitle(messages),
            updatedAt: new Date()
          }
        : chat
    );
    
    setChatHistories(updatedHistories);
    
    // Persist to localStorage
    try {
      localStorage.setItem('mtChatHistories', JSON.stringify(updatedHistories));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  // Create new chat
  const createNewChat = () => {
    // Save current chat first
    if (messages.length > 0) {
      saveCurrentChat();
    }
    
    // Create new chat ID and reset state
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
    setIsInitialized(false);
    setInputMessage('');
    setSelectedFile(null);
    
    // Create new chat history entry
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedHistories = [newChat, ...chatHistories];
    setChatHistories(updatedHistories);
    
    // Persist to localStorage
    try {
      localStorage.setItem('mtChatHistories', JSON.stringify(updatedHistories));
    } catch (error) {
      console.error('Failed to save new chat:', error);
    }
  };

  // Switch to existing chat
  const switchToChat = (chatId: string) => {
    // Save current chat first
    if (messages.length > 0 && currentChatId) {
      saveCurrentChat();
    }
    
    // Load selected chat
    const selectedChat = chatHistories.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages(selectedChat.messages);
      setIsInitialized(selectedChat.messages.length > 0);
      setInputMessage('');
      setSelectedFile(null);
    }
  };

  // Delete chat from history
  const deleteChat = (chatId: string) => {
    const updatedHistories = chatHistories.filter(chat => chat.id !== chatId);
    setChatHistories(updatedHistories);
    
    // If deleting current chat, create new one
    if (chatId === currentChatId) {
      if (updatedHistories.length > 0) {
        switchToChat(updatedHistories[0].id);
      } else {
        createNewChat();
      }
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem('mtChatHistories', JSON.stringify(updatedHistories));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Rename chat
  const renameChat = (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    const updatedHistories = chatHistories.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle.trim(), updatedAt: new Date() }
        : chat
    );
    
    setChatHistories(updatedHistories);
    
    // Persist to localStorage
    try {
      localStorage.setItem('mtChatHistories', JSON.stringify(updatedHistories));
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Start renaming a chat
  const startRename = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setRenameValue(currentTitle);
  };

  // Confirm rename
  const confirmRename = () => {
    if (renamingChatId && renameValue.trim()) {
      renameChat(renamingChatId, renameValue);
    }
    setRenamingChatId(null);
    setRenameValue('');
  };

  // Cancel rename
  const cancelRename = () => {
    setRenamingChatId(null);
    setRenameValue('');
  };

  // Handle rename input keypress
  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // Load chat histories from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mtChatHistories');
      if (saved) {
        const parsed = JSON.parse(saved);
        const historiesWithDates = parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatHistories(historiesWithDates);
        
        // Load most recent chat if exists
        if (historiesWithDates.length > 0) {
          const mostRecent = historiesWithDates[0];
          setCurrentChatId(mostRecent.id);
          setMessages(mostRecent.messages);
          setIsInitialized(mostRecent.messages.length > 0);
        } else {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      createNewChat();
    }
  }, []);

  // Save current chat when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveCurrentChat();
    }
  }, [messages]);

  // Copy message to clipboard
  const handleCopyMessage = async (messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      // Optional: You can add a toast notification here
      console.log('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Edit message - populate input field with message text
  const handleEditMessage = (messageText: string) => {
    setInputMessage(messageText);
    // Focus on the input field
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="chat-layout">
      {/* Cool Spaceship Animation */}
      {showPaperPlane && (
        <div className="spaceship-container">
          <div key={paperPlaneKey} className="spaceship spaceship--launch">
            {/* Energy Trail */}
            <div className="spaceship-trail"></div>
            
            {/* Main Spaceship */}
            <div className="spaceship-body">
              <svg className="spaceship-svg" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Main Hull */}
                <ellipse cx="30" cy="12.5" rx="24" ry="5" fill="#1e293b" stroke="#334155" strokeWidth="0.8"/>
                
                {/* Hull Details */}
                <ellipse cx="30" cy="12.5" rx="20" ry="3.5" fill="#475569" opacity="0.8"/>
                <ellipse cx="30" cy="12.5" rx="16" ry="2.5" fill="#64748b" opacity="0.6"/>
                
                {/* Command Bridge - AT FRONT (RIGHT SIDE for left-to-right movement) */}
                <ellipse cx="48" cy="12.5" rx="8" ry="3.5" fill="#374151" stroke="#4b5563" strokeWidth="0.4"/>
                <ellipse cx="51" cy="12.5" rx="5" ry="2" fill="#06b6d4" opacity="0.7"/>
                
                {/* Engine Pods - AT BACK (LEFT SIDE) */}
                <ellipse cx="15" cy="9" rx="5" ry="2" fill="#1e293b" stroke="#334155" strokeWidth="0.4"/>
                <ellipse cx="15" cy="16" rx="5" ry="2" fill="#1e293b" stroke="#334155" strokeWidth="0.4"/>
                
                {/* Engine Cores */}
                <ellipse cx="12" cy="9" rx="2.5" ry="1" fill="#3b82f6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
                </ellipse>
                <ellipse cx="12" cy="16" rx="2.5" ry="1" fill="#3b82f6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite"/>
                </ellipse>
                
                {/* Engine Glow */}
                <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#06b6d4" opacity="0.5">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.6s" repeatCount="indefinite"/>
                </ellipse>
                <ellipse cx="9" cy="16" rx="3" ry="1.5" fill="#06b6d4" opacity="0.5">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.6s" repeatCount="indefinite"/>
                </ellipse>
                
                {/* Navigation Lights */}
                <circle cx="54" cy="10" r="0.8" fill="#ef4444">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="54" cy="15" r="0.8" fill="#22c55e">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite"/>
                </circle>
                
                {/* Energy Conduits */}
                <line x1="20" y1="12.5" x2="45" y2="12.5" stroke="#06b6d4" strokeWidth="0.8" opacity="0.6">
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite"/>
                </line>
                <line x1="22" y1="11" x2="43" y2="11" stroke="#3b82f6" strokeWidth="0.4" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite"/>
                </line>
                <line x1="22" y1="14" x2="43" y2="14" stroke="#3b82f6" strokeWidth="0.4" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite"/>
                </line>
                
                {/* Antenna Array */}
                <rect x="57" y="11.5" width="3" height="2" fill="#64748b" stroke="#334155" strokeWidth="0.2"/>
                <line x1="56" y1="10" x2="56" y2="14.5" stroke="#64748b" strokeWidth="0.2"/>
                <line x1="55" y1="9.5" x2="55" y2="15" stroke="#64748b" strokeWidth="0.2"/>
                
                {/* Hull Paneling */}
                <rect x="28" y="11" width="12" height="3" fill="none" stroke="#475569" strokeWidth="0.2" opacity="0.6"/>
                <rect x="30" y="11.5" width="8" height="2" fill="none" stroke="#475569" strokeWidth="0.15" opacity="0.4"/>
                
                {/* Deflector Array */}
                <ellipse cx="58" cy="12.5" rx="2.5" ry="1.5" fill="#7c3aed" opacity="0.3">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite"/>
                </ellipse>
              </svg>
            </div>
            
            {/* Spaceship Shadow */}
            <div className="spaceship-shadow"></div>
            
            {/* Warp Field Effect */}
            <div className="spaceship-warp"></div>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar--open' : 'chat-sidebar--closed'}`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="sidebar-header-top">
              <h2 className="sidebar-title">Chat History</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="sidebar-close-btn"
              >
                ✕
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="new-chat-btn"
            >
              <span>+</span>
              <span>New Chat</span>
            </button>
            
            {/* MT Document Preview Button */}
            {mtDocumentService && (
              <button
                onClick={showDocumentPreview}
                className="mt-document-btn"
                title="View MT Document Live Preview"
              >
                <FileText className="w-4 h-4" />
                <span>View MT Document</span>
              </button>
            )}
          </div>
          
          {/* Chat History List */}
          <div className="chat-history-list">
            {chatHistories.length === 0 ? (
              <div className="chat-history-empty">
                <div className="chat-history-empty-icon">💬</div>
                <p className="chat-history-empty-title">No chat history yet</p>
                <p className="chat-history-empty-subtitle">Start a conversation to see it here</p>
              </div>
            ) : (
              chatHistories.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-history-item ${
                    chat.id === currentChatId ? 'chat-history-item--active' : ''
                  }`}
                >
                  <div onClick={() => switchToChat(chat.id)} className="chat-item-content">
                    {/* Chat title - editable when renaming */}
                    {renamingChatId === chat.id ? (
                      <div className="chat-rename-container">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={handleRenameKeyPress}
                          onBlur={confirmRename}
                          className="chat-rename-input"
                          autoFocus
                          maxLength={100}
                        />
                      </div>
                    ) : (
                      <div className="chat-item-title">
                        {chat.title}
                      </div>
                    )}
                    
                    <div className="chat-item-meta">
                      {chat.updatedAt.toLocaleDateString()} • {chat.messages.length} messages
                    </div>
                  </div>
                  
                  {/* Action buttons - show on hover */}
                  <div className="chat-item-actions">
                    {renamingChatId !== chat.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(chat.id, chat.title);
                          }}
                          className="chat-action-btn chat-rename-btn"
                          title="Rename chat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${chat.title}"?`)) {
                              deleteChat(chat.id);
                            }
                          }}
                          className="chat-action-btn chat-delete-btn"
                          title="Delete chat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="chat-main">
        {/* Top Bar */}
        <div className="chat-top-bar">
          <div className="top-bar-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle-btn"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="top-bar-title-section">
              {/* Company Logo Placeholder */}
              <div className="header-logo-placeholder">
                {/* Insert your company logo image here */}
                <div className="logo-placeholder-icon">🏭</div>
                <span className="logo-placeholder-text">LOGO</span>
              </div>
              
              <div className="header-title-content">
                <h1>MT Analyzer Assistant</h1>
                <p>Powered by Azure OpenAI GPT-4</p>
              </div>
            </div>
          </div>
          
          <div className="top-bar-right">
            <div className="conversation-counter">
              {chatHistories.length} conversations
            </div>
            {!sidebarOpen && (
              <button
                onClick={createNewChat}
                className="new-chat-btn--compact"
                title="Start new chat"
              >
                <span>+</span>
                <span>New</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">

        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            index={index}
            onCopyMessage={handleCopyMessage}
            onEditMessage={handleEditMessage}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* AI is thinking message - moved to bottom */}
      {isLoading && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-2">
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
          {/* View Document Button - Always show when MT service is available */}
          {mtDocumentService && (
            <button
              onClick={showDocumentPreview}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              title="View MT Document Live Preview"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your modification scenario..."
              className="chat-input"
              rows={2}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[48px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
            title="Upload file"
          >
            <FileUp className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
        />

        {/* Selected file indicator */}
        {selectedFile && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
            <span className="text-sm text-blue-700">📎 {selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-blue-500 hover:text-blue-700 ml-2"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Document Modal */}
    {showDocumentModal && (
      <MTDocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        documentHTML={documentHTML}
        mtData={currentMTData}
        onDownloadPDF={handleDownloadPDF}
        onDownloadWord={handleDownloadWord}
      />
    )}
  </div>
);
}

