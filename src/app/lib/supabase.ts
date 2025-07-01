import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'twin-memory-system'
    }
  }
});

// Type definitions for database schema
export interface Database {
  public: {
    Tables: {
      memories: {
        Row: {
          id: string;
          content: string;
          embedding: number[] | null;
          type: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
          subject: 'self' | 'user';
          user_id: string | null;
          tags: string[];
          visibility: 'public' | 'close_friends' | 'private';
          mood: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          embedding?: number[] | null;
          type: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
          subject?: 'self' | 'user';
          user_id?: string | null;
          tags?: string[];
          visibility?: 'public' | 'close_friends' | 'private';
          mood?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          embedding?: number[] | null;
          type?: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
          subject?: 'self' | 'user';
          user_id?: string | null;
          tags?: string[];
          visibility?: 'public' | 'close_friends' | 'private';
          mood?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      search_memories: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_visibility?: 'public' | 'close_friends' | 'private';
          filter_type?: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
          filter_subject?: 'self' | 'user';
        };
        Returns: {
          id: string;
          content: string;
          type: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
          subject: 'self' | 'user';
          user_id: string | null;
          tags: string[];
          visibility: 'public' | 'close_friends' | 'private';
          mood: string | null;
          metadata: Record<string, any>;
          created_at: string;
          similarity: number;
        }[];
      };
      get_memory_stats: {
        Args: {};
        Returns: {
          total_memories: number;
          by_type: Record<string, number>;
          by_visibility: Record<string, number>;
          by_subject: Record<string, number>;
        }[];
      };
    };
  };
}

// Create typed Supabase client
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, operation: string): never {
  console.error(`Supabase ${operation} error:`, error);
  
  if (error.code === 'PGRST116') {
    throw new Error('Database table does not exist. Please run migrations first.');
  }
  
  if (error.code === '23505') {
    throw new Error('A memory with this ID already exists.');
  }
  
  if (error.code === '23502') {
    throw new Error('Required fields are missing.');
  }
  
  if (error.code === '42703') {
    throw new Error('Invalid column name in query.');
  }
  
  throw new Error(error.message || `Database ${operation} failed`);
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
} 