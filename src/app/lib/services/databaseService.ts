import { supabaseTyped, handleSupabaseError } from '../supabase';
import { Memory, MemoryWithEmbedding } from '../types/memory.types';

export class DatabaseService {
  /**
   * Save a new memory to the database
   */
  static async saveMemory(memoryData: {
    id: string;
    content: string;
    embedding: number[];
    type: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
    subject: 'self' | 'user';
    user_id?: string;
    tags: string[];
    visibility: 'public' | 'close_friends' | 'private';
    mood?: string;
    metadata: Record<string, any>;
  }): Promise<Memory> {
    try {
      const { data, error } = await supabaseTyped
        .from('memories')
        .insert({
          id: memoryData.id,
          content: memoryData.content,
          embedding: memoryData.embedding,
          type: memoryData.type,
          subject: memoryData.subject,
          user_id: memoryData.user_id || null,
          tags: memoryData.tags,
          visibility: memoryData.visibility,
          mood: memoryData.mood || null,
          metadata: memoryData.metadata
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'insert memory');
      }

      if (!data) {
        throw new Error('No data returned from memory insert');
      }

      return {
        id: data.id,
        content: data.content,
        type: data.type,
        subject: data.subject,
        user_id: data.user_id,
        tags: data.tags,
        visibility: data.visibility,
        mood: data.mood,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error saving memory to database:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to save memory to database');
    }
  }

  /**
   * Get memories with optional filtering and pagination
   */
  static async getMemories(options: {
    page?: number;
    limit?: number;
    type?: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
    visibility?: 'public' | 'close_friends' | 'private';
    user_id?: string;
    tags?: string[];
    search?: string;
  } = {}): Promise<{
    memories: Memory[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabaseTyped
        .from('memories')
        .select('*', { count: 'exact' });

      // Apply filters
      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      if (options.user_id) {
        query = query.eq('user_id', options.user_id);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options.search) {
        query = query.ilike('content', `%${options.search}%`);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        handleSupabaseError(error, 'fetch memories');
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        memories: data?.map(row => ({
          id: row.id,
          content: row.content,
          type: row.type,
          subject: row.subject,
          user_id: row.user_id,
          tags: row.tags,
          visibility: row.visibility,
          mood: row.mood,
          metadata: row.metadata,
          created_at: row.created_at,
          updated_at: row.updated_at
        })) || [],
        total,
        page,
        limit,
        pages
      };
    } catch (error) {
      console.error('Error fetching memories from database:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch memories from database');
    }
  }

  /**
   * Get a single memory by ID
   */
  static async getMemoryById(id: string): Promise<Memory | null> {
    try {
      const { data, error } = await supabaseTyped
        .from('memories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        handleSupabaseError(error, 'fetch memory by ID');
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        content: data.content,
        type: data.type,
        subject: data.subject,
        user_id: data.user_id,
        tags: data.tags,
        visibility: data.visibility,
        mood: data.mood,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching memory by ID:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch memory');
    }
  }

  /**
   * Search memories using vector similarity
   */
  static async searchMemories(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      visibility?: 'public' | 'close_friends' | 'private';
      type?: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
      subject?: 'self' | 'user';
    } = {}
  ): Promise<MemoryWithEmbedding[]> {
    try {
      const { data, error } = await supabaseTyped.rpc('search_memories', {
        query_embedding: queryEmbedding,
        match_threshold: options.threshold || 0.8,
        match_count: options.limit || 10,
        filter_visibility: options.visibility || null,
        filter_type: options.type || null,
        filter_subject: options.subject || null
      });

      if (error) {
        handleSupabaseError(error, 'search memories');
      }

      return data?.map((row: any) => ({
        id: row.id,
        content: row.content,
        type: row.type,
        subject: row.subject,
        user_id: row.user_id,
        tags: row.tags,
        visibility: row.visibility,
        mood: row.mood,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.created_at, // Note: search function doesn't return updated_at
        embedding: [], // Embedding not returned in search results for performance
        similarity: row.similarity
      })) || [];
    } catch (error) {
      console.error('Error searching memories:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search memories');
    }
  }

  /**
   * Get memory statistics
   */
  static async getMemoryStats(): Promise<{
    total_memories: number;
    by_type: Record<string, number>;
    by_visibility: Record<string, number>;
    by_subject: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabaseTyped.rpc('get_memory_stats');

      if (error) {
        handleSupabaseError(error, 'get memory stats');
      }

      if (!data || data.length === 0) {
        return {
          total_memories: 0,
          by_type: {},
          by_visibility: {},
          by_subject: {}
        };
      }

      return data[0];
    } catch (error) {
      console.error('Error fetching memory stats:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch memory statistics');
    }
  }

  /**
   * Update a memory
   */
  static async updateMemory(
    id: string,
    updates: {
      content?: string;
      embedding?: number[];
      type?: 'fact' | 'diary' | 'preference' | 'user_input' | 'system';
      tags?: string[];
      visibility?: 'public' | 'close_friends' | 'private';
      mood?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Memory> {
    try {
      const { data, error } = await supabaseTyped
        .from('memories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'update memory');
      }

      if (!data) {
        throw new Error('Memory not found');
      }

      return {
        id: data.id,
        content: data.content,
        type: data.type,
        subject: data.subject,
        user_id: data.user_id,
        tags: data.tags,
        visibility: data.visibility,
        mood: data.mood,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating memory:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update memory');
    }
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(id: string): Promise<void> {
    try {
      const { error } = await supabaseTyped
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'delete memory');
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete memory');
    }
  }

  /**
   * Check if database is healthy and accessible
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabaseTyped
        .from('memories')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
} 