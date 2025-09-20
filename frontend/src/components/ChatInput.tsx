import React, { useRef } from 'react';
import { Send, FileUp } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  onInputChange,
  onSendMessage,
  onFileSelect,
  selectedFile,
  onRemoveFile,
  isLoading,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && (inputMessage.trim() || selectedFile)) {
        onSendMessage();
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    adjustTextareaHeight(e.target);
  };

  return (
    <>
      {/* File Preview */}
      {selectedFile && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-2">
            <FileUp className="w-5 h-5 text-blue-600" />
            <span className="flex-1 text-sm font-medium text-blue-700">{selectedFile.name}</span>
            <button
              onClick={onRemoveFile}
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
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={selectedFile ? "Add a message (optional)..." : "Type your message about MT analysis..."}
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              style={{ minHeight: '52px', maxHeight: '120px' }}
              disabled={disabled || isLoading}
            />
          </div>
          
          <div className="flex space-x-2">
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Upload file"
              disabled={disabled || isLoading}
            >
              <FileUp className="w-5 h-5" />
            </button>
            
            {/* Send Button */}
            <button
              onClick={onSendMessage}
              disabled={disabled || isLoading || (!inputMessage.trim() && !selectedFile)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>
    </>
  );
};