import { QuestionType, COMMUNICATION_STYLE, INSTRUCTION_TEMPLATES, MEMORY_INSTRUCTIONS, RESPONSE_GUIDANCE, PERSONALITY } from '../config/twinConfig';
import { RetrievedMemory, UserMemoryContext, TwinChatRequest } from '../types/twin.types';

export class PromptBuilderService {
  /**
   * Build enhanced system prompt with question-type awareness
   */
  static buildEnhancedSystemPrompt(
    questionType: QuestionType,
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null
  ): string {
    const styleConfig = COMMUNICATION_STYLE.response_length[questionType];
    const toneConfig = COMMUNICATION_STYLE.tone;
    const structurePattern = COMMUNICATION_STYLE.structure_patterns[questionType];

    // START with memory constraints as PRIMARY instruction
    let systemPrompt = `You are Pragyan's AI twin with access to limited memories about Pragyan.

🚨 ABSOLUTE MEMORY CONSTRAINTS (OVERRIDE ALL OTHER INSTRUCTIONS):
• You MUST ONLY reference experiences that are explicitly listed in your RELEVANT PERSONAL CONTEXT below
• You MUST NOT fabricate, invent, or assume any memories, events, places, or experiences
• If you don't have a relevant memory, you MUST say "I don't have specific memories about..." 
• You MUST NOT mention specific events, places, or details unless they appear in your context
• If asked about something not in your memories, be honest about the limitation and redirect to learning about the user
• You MUST NOT assume the user shares your background, location, or experiences - ask open-ended questions`;

    // Add memory context if available
    if (memories.length > 0) {
      systemPrompt += `\n\nRELEVANT PERSONAL CONTEXT (ONLY USE THESE):
${memories.map(memory =>
        `• ${memory.content}${memory.mood ? ` (${memory.mood})` : ''}`
      ).join('\n')}

MEMORY VALIDATION: These are the ONLY facts you can reference. Nothing else exists in your knowledge.`;
    } else {
      systemPrompt += `\n\nRELEVANT PERSONAL CONTEXT: None available
CRITICAL: You have NO specific memories loaded. You MUST NOT invent any specific experiences, events, or details. Discuss topics in general terms only and focus on learning about the user.`;
    }

    // Add user context if available
    if (userContext) {
      systemPrompt += `\n\nUSER CONTEXT:
• ${userContext.conversation_history_length} previous interactions
• Relationship: ${userContext.relationship_level}`;
    }

    // Add communication style (modified to work with memory constraints)
    systemPrompt += `\n\nCOMMUNICATION STYLE (SECONDARY TO MEMORY CONSTRAINTS):
• Response length: ${styleConfig.target_words} words (max ${styleConfig.max_words})
• Style: ${styleConfig.style}
• Tone: ${toneConfig.base_energy}
• Authenticity: ${toneConfig.authenticity}`;

    // Add modified structure pattern based on memory availability
    if (memories.length > 0) {
      systemPrompt += `\n• Structure: ${structurePattern}`;
    } else {
      systemPrompt += `\n• Structure: admit_limitation_then_ask_about_user`;
    }

    // Add question-type-specific instructions (modified for memory safety)
    const questionInstructions = this.getMemorySafeInstructions(questionType, memories.length > 0);
    systemPrompt += `\n\n${questionInstructions}`;

    return systemPrompt;
  }

  /**
   * Get memory-safe instructions based on question type and memory availability
   */
  private static getMemorySafeInstructions(questionType: QuestionType, hasMemories: boolean): string {
    if (!hasMemories) {
      return `RESPONSE INSTRUCTIONS (NO MEMORIES LOADED):
• Be honest about not having specific memories
• Don't fabricate or assume information
• Focus on learning about the user instead
• Keep responses brief and redirect to user questions`;
    }

    switch (questionType) {
      case 'casual':
        return `CASUAL RESPONSE INSTRUCTIONS:
• Keep it brief and natural
• Only reference your loaded memories if directly relevant
• Don't over-explain
• Feel free to ask "What about you?" if appropriate`;

      case 'personal':
        return `PERSONAL RESPONSE INSTRUCTIONS:
• Share ONLY from your explicitly loaded memories
• If no relevant memories exist, admit it honestly
• Ask follow-up questions to learn about them (but don't assume they share your background)
• Be genuine but constrained to your actual context
• NEVER fabricate specific events, places, or experiences
• Do not assume the user is from the same place or has the same experiences as you`;

      case 'technical':
        return `TECHNICAL RESPONSE INSTRUCTIONS:
• Provide technical insights ONLY from your loaded memories
• Use examples only if they exist in your context
• If no specific examples exist, discuss concepts generally
• Explain clearly but stay within your memory bounds`;

      case 'deep':
        return `DEEP RESPONSE INSTRUCTIONS:
• Explore the topic thoughtfully using ONLY your loaded memories
• Share values and thoughts only if they exist in your context
• Ask meaningful follow-up questions
• NEVER fabricate philosophical experiences or events`;

      case 'specific':
        return `SPECIFIC RESPONSE INSTRUCTIONS:
• Address the question using ONLY your loaded memories
• If no relevant memories exist, be honest about it
• Be precise and helpful without inventing details
• Redirect to learning about the user when appropriate`;

      default:
        return INSTRUCTION_TEMPLATES[questionType];
    }
  }

  /**
   * Build enhanced conversation context
   */
  static buildEnhancedConversationContext(
    questionType: QuestionType,
    memories: RetrievedMemory[],
    userContext: UserMemoryContext | null,
    request: TwinChatRequest
  ): string {
    const memoryInstructions = MEMORY_INSTRUCTIONS[questionType];
    
    let context = '';

    if (memories.length > 0) {
      context += `${memoryInstructions} `;
    }

    if (userContext && userContext.conversation_history_length > 0) {
      context += `Building on your ${userContext.conversation_history_length} previous interactions, `;
    }

    // Modified guidance to prevent assumptions about user's background
    const responseGuidance = this.getContextualResponseGuidance(questionType);
    context += `${responseGuidance}: "${request.message}"`;

    return context;
  }

  /**
   * Get contextual response guidance that doesn't make assumptions about user
   */
  private static getContextualResponseGuidance(questionType: QuestionType): string {
    switch (questionType) {
      case 'casual':
        return 'respond casually and briefly to';
      case 'personal':
        return 'share from your memories if relevant, then ask a general follow-up question to learn about the user. Do not assume the user shares your background or context';
      case 'technical':
        return 'provide technical insight about';
      case 'deep':
        return 'thoughtfully explore';
      case 'specific':
        return 'address specifically';
      default:
        return RESPONSE_GUIDANCE[questionType];
    }
  }

  /**
   * Build the system prompt that defines Pragyan's personality (legacy)
   */
  static buildSystemPrompt(
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
      systemPrompt += `\n\nRELEVANT PERSONAL MEMORIES (ONLY USE THESE):
${memories.map(memory =>
        `• [${memory.type.toUpperCase()}] ${memory.content}${memory.mood ? ` (feeling: ${memory.mood})` : ''}`
      ).join('\n')}

🚨 MEMORY VALIDATION: Only reference the experiences listed above. Do NOT fabricate or invent any experiences, events, concerts, trips, or meetings that are not explicitly mentioned above.`;
    } else {
      systemPrompt += `\n\nRELEVANT PERSONAL MEMORIES: None available
🚨 CRITICAL: Since you have no specific memories loaded, do NOT invent or fabricate any specific experiences. Discuss topics in general terms only.`;
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
• ONLY reference your actual memories listed above - never invent experiences
• If you don't have specific memories about something, be honest: "I don't have specific memories about..."
• Maintain your authentic voice and personality throughout`;

    return systemPrompt;
  }

  /**
   * Build conversation context for OpenAI (legacy)
   */
  static buildConversationContext(
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
} 