'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '../types/chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { USER_PROFILE } from '../../lib/config/userProfile';

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
    <div className="h-full flex flex-col">
      {/* Messages Container - Takes full height and scrolls */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth overscroll-contain"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent'
        }}
      >
        <div className="min-h-full flex flex-col">
          {messages.length === 0 ? (
            /* Welcome Screen - Centered */
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <div className="text-center max-w-md w-full">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                  <img
                    src={USER_PROFILE.avatar}
                    alt={USER_PROFILE.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to chat icon if image fails to load
                      const img = e.currentTarget as HTMLImageElement;
                      const fallback = img.nextElementSibling as HTMLElement;
                      img.style.display = 'none'; 
                      fallback.style.display = 'flex';
                    }}
                  />
                  <svg className="w-10 h-10 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {/* AI Badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚡</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Meet {USER_PROFILE.name.split(' ')[0]}'s AI Twin
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
                      {USER_PROFILE.ai_context.description}
                    </p>
                  </div>

                  {/* Capabilities */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      What I can help you with:
                    </p>
                    <div className="grid gap-2">
                      {USER_PROFILE.ai_context.capabilities.map((capability, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span>{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Just start typing to begin our conversation! 👋
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                        💡 Ask me anything
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                        🚀 Get help with projects
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                        💬 Have a conversation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="flex-1 px-4 sm:px-6 py-4 space-y-1">
              <div className="max-w-4xl mx-auto">
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
                
                {/* Bottom padding to prevent last message from being hidden behind input */}
                <div className="h-4" />
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              scrollToBottom();
              setAutoScroll(true);
            }}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 