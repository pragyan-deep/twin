'use client';

import { useState, useCallback } from 'react';
import { EmbeddingsService } from '../../lib/services/embeddingsService';
import { EmbeddingsResponse } from '../../lib/types/embeddings.types';

interface UseEmbeddingsState {
  isLoading: boolean;
  error: string | null;
  lastEmbedding: EmbeddingsResponse | null;
}

export function useEmbeddings() {
  const [state, setState] = useState<UseEmbeddingsState>({
    isLoading: false,
    error: null,
    lastEmbedding: null,
  });

  const generateEmbeddings = useCallback(async (text: string): Promise<EmbeddingsResponse | null> => {
    if (!text || text.trim().length === 0) {
      setState(prev => ({ ...prev, error: 'Text cannot be empty' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await EmbeddingsService.generateEmbeddings(text);
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastEmbedding: result,
        error: null,
      }));
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate embeddings';
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastEmbedding: null,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearLastEmbedding = useCallback(() => {
    setState(prev => ({ ...prev, lastEmbedding: null }));
  }, []);

  return {
    ...state,
    generateEmbeddings,
    clearError,
    clearLastEmbedding,
  };
} 