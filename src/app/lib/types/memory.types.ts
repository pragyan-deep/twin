export interface CreateMemoryRequest {
  content: string;
  type: 'diary' | 'fact' | 'preference';
  visibility: 'public' | 'close_friends' | 'private';
  mood?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Memory {
  id: string;
  content: string;
  type: 'diary' | 'fact' | 'preference';
  subject: 'self' | 'user';
  user_id?: string;
  visibility: 'public' | 'close_friends' | 'private';
  mood?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MemoryWithEmbedding extends Memory {
  embedding: number[];
  similarity?: number;
}

export interface CreateMemoryResponse {
  success: boolean;
  data: {
    memory: Memory;
    embedding: {
      dimensions: number;
      model: string;
      generated_at: string;
    };
    processing: {
      auto_tags_suggested?: string[];
      sentiment_detected?: string;
      entities_found?: string[];
    };
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  };
  meta: {
    processing_time_ms: number;
    tokens_used: number;
  };
}

export interface MemoryError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, any>;
}

export interface ListMemoriesRequest {
  page?: number;
  limit?: number;
  type?: 'diary' | 'fact' | 'preference';
  visibility?: 'public' | 'close_friends' | 'private';
  tags?: string[];
  search?: string;
  mood?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'relevance';
  sort_order?: 'asc' | 'desc';
}

export interface ListMemoriesResponse {
  success: boolean;
  data: {
    memories: Memory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: {
      applied: Record<string, any>;
      available: Record<string, any>;
    };
  };
}

export interface SearchMemoriesRequest {
  query: string;
  threshold?: number;
  limit?: number;
  filters?: Omit<ListMemoriesRequest, 'search' | 'page' | 'limit'>;
}

export interface SearchMemoriesResponse {
  success: boolean;
  data: {
    memories: MemoryWithEmbedding[];
    query: string;
    results_count: number;
    search_time_ms: number;
  };
} 