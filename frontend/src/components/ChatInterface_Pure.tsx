'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, FileUp, Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  // 🤖 PURE GPT-4 INTELLIGENCE - NO HARDCODED RESPONSES
  const handleConversationalInput = async (message: string): Promise<{response: string, shouldAnalyze: boolean}> => {
    console.log('🤖 Using pure GPT-4 intelligence for all analysis');
    
    try {
      const response = await fetch('http://localhost:5001/api/enhancedmt/intelligent-chat', {
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
      // 🤖 Always use pure GPT-4 intelligence
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="message-wrapper message-wrapper--ai">
            <div className="message-avatar message-avatar--ai">
              <Bot className="w-4 h-4" />
            </div>
            <div className="message-bubble message-bubble--ai">
              <div className="ai-intro">
                <div className="ai-intro-header">
                  <Bot className="w-5 h-5 text-emerald-600" />
                  <span className="ai-intro-title">MT Analysis Assistant (Pure GPT-4)</span>
                </div>
                <div className="ai-intro-subtitle">Powered by Azure OpenAI GPT-4 • No hardcoded responses</div>
                <div className="ai-intro-content">
                  Hello! I'm your MT Analyzer Assistant. I can help you analyze Modification Traveler documents and determine MT requirements. You can:
                  <ul className="ai-intro-list">
                    <li>• Ask questions about MT requirements</li>
                    <li>• Upload MT documents for analysis</li>
                    <li>• Get guidance on Figure 1 decision tree</li>
                    <li>• Review safety classifications and design types</li>
                  </ul>
                  How can I help you today?
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${message.sender === 'user' ? 'message-wrapper--user' : 'message-wrapper--ai'}`}
          >
            <div className={`message-avatar ${message.sender === 'user' ? 'message-avatar--user' : 'message-avatar--ai'}`}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            
            <div className={`message-bubble ${message.sender === 'user' ? 'message-bubble--user' : 'message-bubble--ai'}`}>
              {message.type === 'file' && (
                <div className="message-file">
                  <FileUp className="w-4 h-4" />
                  <span>File uploaded: {message.text}</span>
                </div>
              )}
              
              <div className="message-content">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
              
              <div className={`message-timestamp ${message.sender === 'user' ? 'message-timestamp--user' : ''}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper message-wrapper--ai">
            <div className="message-avatar message-avatar--ai">
              <Bot className="w-4 h-4" />
            </div>
            <div className="message-bubble message-bubble--ai">
              <div className="message-loading">
                <span>Analyzing with GPT-4...</span>
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview">
          <div className="file-preview-icon">
            <FileUp className="w-4 h-4" />
          </div>
          <span className="file-preview-name">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="file-preview-remove"
            title="Remove file"
          >
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            className="file-upload-hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-file-upload"
            title="Upload file"
          >
            <FileUp className="w-5 h-5" />
          </button>
          
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your modification scenario..."
            className="chat-input"
            rows={2}
            disabled={isLoading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
            className="btn-send"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
