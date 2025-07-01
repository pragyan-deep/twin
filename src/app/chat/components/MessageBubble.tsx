'use client';

import { useState } from 'react';
import { Message } from '../types/chat.types';

interface MessageBubbleProps {
  message: Message;
  onReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

export function MessageBubble({ message, onReaction, onDelete, onCopy }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.(message.content);
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(timestamp);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isUser ? 'U' : 'T'}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`relative px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-blue-500 text-white'
                : isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Message Content */}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1">|</span>
              )}
            </div>

            {/* Message Actions (appear on hover) */}
            {isHovered && !message.isStreaming && (
              <div className={`absolute top-0 ${isUser ? 'right-full mr-2' : 'left-full ml-2'} flex items-center space-x-1`}>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy message"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                
                {!isUser && (
                  <button
                    onClick={() => onReaction?.(message.id, '👍')}
                    className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Like message"
                  >
                    👍
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete message"
                  >
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center space-x-2 mt-1">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => onReaction?.(message.id, reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600 dark:text-gray-400">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
} 