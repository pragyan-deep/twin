export interface TwinChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  user_name?: string;
  context?: {
    relationship?: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
    previous_interactions?: number;
  };
}

export interface TwinChatResponse {
  success: boolean;
  data: {
    response: string;
    conversation_id: string;
    memories_used: {
      count: number;
      types: string[];
      relevance_scores: number[];
    };
    personality: {
      tone: string;
      context_applied: string[];
    };
    learning: {
      new_memories_created: number;
      user_insights_gained: string[];
    };
  };
  meta: {
    processing_time_ms: number;
    tokens_used: number;
    memory_search_time_ms: number;
  };
}

export interface TwinChatError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, any>;
}

export interface RetrievedMemory {
  id: string;
  content: string;
  type: 'diary' | 'fact' | 'preference' | 'user_input' | 'system';
  relevance_score: number;  
  tags: string[];
  mood?: string;
  created_at: string;
}

export interface TwinPersonality {
  name: string;
  background: string[];
  communication_style: string[];  
  values: string[];
  current_projects: string[];
  interests: string[];
  personality_traits: string[];
}

export interface UserMemoryContext {
  user_id: string;
  user_name?: string;
  known_preferences: string[];
  conversation_history_length: number;
  relationship_level: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
  last_interaction: string;
} 