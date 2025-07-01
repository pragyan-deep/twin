'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onClearChat?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({ onSendMessage, onClearChat, isLoading = false, disabled = false, placeholder }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Reduced max height for better UX
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Auto-focus input after sending message
  const focusInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Reset textarea height and focus
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Auto-focus after a brief delay to ensure smooth UX
    setTimeout(focusInput, 100);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Clear chat with Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onClearChat?.();
    }

    // Focus on Escape
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  const handleSlashCommand = useCallback((command: string) => {
    switch (command) {
      case '/clear':
        onClearChat?.();
        setMessage('');
        break;
      case '/help':
        setMessage('Available commands:\n/clear - Clear chat history\n/help - Show this help');
        break;
      default:
        break;
    }
  }, [onClearChat]);

  // Check for slash commands when user types
  useEffect(() => {
    if (message.startsWith('/') && message.includes(' ')) {
      const command = message.split(' ')[0];
      if (command === '/clear' || command === '/help') {
        handleSlashCommand(command);
      }
    }
  }, [message, handleSlashCommand]);

  const charCount = message.length;
  const maxChars = 4000;
  const isNearLimit = charCount > maxChars * 0.8;
  const canSend = message.trim() && !isLoading && !disabled && charCount <= maxChars;

  return (
    <div className="p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div
          className={`relative flex items-end gap-2 sm:gap-3 p-3 border-2 rounded-2xl transition-all duration-200 bg-gray-50 dark:bg-gray-900 ${
            isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-white dark:bg-gray-800'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={disabled ? 'Chat is disabled' : (placeholder || 'Type a message...')}
              disabled={disabled}
              className="w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none text-sm leading-6 min-h-[24px] max-h-[120px]"
              rows={1}
              style={{ height: 'auto' }}
            />
            
            {/* Character count - only show when near limit */}
            {isNearLimit && (
              <div className={`text-xs mt-1 ${charCount > maxChars ? 'text-red-500' : 'text-yellow-500'}`}>
                {charCount}/{maxChars}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              canSend
                ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transform'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Bottom hints - more compact for mobile */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="hidden sm:flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs mr-1">Enter</kbd>
              to send
            </span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs mr-1">Shift+Enter</kbd>
              for new line
            </span>
          </div>
          
          {/* Mobile: Just show simple hint */}
          <div className="sm:hidden text-center flex-1">
            <span>Enter to send, Shift+Enter for new line</span>
          </div>

          {/* Clear chat button - only show if messages exist and on larger screens */}
          {onClearChat && (
            <button
              onClick={onClearChat}
              className="hidden sm:block text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs"
              title="Clear chat history"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 