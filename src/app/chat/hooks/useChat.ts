'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, ChatState } from '../types/chat.types';
import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    currentConversation: 'default',
    streamingMessage: '',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

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

      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          ...state.messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
          { role: 'user', content: content.trim() },
        ],
        stream: true,
        max_tokens: 1000,
      }, {
        signal: abortControllerRef.current.signal,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          updateMessage(assistantMessageId, {
            content: fullResponse,
            isStreaming: true,
          });
        }
      }

      // Mark streaming as complete
      updateMessage(assistantMessageId, {
        content: fullResponse,
        isStreaming: false,
      });

    } catch (error: unknown) {
      console.error('Chat error:', error);
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
  }, [state.messages, state.isLoading, addMessage, updateMessage]);

  const clearChat = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      currentConversation: 'default',
      streamingMessage: '',
      error: null,
    });
  }, []);

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
    ...state,
    sendMessage,
    clearChat,
    regenerateLastMessage,
    addReaction,
    deleteMessage,
  };
} 