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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div
          className={`relative flex items-end space-x-3 p-3 border rounded-2xl transition-all duration-200 ${
            isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
              placeholder={disabled ? 'Chat is disabled' : (placeholder || 'Type a message... (Enter to send, Shift+Enter for new line)')}
              disabled={disabled}
              className="w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none text-sm leading-6 min-h-[24px] max-h-[200px]"
              rows={1}
              style={{ height: 'auto' }}
            />
            
            {/* Character count */}
            {isNearLimit && (
              <div className={`text-xs mt-1 ${charCount > maxChars ? 'text-red-500' : 'text-yellow-500'}`}>
                {charCount}/{maxChars}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading || disabled || charCount > maxChars}
            className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
              !message.trim() || isLoading || disabled || charCount > maxChars
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> to send</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> for new line</span>
          </div>
          {onClearChat && (
            <button
              onClick={onClearChat}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 