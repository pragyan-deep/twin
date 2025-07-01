'use client';

import { useTwinChat } from '../hooks/useTwinChat';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { USER_PROFILE } from '../../lib/config/userProfile';

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className = '' }: ChatContainerProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    regenerateLastMessage,
    addReaction,
    deleteMessage
  } = useTwinChat();

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative flex-shrink-0">
            <img
              src={USER_PROFILE.avatar}
              alt={USER_PROFILE.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const img = e.currentTarget as HTMLImageElement;
                const span = img.nextElementSibling as HTMLSpanElement;
                img.style.display = 'none';
                span.style.display = 'flex';
              }}
            />
            <span className="text-white font-bold text-sm hidden w-full h-full items-center justify-center">
              {USER_PROFILE.name.charAt(0)}
            </span>
            {/* AI Badge */}
            {USER_PROFILE.personality.show_ai_badge && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">⚡</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {USER_PROFILE.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 flex-shrink-0">
                {USER_PROFILE.title}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {isStreaming ? (
                <span className="flex items-center">
                  <span className="inline-block w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                  Typing...
                </span>
              ) : (
                USER_PROFILE.subtitle
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Message count - only show on larger screens */}
          {messages.length > 0 && (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 mr-2">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          )}

          {/* Regenerate button */}
          {messages.length > 0 && !isLoading && (
            <button
              onClick={regenerateLastMessage}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Regenerate last response"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Clear chat button */}
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Clear chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 relative">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onReaction={addReaction}
          onDeleteMessage={deleteMessage}
        />
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800">
        <InputArea
          onSendMessage={sendMessage}
          onClearChat={clearChat}
          isLoading={isLoading}
          disabled={!!error}
          placeholder={`Ask ${USER_PROFILE.name.split(' ')[0]} anything...`}
        />
      </div>
    </div>
  );
} 