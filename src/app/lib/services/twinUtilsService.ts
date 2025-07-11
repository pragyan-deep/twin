import { RetrievedMemory } from '../types/twin.types';

export class TwinUtilsService {
  /**
   * Detect response tone from text
   */
  static detectResponseTone(response: string): string {
    // Simple tone detection - could be enhanced
    if (response.includes('!') && response.includes('?')) return 'enthusiastic';
    if (response.includes('?')) return 'curious';
    if (response.length > 200) return 'detailed';
    return 'conversational';
  }

  /**
   * Get applied context from memories
   */
  static getAppliedContext(memories: RetrievedMemory[]): string[] {
    return memories.map(m => `${m.type}: ${m.content.substring(0, 50)}...`);
  }

  /**
   * Extract user preferences from memories
   */
  static extractUserPreferences(memories: { tags?: string[] }[]): string[] {
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
  static determineRelationshipLevel(interactionCount: number): 'stranger' | 'acquaintance' | 'friend' | 'close_friend' {
    if (interactionCount === 0) return 'stranger';
    if (interactionCount < 5) return 'acquaintance';
    if (interactionCount < 20) return 'friend';
    return 'close_friend';
  }

  /**
   * Extract tags from message
   */
  static extractTagsFromMessage(message: string): string[] {
    // Simple tag extraction based on keywords
    const tags: string[] = [];
    const keywords = ['music', 'code', 'project', 'food', 'work', 'tech', 'ai', 'programming'];

    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  /**
   * Extract insights from message
   */
  static extractInsightsFromMessage(message: string): string[] {
    const insights: string[] = [];

    // Look for preference statements
    if (message.toLowerCase().includes('i like') || message.toLowerCase().includes('i love')) {
      insights.push('expressed_preference');
    }

    if (message.toLowerCase().includes('i work') || message.toLowerCase().includes('my job')) {
      insights.push('work_context');
    }

    return insights;
  }

  /**
   * Format processing time for display
   */
  static formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${Math.round(timeMs)}ms`;
    }
    return `${(timeMs / 1000).toFixed(1)}s`;
  }

  /**
   * Calculate token count estimation
   */
  static estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4); // Rough approximation
  }

  /**
   * Validate conversation ID format
   */
  static validateConversationId(conversationId: string): boolean {
    // Simple validation - could be enhanced
    return conversationId.length > 0 && conversationId.length < 100;
  }

  /**
   * Sanitize user input
   */
  static sanitizeUserInput(input: string): string {
    // Basic sanitization - remove excessive whitespace
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Check if message is too short for meaningful processing
   */
  static isMessageTooShort(message: string): boolean {
    return message.trim().length < 3;
  }

  /**
   * Check if message is too long for processing
   */
  static isMessageTooLong(message: string): boolean {
    return message.length > 2000; // Arbitrary limit
  }

  /**
   * Generate unique interaction ID
   */
  static generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 