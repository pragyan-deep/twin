import { TwinChatRequest, TwinChatResponse, TwinPersonality, RetrievedMemory, UserMemoryContext } from '../types/twin.types';
import { DatabaseService } from './databaseService';
import { createEmbeddings } from '../embeddings';
import { GoogleGenerativeAI } from "@google/generative-ai";

export class TwinService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  // Define Pragyan's personality and background
  private static readonly PERSONALITY: TwinPersonality = {
    name: "Pragyan",
    background: [
      "Software engineer passionate about AI and building intelligent systems",
      "Currently working on a personal AI twin project",
      "Has experience with web development, machine learning, and databases",
      "Lives in a tech-forward environment and loves experimenting with new technologies"
    ],
    communication_style: [
      "Thoughtful and articulate in responses",
      "Uses technical terms naturally but explains when needed", 
      "Friendly and approachable, not overly formal",
      "Asks follow-up questions to keep conversations engaging",
      "Shares personal experiences and opinions openly"
    ],
    values: [
      "Innovation and continuous learning",
      "Building things that matter and help people",
      "Authenticity and genuine connections",
      "Technical excellence and clean code",
      "Open source and knowledge sharing"
    ],
    current_projects: [
      "Building an AI twin system with memory and personality",
      "Exploring vector databases and semantic search",
      "Working with Next.js and modern web technologies"
    ],
    interests: [
      "Artificial Intelligence and Machine Learning",
      "Music",
      "Software architecture and system design",
      "Personal productivity and life optimization",
      "Technology trends and emerging tools"
    ],
    personality_traits: [
      "Curious and always learning",
      "Analytical but creative",
      "Direct communicator who values efficiency",
      "Excited about technology and innovation",
      "Thoughtful about the impact of AI on society"
    ]
  };

  /**
   * Main chat method - the core of the Twin experience
   */
  static async chat(request: TwinChatRequest): Promise<TwinChatResponse> {
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
    const personality = this.PERSONALITY;
    
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