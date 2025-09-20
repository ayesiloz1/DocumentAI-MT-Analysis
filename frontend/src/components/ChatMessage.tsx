import React from 'react';
import { Bot, User, Copy, Edit, FileUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'file' | 'analysis';
  metadata?: any;
}

interface ChatMessageProps {
  message: Message;
  index: number;
  onCopyMessage: (messageText: string) => Promise<void>;
  onEditMessage: (messageText: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onCopyMessage, onEditMessage }) => {

  return (
    <div
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
      
      <div className={`flex-1 p-4 rounded-lg ${
        message.type === 'analysis' || (message.sender === 'ai' && message.text.length > 500)
          ? 'max-w-none lg:max-w-4xl'  // Wider for analysis messages
          : 'max-w-xs lg:max-w-md xl:max-w-lg'  // Standard width for regular messages
      } ${
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
        
        <div className={`${
          message.type === 'analysis' || (message.sender === 'ai' && message.text.length > 500)
            ? 'text-sm leading-relaxed' // Better spacing for long content
            : 'text-sm'
        } ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
          <ReactMarkdown
            components={{
              // Enhanced table styling
              table: ({children}) => (
                <table className="min-w-full border-collapse border border-gray-300 my-4">
                  {children}
                </table>
              ),
              th: ({children}) => (
                <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="border border-gray-300 px-4 py-2">
                  {children}
                </td>
              ),
              // Enhanced heading styles
              h2: ({children}) => (
                <h2 className="text-lg font-bold mt-6 mb-3 text-blue-700">
                  {children}
                </h2>
              ),
              h3: ({children}) => (
                <h3 className="text-base font-semibold mt-4 mb-2 text-gray-700">
                  {children}
                </h3>
              ),
              // Better spacing for lists and paragraphs
              p: ({children}) => (
                <p className="mb-3 leading-relaxed">
                  {children}
                </p>
              ),
              hr: () => (
                <hr className="my-4 border-gray-300" />
              ),
              // Code blocks
              code: ({children}) => (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        
        <div className={`flex items-center justify-between mt-2 ${
          message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
        }`}>
          <div className="text-xs">
            {message.timestamp.toLocaleTimeString()}
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onCopyMessage(message.text)}
              className={`p-1 rounded hover:bg-opacity-20 transition-colors ${
                message.sender === 'user' 
                  ? 'hover:bg-white text-blue-200 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </button>
            
            {onEditMessage && message.sender === 'user' && (
              <button
                onClick={() => {
                  const newText = prompt('Edit message:', message.text);
                  if (newText && newText !== message.text) {
                    onEditMessage(newText);
                  }
                }}
                className="p-1 rounded hover:bg-blue-700 text-blue-200 hover:text-white transition-colors"
                title="Edit message"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            
            {/* Additional buttons for AI messages */}
            {message.sender === 'ai' && (
              <>
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(message.text);
                    speechSynthesis.speak(utterance);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Read aloud"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343A8 8 0 0018.364 18.364M9.879 9.879a3 3 0 004.242 4.242M15.536 8.464a5 5 0 010 7.072" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    // Implement regenerate functionality if needed
                    console.log('Regenerate response for:', message.id);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Regenerate response"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};