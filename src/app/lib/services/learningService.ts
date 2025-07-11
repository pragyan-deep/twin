import { QuestionType, EnhancedLearningResult, ResponseLengthConfig, COMMUNICATION_STYLE } from '../config/twinConfig';
import { TwinChatRequest, UserMemoryContext } from '../types/twin.types';
import { DatabaseService } from './databaseService';
import { createEmbeddings } from '../embeddings';

export class LearningService {
  /**
   * Enhanced learning from interaction with question-type awareness
   */
  static async enhancedLearnFromInteraction(
    questionType: QuestionType,
    request: TwinChatRequest,
    response: { response: string; tokens_used: number },
    userContext: UserMemoryContext | null
  ): Promise<EnhancedLearningResult> {
    const insights: string[] = [];
    let memoriesCreated = 0;
    let responseQualityScore = 0;
    let conversationPatternsStored = 0;

    try {
      // 1. Store user message with question type metadata
      if (request.user_id && request.message.trim().length > 10) {
        await this.storeUserMessageEnhanced(request, questionType);
        memoriesCreated++;
      }

      // 2. Extract question-type-specific insights
      insights.push(...this.extractQuestionTypeInsights(request.message, questionType));

      // 3. Assess response quality
      responseQualityScore = this.assessResponseQuality(response, questionType);

      // 4. Store successful conversation patterns
      if (responseQualityScore > 0.7) {
        await this.storeConversationPattern(request, response, questionType);
        conversationPatternsStored++;
      }

    } catch (error) {
      console.error('Enhanced learning error:', error);
    }

    return {
      new_memories_created: memoriesCreated,
      user_insights_gained: insights,
      response_quality_score: responseQualityScore,
      conversation_patterns_stored: conversationPatternsStored
    };
  }

  /**
   * Learn from the interaction and store user insights (legacy)
   */
  static async learnFromInteraction(
    request: TwinChatRequest,
    _response: { response: string; tokens_used: number },
    _userContext: UserMemoryContext | null
  ): Promise<{ new_memories_created: number; user_insights_gained: string[] }> {
    const insights: string[] = [];
    let memoriesCreated = 0;

    try {
      // Store the user's message as a user_input memory
      if (request.user_id && request.message.trim().length > 10) {
        // Generate embedding for user message so it can be searched later
        const userEmbeddingResponse = await createEmbeddings(request.message);
        const userEmbedding = userEmbeddingResponse.data[0].embedding;

        await DatabaseService.saveMemory({
          id: crypto.randomUUID(),
          content: request.message,
          embedding: userEmbedding,
          type: 'user_input',
          subject: 'user',
          user_id: request.user_id,
          tags: this.extractTagsFromMessage(request.message),
          visibility: 'private',
          metadata: {
            conversation_id: request.conversation_id,
            user_name: request.user_name,
            interaction_type: 'chat_message',
            timestamp: new Date().toISOString()
          }
        });
        memoriesCreated++;
      }

      // Extract insights from user message
      insights.push(...this.extractInsightsFromMessage(request.message));

    } catch (error) {
      console.error('Learning from interaction error:', error);
    }

    return {
      new_memories_created: memoriesCreated,
      user_insights_gained: insights
    };
  }

  /**
   * Store user message with enhanced metadata
   */
  private static async storeUserMessageEnhanced(request: TwinChatRequest, questionType: QuestionType): Promise<void> {
    const userEmbeddingResponse = await createEmbeddings(request.message);
    const userEmbedding = userEmbeddingResponse.data[0].embedding;

    await DatabaseService.saveMemory({
      id: crypto.randomUUID(),
      content: request.message,
      embedding: userEmbedding,
      type: 'user_input',
      subject: 'user',
      user_id: request.user_id,
      tags: this.extractTagsFromMessage(request.message),
      visibility: 'private',
      metadata: {
        conversation_id: request.conversation_id,
        user_name: request.user_name,
        interaction_type: 'chat_message',
        question_type: questionType,
        timestamp: new Date().toISOString(),
        classification_confidence: 'high' // Could be dynamic based on classification method
      }
    });
  }

  /**
   * Extract question-type-specific insights
   */
  private static extractQuestionTypeInsights(message: string, questionType: QuestionType): string[] {
    const insights: string[] = [];

    switch (questionType) {
      case 'personal':
        insights.push(...this.extractPersonalPreferences(message));
        break;
      case 'technical':
        insights.push(...this.extractTechnicalInterests(message));
        break;
      case 'deep':
        insights.push(...this.extractPhilosophicalInterests(message));
        break;
      case 'specific':
        insights.push(...this.extractContextualInfo(message));
        break;
      case 'casual':
        insights.push(...this.extractCommunicationStyle(message));
        break;
    }

    return insights;
  }

  /**
   * Extract personal preferences from message
   */
  private static extractPersonalPreferences(message: string): string[] {
    const preferences: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Music preferences
    if (lowerMessage.includes('music') || lowerMessage.includes('song')) {
      preferences.push('music_interest');
    }

    // Technology preferences
    if (lowerMessage.includes('tech') || lowerMessage.includes('programming')) {
      preferences.push('technology_interest');
    }

    return preferences;
  }

  /**
   * Extract technical interests from message
   */
  private static extractTechnicalInterests(message: string): string[] {
    const interests: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
      interests.push('javascript_interest');
    }
    if (lowerMessage.includes('python')) {
      interests.push('python_interest');
    }
    if (lowerMessage.includes('react') || lowerMessage.includes('nextjs')) {
      interests.push('frontend_interest');
    }

    return interests;
  }

  /**
   * Extract philosophical interests from message
   */
  private static extractPhilosophicalInterests(message: string): string[] {
    const interests: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) {
      interests.push('ai_philosophy_interest');
    }
    if (lowerMessage.includes('future') || lowerMessage.includes('technology')) {
      interests.push('future_tech_interest');
    }

    return interests;
  }

  /**
   * Extract contextual information from message
   */
  private static extractContextualInfo(message: string): string[] {
    const info: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('today') || lowerMessage.includes('recently')) {
      info.push('current_events_interest');
    }

    return info;
  }

  /**
   * Extract communication style from message
   */
  private static extractCommunicationStyle(message: string): string[] {
    const style: string[] = [];

    if (message.length < 20) {
      style.push('prefers_brief_communication');
    }
    if (message.includes('?')) {
      style.push('asks_questions');
    }

    return style;
  }

  /**
   * Assess response quality based on question type
   */
  private static assessResponseQuality(response: { response: string }, questionType: QuestionType): number {
    const actualWords = response.response.split(' ').length;
    const targetConfig = COMMUNICATION_STYLE.response_length[questionType];

    // Calculate length appropriateness score
    const lengthScore = this.calculateLengthScore(actualWords, targetConfig);

    // Could add more quality metrics here
    // - Tone appropriateness
    // - Question-asking when expected
    // - Memory usage appropriateness

    return lengthScore;
  }

  /**
   * Calculate length score based on target
   */
  private static calculateLengthScore(actualWords: number, targetConfig: ResponseLengthConfig): number {
    const { target_words, max_words } = targetConfig;

    if (actualWords <= target_words * 1.2) {
      return 1.0; // Perfect length
    }
    if (actualWords <= max_words) {
      return 0.8; // Acceptable length
    }
    if (actualWords <= max_words * 1.5) {
      return 0.6; // Too long but not terrible
    }

    return 0.3; // Way too long
  }

  /**
   * Store conversation pattern for future reference
   */
  private static async storeConversationPattern(
    request: TwinChatRequest,
    response: { response: string },
    questionType: QuestionType
  ): Promise<void> {
    try {
      // Store as a system memory for pattern recognition
      const patternEmbedding = await createEmbeddings(
        `${questionType}: ${request.message} -> ${response.response}`
      );

      await DatabaseService.saveMemory({
        id: crypto.randomUUID(),
        content: `Successful ${questionType} response pattern`,
        embedding: patternEmbedding.data[0].embedding,
        type: 'system',
        subject: 'self',
        tags: ['conversation_pattern', questionType],
        visibility: 'private',
        metadata: {
          question_type: questionType,
          user_input: request.message,
          twin_response: response.response,
          success_score: 1.0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error storing conversation pattern:', error);
    }
  }

  /**
   * Extract tags from message
   */
  private static extractTagsFromMessage(message: string): string[] {
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
   * Extract insights from message (legacy)
   */
  private static extractInsightsFromMessage(message: string): string[] {
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
} 