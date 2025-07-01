'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '../types/chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({ messages, isStreaming = false, onReaction, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check if user is near bottom of chat
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    setShowScrollButton(!isNearBottom);
    setAutoScroll(isNearBottom);
  };

  // Auto-scroll on new messages (if user is near bottom)
  useEffect(() => {
    if (autoScroll || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, autoScroll]);

  // Scroll to bottom immediately on mount
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  const handleCopyMessage = () => {
    // You could add a toast notification here
    console.log('Message copied to clipboard');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth px-4 py-6"
      >
        <div className="max-w-4xl mx-auto space-y-1">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to Twin
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Start a conversation with your AI assistant. Ask questions, get help, or just chat!
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    💡 Ask me anything
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    🚀 Get help with coding
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                    📝 Write content
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onReaction={onReaction}
                  onDelete={onDeleteMessage}
                  onCopy={handleCopyMessage}
                />
              ))}
              
              {/* Typing Indicator */}
              <TypingIndicator isVisible={isStreaming && !messages.some(m => m.isStreaming)} />
            </>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-8">
          <button
            onClick={() => {
              scrollToBottom();
              setAutoScroll(true);
            }}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 