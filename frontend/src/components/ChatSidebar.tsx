import React from 'react';
import { FileText } from 'lucide-react';

export interface ChatHistory {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistories: ChatHistory[];
  currentChatId: string;
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onShowDocumentPreview?: () => void;
  hasDocumentService?: boolean;
  renamingChatId: string | null;
  renameValue: string;
  onStartRename: (chatId: string, currentTitle: string) => void;
  onConfirmRename: (chatId: string) => void;
  onCancelRename: () => void;
  onRenameValueChange: (value: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  chatHistories,
  currentChatId,
  onSelectChat,
  onCreateNewChat,
  onDeleteChat,
  onRenameChat,
  onShowDocumentPreview,
  hasDocumentService,
  renamingChatId,
  renameValue,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onRenameValueChange
}) => {
  return (
    <div className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : 'chat-sidebar--closed'}`}>
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2 className="sidebar-title">Chat History</h2>
            <button
              onClick={onClose}
              className="sidebar-close-btn"
            >
              ✕
            </button>
          </div>
          <button
            onClick={onCreateNewChat}
            className="new-chat-btn"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
          
          {/* MT Document Preview Button */}
          {hasDocumentService && onShowDocumentPreview && (
            <button
              onClick={onShowDocumentPreview}
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
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-item-content">
                  {renamingChatId === chat.id ? (
                    <div className="chat-rename-container">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => onRenameValueChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onConfirmRename(chat.id);
                          } else if (e.key === 'Escape') {
                            onCancelRename();
                          }
                        }}
                        onBlur={() => onConfirmRename(chat.id)}
                        className="chat-rename-input"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <div className="chat-item-title">{chat.title}</div>
                      <div className="chat-item-meta">
                        {chat.updatedAt.toLocaleDateString()} • {chat.messages.length} messages
                      </div>
                    </>
                  )}
                </div>
                
                {/* Action buttons - show on hover */}
                <div className="chat-item-actions">
                  {renamingChatId !== chat.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRename(chat.id, chat.title);
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
                          if (confirm('Delete this chat?')) {
                            onDeleteChat(chat.id);
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
  );
};