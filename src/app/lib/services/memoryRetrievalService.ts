import { QuestionType, MEMORY_CONFIG } from '../config/twinConfig';
import { RetrievedMemory, UserMemoryContext } from '../types/twin.types';
import { DatabaseService } from './databaseService';
import { createEmbeddings } from '../embeddings';

export class MemoryRetrievalService {
  /**
   * Enhanced memory retrieval with question-type awareness
   */
  static async retrieveRelevantMemoriesEnhanced(
    message: string,
    questionType: QuestionType
  ): Promise<RetrievedMemory[]> {
    try {
      // Get memory count based on question type
      const memoryCount = MEMORY_CONFIG.count[questionType];

      if (memoryCount === 0) {
        return []; // No memories needed for casual questions
      }

      // Generate embedding for the user's message
      const embeddingResponse = await createEmbeddings(message);
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Search for similar memories with question-type-aware threshold
      const threshold = MEMORY_CONFIG.thresholds[questionType];
      const memories = await DatabaseService.searchMemories(
        queryEmbedding,
        {
          threshold,
          limit: memoryCount,
          subject: 'self',
          visibility: 'public'
        }
      );

      return memories.map((memory: { id: string; content: string; type: 'diary' | 'fact' | 'preference' | 'user_input' | 'system'; similarity?: number; tags: string[]; mood?: string; created_at: string }) => ({
        id: memory.id,
        content: memory.content,
        type: memory.type,
        relevance_score: memory.similarity || 0,
        tags: memory.tags,
        mood: memory.mood,
        created_at: memory.created_at
      }));

    } catch (error) {
      console.error('❌ Enhanced memory retrieval error:', error);
      return [];
    }
  }

  /**
   * Retrieve relevant memories using vector similarity search (legacy)
   */
  static async retrieveRelevantMemories(message: string): Promise<RetrievedMemory[]> {
    try {
      // Generate embedding for the user's message
      const embeddingResponse = await createEmbeddings(message);
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Search for similar memories
      const memories = await DatabaseService.searchMemories(
        queryEmbedding,
        {
          threshold: 0.2, // Optimized threshold for good recall
          limit: 8, // Top 8 most relevant memories
          subject: 'self', // Only Pragyan's memories
          visibility: 'public' // Only public memories for now
        }
      );

      return memories.map((memory: { id: string; content: string; type: 'diary' | 'fact' | 'preference' | 'user_input' | 'system'; similarity?: number; tags: string[]; mood?: string; created_at: string }) => ({
        id: memory.id,
        content: memory.content,
        type: memory.type,
        relevance_score: memory.similarity || 0,
        tags: memory.tags,
        mood: memory.mood,
        created_at: memory.created_at
      }));

    } catch (error) {
      console.error('❌ Memory retrieval error:', error);
      return []; // Graceful fallback - continue without memories
    }
  }

  /**
   * Get user context from previous interactions
   */
  static async getUserContext(userId: string): Promise<UserMemoryContext | null> {
    try {
      // Get user's previous memories and interactions
      const userMemories = await DatabaseService.getMemories({
        user_id: userId,
        type: 'user_input',
        limit: 50
      });

      if (userMemories.memories.length === 0) {
        return null;
      }

      // Analyze user preferences from their interactions
      const preferences = this.extractUserPreferences(userMemories.memories);

      return {
        user_id: userId,
        known_preferences: preferences,
        conversation_history_length: userMemories.total,
        relationship_level: this.determineRelationshipLevel(userMemories.total),
        last_interaction: userMemories.memories[0]?.created_at || new Date().toISOString()
      };

    } catch (error) {
      console.error('User context retrieval error:', error);
      return null;
    }
  }

  /**
   * Extract user preferences from memories
   */
  private static extractUserPreferences(memories: { tags?: string[] }[]): string[] {
    // Simple preference extraction - could be enhanced with AI
    const preferences: string[] = [];
    memories.forEach(memory => {
      if (memory.tags) {
        preferences.push(...memory.tags);
      }
    });
    return [...new Set(preferences)];
  }

  /**
   * Determine relationship level based on interaction count
   */
  private static determineRelationshipLevel(interactionCount: number): 'stranger' | 'acquaintance' | 'friend' | 'close_friend' {
    if (interactionCount === 0) return 'stranger';
    if (interactionCount < 5) return 'acquaintance';
    if (interactionCount < 20) return 'friend';
    return 'close_friend';
  }
} 