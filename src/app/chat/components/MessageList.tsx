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
            /* Empty state - no welcome screen */
            <div className="flex-1 px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Just empty space, ready for first message */}
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