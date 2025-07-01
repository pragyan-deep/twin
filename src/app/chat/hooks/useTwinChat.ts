'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, ChatState } from '../types/chat.types';
import { TwinChatRequest, TwinChatResponse } from '../../lib/types/twin.types';
import { USER_PROFILE } from '../../lib/config/userProfile';

export function useTwinChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    currentConversation: 'default',
    streamingMessage: '',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const userIdRef = useRef<string>(`user_${Date.now()}_${Math.random().toString(36).substring(2)}`);
  const hasGreeted = useRef<boolean>(false);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    return newMessage.id;
  }, []);

  // Add initial greeting when component mounts
  useEffect(() => {
    if (!hasGreeted.current && USER_PROFILE.personality.ask_for_name) {
      hasGreeted.current = true;
      setTimeout(() => {
        addMessage({
          content: USER_PROFILE.greeting,
          role: 'assistant',
        });
      }, 500); // Small delay for better UX
    }
  }, [addMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Add user message
    addMessage({
      content: content.trim(),
      role: 'user',
    });

    // Add assistant message placeholder
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
      isStreaming: true,
    });

    setState(prev => ({ ...prev, isLoading: true, isStreaming: true, error: null }));

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Prepare Twin chat request
      const twinRequest: TwinChatRequest = {
        message: content.trim(),
        conversation_id: state.currentConversation,
        user_id: userIdRef.current,
        context: {
          relationship: 'acquaintance', // Could be dynamic based on interaction history
          previous_interactions: state.messages.filter(m => m.role === 'user').length
        }
      };

      const response = await fetch('/api/twin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(twinRequest),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const twinResponse: TwinChatResponse = await response.json();

      if (!twinResponse.success) {
        throw new Error(twinResponse.data?.response || 'Failed to get response from Twin');
      }

      // Simulate streaming effect for better UX (since we get the full response at once)
      const fullResponse = twinResponse.data.response;
      const words = fullResponse.split(' ');
      let currentIndex = 0;

      const streamWords = () => {
        if (currentIndex < words.length) {
          const currentText = words.slice(0, currentIndex + 1).join(' ');
          updateMessage(assistantMessageId, {
            content: currentText,
            isStreaming: true,
          });
          currentIndex++;
          setTimeout(streamWords, 50); // Adjust speed as needed
        } else {
          // Streaming complete
          updateMessage(assistantMessageId, {
            content: fullResponse,
            isStreaming: false,
          });
        }
      };

      streamWords();

      // Update conversation state with Twin metadata
      setState(prev => ({
        ...prev,
        currentConversation: twinResponse.data.conversation_id,
      }));

    } catch (error: unknown) {
      console.error('Twin chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof Error && error.name === 'AbortError') {
        // Remove the streaming message if aborted
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== assistantMessageId),
        }));
      } else {
        updateMessage(assistantMessageId, {
          content: 'Sorry, I encountered an error. Please try again.',
          isStreaming: false,
          isError: true,
        });
        setState(prev => ({ ...prev, error: errorMessage }));
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false, isStreaming: false }));
      abortControllerRef.current = null;
    }
  }, [state.messages, state.isLoading, state.currentConversation, addMessage, updateMessage]);

  const clearChat = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset to initial state with greeting
    setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      currentConversation: `conv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      streamingMessage: '',
      error: null,
    });

    // Reset greeting flag and show greeting again
    hasGreeted.current = false;
    setTimeout(() => {
      if (USER_PROFILE.personality.ask_for_name) {
        hasGreeted.current = true;
        addMessage({
          content: USER_PROFILE.greeting,
          role: 'assistant',
        });
      }
    }, 300);
  }, [addMessage]);

  const regenerateLastMessage = useCallback(async () => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find(msg => msg.role === 'user');
    
    if (!lastUserMessage) return;

    // Remove last assistant message if it exists
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter((msg, index) => {
        const isLastAssistantMessage = 
          msg.role === 'assistant' && 
          index === prev.messages.length - 1;
        return !isLastAssistantMessage;
      }),
    }));

    await sendMessage(lastUserMessage.content);
  }, [state.messages, sendMessage]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    updateMessage(messageId, {
      reactions: [{ emoji, count: 1, users: ['user'] }],
    });
  }, [updateMessage]);

  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId),
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    sendMessage,
    clearChat,
    regenerateLastMessage,
    addReaction,
    deleteMessage,
  };
} 