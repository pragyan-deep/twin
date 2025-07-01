import { CreateMemoryRequest, Memory, MemoryError } from '../types/memory.types';
import { createEmbeddings } from '../embeddings';

export class MemoryService {
  private static readonly MAX_CONTENT_LENGTH = 2000;
  private static readonly MAX_TAGS = 10;
  private static readonly MAX_TAG_LENGTH = 30;
  private static readonly MAX_MOOD_LENGTH = 50;

  /**
   * Validate memory creation request
   */
  static validateCreateRequest(request: CreateMemoryRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Content validation
    if (!request.content || typeof request.content !== 'string') {
      errors.push('Content is required and must be a string');
    } else {
      const trimmedContent = request.content.trim();
      if (trimmedContent.length === 0) {
        errors.push('Content cannot be empty');
      } else if (trimmedContent.length > this.MAX_CONTENT_LENGTH) {
        errors.push(`Content must be ${this.MAX_CONTENT_LENGTH} characters or less`);
      }
    }

    // Type validation
    if (!request.type || !['diary', 'fact', 'preference'].includes(request.type)) {
      errors.push('Type must be one of: diary, fact, preference');
    }

    // Visibility validation
    if (!request.visibility || !['public', 'close_friends', 'private'].includes(request.visibility)) {
      errors.push('Visibility must be one of: public, close_friends, private');
    }

    // Mood validation
    if (request.mood !== undefined) {
      if (typeof request.mood !== 'string') {
        errors.push('Mood must be a string');
      } else if (request.mood.trim().length > this.MAX_MOOD_LENGTH) {
        errors.push(`Mood must be ${this.MAX_MOOD_LENGTH} characters or less`);
      }
    }

    // Tags validation
    if (request.tags !== undefined) {
      if (!Array.isArray(request.tags)) {
        errors.push('Tags must be an array');
      } else {
        if (request.tags.length > this.MAX_TAGS) {
          errors.push(`Maximum ${this.MAX_TAGS} tags allowed`);
        }
        
        for (const tag of request.tags) {
          if (typeof tag !== 'string') {
            errors.push('All tags must be strings');
            break;
          } else if (tag.trim().length === 0) {
            errors.push('Tags cannot be empty');
            break;
          } else if (tag.trim().length > this.MAX_TAG_LENGTH) {
            errors.push(`Each tag must be ${this.MAX_TAG_LENGTH} characters or less`);
            break;
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize and normalize memory content
   */
  static sanitizeMemoryData(request: CreateMemoryRequest): CreateMemoryRequest {
    return {
      content: request.content.trim(),
      type: request.type,
      visibility: request.visibility,
      mood: request.mood?.trim() || undefined,
      tags: request.tags
        ? Array.from(new Set(
            request.tags
              .map(tag => tag.trim().toLowerCase())
              .filter(tag => tag.length > 0)
          ))
        : [],
      metadata: request.metadata || {}
    };
  }

  /**
   * Prepare content for embedding generation
   */
  static prepareContentForEmbedding(request: CreateMemoryRequest): string {
    let text = request.content;

    // Add context based on type
    const typeContext = {
      'diary': 'Personal diary entry',
      'fact': 'Personal fact about myself',
      'preference': 'Personal preference or opinion'
    };

    text = `${typeContext[request.type]}: ${text}`;

    // Include mood context if present
    if (request.mood && request.mood.trim()) {
      text = `${text} (feeling: ${request.mood.trim()})`;
    }

    // Include relevant tags
    if (request.tags && request.tags.length > 0) {
      const cleanTags = request.tags.filter(tag => tag.trim().length > 0);
      if (cleanTags.length > 0) {
        text = `${text} #${cleanTags.join(' #')}`;
      }
    }

    return text;
  }

  /**
   * Generate embedding for memory content
   */
  static async generateMemoryEmbedding(request: CreateMemoryRequest): Promise<{
    embedding: number[];
    model: string;
    usage: { prompt_tokens: number; total_tokens: number };
  }> {
    try {
      const preparedContent = this.prepareContentForEmbedding(request);
      const embeddingResponse = await createEmbeddings(preparedContent);
      
      return {
        embedding: embeddingResponse.data[0].embedding,
        model: embeddingResponse.model,
        usage: embeddingResponse.usage
      };
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error('Failed to generate embedding for memory content');
    }
  }

  /**
   * Enhance memory with AI analysis (placeholder for future features)
   */
  static async enhanceMemoryData(request: CreateMemoryRequest): Promise<{
    auto_tags_suggested: string[];
    sentiment_detected: string;
    entities_found: string[];
  }> {
    // TODO: Implement AI-powered enhancements
    // For now, return empty enhancements
    return {
      auto_tags_suggested: [],
      sentiment_detected: request.mood || 'neutral',
      entities_found: []
    };
  }

  /**
   * Create a new memory object with generated ID and timestamps
   */
  static createMemoryObject(
    request: CreateMemoryRequest,
    embedding?: number[]
  ): Omit<Memory, 'id' | 'created_at' | 'updated_at'> & { 
    id: string; 
    created_at: string; 
    updated_at: string;
    embedding?: number[];
  } {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      content: request.content,
      type: request.type,
      subject: 'self', // MVP: admin-only memory creation
      visibility: request.visibility,
      mood: request.mood || undefined,
      tags: request.tags || [],
      metadata: request.metadata || {},
      created_at: now,
      updated_at: now,
      ...(embedding && { embedding })
    };
  }

  /**
   * Extract common memory processing errors
   */
  static createErrorResponse(
    error: string,
    message: string,
    details?: Record<string, any>
  ): MemoryError {
    return {
      success: false,
      error,
      message,
      ...(details && { details })
    };
  }

  /**
   * Simple content analysis for basic insights
   */
  static analyzeContent(content: string): {
    word_count: number;
    character_count: number;
    contains_personal_pronouns: boolean;
    contains_emotions: boolean;
  } {
    const wordCount = content.trim().split(/\s+/).length;
    const characterCount = content.length;
    
    // Simple pattern matching for analysis
    const personalPronouns = /\b(I|me|my|mine|myself)\b/gi;
    const emotionWords = /\b(happy|sad|excited|angry|frustrated|grateful|anxious|calm|energized|tired|stressed|relaxed|motivated|disappointed|proud|embarrassed|curious|confused|confident|nervous|peaceful)\b/gi;
    
    return {
      word_count: wordCount,
      character_count: characterCount,
      contains_personal_pronouns: personalPronouns.test(content),
      contains_emotions: emotionWords.test(content)
    };
  }
} 