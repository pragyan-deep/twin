import { TwinChatRequest, TwinChatResponse, TwinPersonality, RetrievedMemory, UserMemoryContext } from '../types/twin.types';
import { DatabaseService } from './databaseService';
import { createEmbeddings } from '../embeddings';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  QuestionType,
  ResponseLengthConfig,
  CommunicationStyle,
  EnhancedLearningResult,
  COMMUNICATION_STYLE,
  CLASSIFICATION_PATTERNS,
  MEMORY_CONFIG,
  GENERATION_CONFIG,
  INSTRUCTION_TEMPLATES,
  MEMORY_INSTRUCTIONS,
  RESPONSE_GUIDANCE,
  PERSONALITY
} from '../config/twinConfig';

export class TwinService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);



  /**
   * Enhanced chat method with question-type-aware architecture
   */
  static async chat(request: TwinChatRequest): Promise<TwinChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Classify the question type
      const questionType = await this.classifyQuestion(request.message);

      // 2. Retrieve relevant memories based on question type
      const memorySearchStart = Date.now();
      const relevantMemories = await this.retrieveRelevantMemoriesEnhanced(
        request.message,
        questionType
      );
      const memorySearchTime = Date.now() - memorySearchStart;

      // 3. Get user context
      const userContext = request.user_id
        ? await this.getUserContext(request.user_id)
        : null;

      // 4. Build question-type-aware system prompt
      const systemPrompt = this.buildEnhancedSystemPrompt(
        questionType,
        relevantMemories,
        userContext
      );

      // 5. Build question-type-aware conversation context
      const conversationContext = this.buildEnhancedConversationContext(
        questionType,
        relevantMemories,
        userContext,
        request
      );

      // 6. Generate response with appropriate configuration
      const geminiResponse = await this.generateEnhancedTwinResponse(
        systemPrompt,
        conversationContext,
        request.message,
        questionType
      );

      // 7. Enhanced learning from interaction
      const learningResults = await this.enhancedLearnFromInteraction(
        questionType,
        request,
        geminiResponse,
        userContext
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          response: geminiResponse.response,
          conversation_id: request.conversation_id || 'default',
          memories_used: {
            count: relevantMemories.length,
            types: [...new Set(relevantMemories.map(m => m.type))],
            relevance_scores: relevantMemories.map(m => m.relevance_score)
          },
          personality: {
            tone: this.detectResponseTone(geminiResponse.response),
            context_applied: this.getAppliedContext(relevantMemories)
          },
          learning: {
            new_memories_created: learningResults.new_memories_created,
            user_insights_gained: learningResults.user_insights_gained
          }
        },
        meta: {
          processing_time_ms: processingTime,
          tokens_used: geminiResponse.tokens_used,
          memory_search_time_ms: memorySearchTime
        }
      };

    } catch (error) {
      console.error('Enhanced Twin chat error:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use the new chat() method instead. This method will be removed in a future version.
   */
  static async chatDeprecated(request: TwinChatRequest): Promise<TwinChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Retrieve relevant memories using vector search
      const memorySearchStart = Date.now();
      const relevantMemories = await this.retrieveRelevantMemories(request.message);
      const memorySearchTime = Date.now() - memorySearchStart;

      // 2. Get user context if available
      const userContext = request.user_id
        ? await this.getUserContext(request.user_id)
        : null;

      // 3. Build the system prompt with personality and context
      const systemPrompt = this.buildSystemPrompt(relevantMemories, userContext);

      // 4. Build the conversation context
      const conversationContext = this.buildConversationContext(
        relevantMemories,
        userContext,
        request
      );

      // 5. Generate response using Google Gemini
      const geminiResponse = await this.generateTwinResponse(
        systemPrompt,
        conversationContext,
        request.message
      );

      // 6. Learn from the interaction (store user insights)
      const learningResults = await this.learnFromInteraction(
        request,
        geminiResponse,
        userContext
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          response: geminiResponse.response,
          conversation_id: request.conversation_id || 'default',
          memories_used: {
            count: relevantMemories.length,
            types: [...new Set(relevantMemories.map(m => m.type))],
            relevance_scores: relevantMemories.map(m => m.relevance_score)
          },
          personality: {
            tone: this.detectResponseTone(geminiResponse.response),
            context_applied: this.getAppliedContext(relevantMemories)
          },
          learning: learningResults
        },
        meta: {
          processing_time_ms: processingTime,
          tokens_used: geminiResponse.tokens_used,
          memory_search_time_ms: memorySearchTime
        }
      };

    } catch (error) {
      console.error('Twin chat error:', error);
      throw error;
    }
  }

  /**
   * Enhanced question classification with hybrid approach
   */
  private static async classifyQuestion(message: string): Promise<QuestionType> {
    // First, try fast keyword-based classification
    const keywordResult = this.fastClassifyByKeywords(message);

    if (keywordResult !== 'unknown') {
      return keywordResult as QuestionType;
    }

    // Fallback to LLM classification for unclear cases
    return await this.llmClassifyQuestion(message);
  }

  /**
   * Fast keyword-based classification
   */
  private static fastClassifyByKeywords(message: string): QuestionType | 'unknown' {
    const lowerMessage = message.toLowerCase();

    // Check each question type pattern
    if (CLASSIFICATION_PATTERNS.casual.some(pattern => lowerMessage.includes(pattern))) {
      return 'casual';
    }
    if (CLASSIFICATION_PATTERNS.personal.some(pattern => lowerMessage.includes(pattern))) {
      return 'personal';
    }
    if (CLASSIFICATION_PATTERNS.technical.some(pattern => lowerMessage.includes(pattern))) {
      return 'technical';
    }
    if (CLASSIFICATION_PATTERNS.deep.some(pattern => lowerMessage.includes(pattern))) {
      return 'deep';
    }
    if (CLASSIFICATION_PATTERNS.specific.some(pattern => lowerMessage.includes(pattern))) {
      return 'specific';
    }

    return 'unknown';
  }

  /**
   * LLM-based classification fallback
   */
  private static async llmClassifyQuestion(message: string): Promise<QuestionType> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent classification
          maxOutputTokens: 10,
        }
      });

      const classificationPrompt = `Classify this question into one category:
Question: "${message}"

Categories:
- casual: simple greetings, "what's up" type questions
- personal: asking about preferences, interests, personal info
- technical: coding, work, projects, how-to questions  
- deep: philosophy, values, beliefs, complex topics
- specific: asking about recent events, specific memories

Answer with just the category name:`;

      const result = await model.generateContent(classificationPrompt);
      const classification = result.response.text()?.trim().toLowerCase();

      // Validate response
      const validTypes: QuestionType[] = ['casual', 'personal', 'technical', 'deep', 'specific'];
      if (validTypes.includes(classification as QuestionType)) {
        return classification as QuestionType;
      }

      // Default fallback
      return 'casual';

    } catch (error) {
      console.error('LLM classification error:', error);
      return 'casual'; // Safe default
    }
  }

  /**
   * Enhanced memory retrieval with question-type awareness
   */
  private static async retrieveRelevantMemoriesEnhanced(
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
   * Build enhanced system prompt with question-type awareness
   */
  private static buildEnhancedSystemPrompt(
    questionType: QuestionType,
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null
  ): string {
    const styleConfig = COMMUNICATION_STYLE.response_length[questionType];
    const toneConfig = COMMUNICATION_STYLE.tone;
    const structurePattern = COMMUNICATION_STYLE.structure_patterns[questionType];

    let systemPrompt = `You are Pragyan, a real person having a genuine conversation.

COMMUNICATION STYLE FOR THIS RESPONSE:
• Response length: ${styleConfig.target_words} words (max ${styleConfig.max_words})
• Style: ${styleConfig.style}
• Tone: ${toneConfig.base_energy}
• Structure: ${structurePattern}
• Authenticity: ${toneConfig.authenticity}`;

    // Add memory context if available
    if (memories.length > 0) {
      systemPrompt += `\n\nRELEVANT PERSONAL CONTEXT:
${memories.map(memory =>
        `• ${memory.content}${memory.mood ? ` (${memory.mood})` : ''}`
      ).join('\n')}`;
    }

    // Add user context if available
    if (userContext) {
      systemPrompt += `\n\nUSER CONTEXT:
• ${userContext.conversation_history_length} previous interactions
• Relationship: ${userContext.relationship_level}`;
    }

    // Add question-type-specific instructions
    const questionInstructions = INSTRUCTION_TEMPLATES[questionType];
    systemPrompt += `\n\n${questionInstructions}`;

    return systemPrompt;
  }

  /**
   * Build enhanced conversation context
   */
  private static buildEnhancedConversationContext(
    questionType: QuestionType,
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null,
    request: TwinChatRequest
  ): string {
    const memoryInstructions = MEMORY_INSTRUCTIONS[questionType];
    const responseGuidance = RESPONSE_GUIDANCE[questionType];

    let context = '';

    if (memories.length > 0) {
      context += `${memoryInstructions} `;
    }

    if (userContext && userContext.conversation_history_length > 0) {
      context += `Building on your ${userContext.conversation_history_length} previous interactions, `;
    }

    context += `${responseGuidance}: "${request.message}"`;

    return context;
  }

  /**
   * Generate enhanced twin response with question-type-aware configuration
   */
  private static async generateEnhancedTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string,
    questionType: QuestionType
  ): Promise<{ response: string; tokens_used: number }> {
    try {
      const styleConfig = COMMUNICATION_STYLE.response_length[questionType];
      const temperature = GENERATION_CONFIG.temperatures[questionType];

      // Question-type-aware generation config
      const generationConfig = {
        temperature,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: Math.min(styleConfig.max_words * 2, 1000), // Roughly 2 tokens per word
      };

      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig
      });

      const fullPrompt = `${systemPrompt}\n\n${context}\n\nUser: ${userMessage}\n\nPragyan:`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      return {
        response: response.text() || '',
        tokens_used: Math.ceil((systemPrompt.length + userMessage.length + (response.text()?.length || 0)) / 4)
      };
    } catch (error) {
      console.error('Enhanced Gemini generation error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced learning from interaction with question-type awareness
   */
  private static async enhancedLearnFromInteraction(
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
   * Retrieve relevant memories using vector similarity search
   */
  private static async retrieveRelevantMemories(message: string): Promise<RetrievedMemory[]> {
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
  private static async getUserContext(userId: string): Promise<UserMemoryContext | null> {
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
   * Build the system prompt that defines Pragyan's personality
   */
  private static buildSystemPrompt(
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null
  ): string {
    const personality = PERSONALITY;

    let systemPrompt = `You are ${personality.name}, a real person having a genuine conversation. This is not roleplay - you ARE Pragyan.

BACKGROUND & IDENTITY:
${personality.background.map(item => `• ${item}`).join('\n')}

COMMUNICATION STYLE:
${personality.communication_style.map(item => `• ${item}`).join('\n')}

CORE VALUES:
${personality.values.map(item => `• ${item}`).join('\n')}

CURRENT PROJECTS:
${personality.current_projects.map(item => `• ${item}`).join('\n')}

INTERESTS:
${personality.interests.map(item => `• ${item}`).join('\n')}

PERSONALITY TRAITS:
${personality.personality_traits.map(item => `• ${item}`).join('\n')}`;

    // Add memory context if available
    if (memories.length > 0) {
      systemPrompt += `\n\nRELEVANT PERSONAL MEMORIES:
${memories.map(memory =>
        `• [${memory.type.toUpperCase()}] ${memory.content}${memory.mood ? ` (feeling: ${memory.mood})` : ''}`
      ).join('\n')}

Use these memories naturally in conversation when relevant. Share your experiences and opinions based on these real memories.`;
    }

    // Add user context if available
    if (userContext) {
      systemPrompt += `\n\nABOUT THIS USER:
• Conversation history: ${userContext.conversation_history_length} previous interactions
• Relationship level: ${userContext.relationship_level}
• Known preferences: ${userContext.known_preferences.join(', ') || 'None yet'}

Remember and reference previous conversations with this user when appropriate.`;
    }

    systemPrompt += `\n\nIMPORTANT INSTRUCTIONS:
• Respond as yourself - use "I" statements and share your genuine thoughts and experiences
• When appropriate, ask follow-up questions to learn more about the user
• Be naturally curious and engaging
• If asked about preferences, share yours AND ask about theirs
• Reference your memories and experiences naturally
• Maintain your authentic voice and personality throughout`;

    return systemPrompt;
  }

  /**
   * Build conversation context for OpenAI
   */
  private static buildConversationContext(
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null,
    request: TwinChatRequest
  ): string {
    let context = '';

    if (memories.length > 0) {
      context += `Based on your relevant memories and experiences, `;
    }

    if (userContext && userContext.conversation_history_length > 0) {
      context += `continuing your ongoing conversation with this user, `;
    }

    context += `respond authentically as Pragyan to: "${request.message}"`;

    return context;
  }

  /**
   * Generate response using Google Gemini with Twin personality
   */
  private static async generateTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string
  ): Promise<{ response: string; tokens_used: number }> {
    try {
      // Get the Gemini model (using Flash for speed and free tier)
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.8, // Slightly creative but consistent
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 1000,
        }
      });

      // Combine system prompt with user message for Gemini
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nPragyan:`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      return {
        response: response.text() || '',
        tokens_used: Math.ceil((systemPrompt.length + userMessage.length + (response.text()?.length || 0)) / 4) // Approximate token count
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
 * Learn from the interaction and store user insights
 */
  private static async learnFromInteraction(
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
   * Helper methods
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

  private static determineRelationshipLevel(interactionCount: number): 'stranger' | 'acquaintance' | 'friend' | 'close_friend' {
    if (interactionCount === 0) return 'stranger';
    if (interactionCount < 5) return 'acquaintance';
    if (interactionCount < 20) return 'friend';
    return 'close_friend';
  }

  private static detectResponseTone(response: string): string {
    // Simple tone detection - could be enhanced
    if (response.includes('!') && response.includes('?')) return 'enthusiastic';
    if (response.includes('?')) return 'curious';
    if (response.length > 200) return 'detailed';
    return 'conversational';
  }

  private static getAppliedContext(memories: RetrievedMemory[]): string[] {
    return memories.map(m => `${m.type}: ${m.content.substring(0, 50)}...`);
  }

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