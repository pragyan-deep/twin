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

    let systemPrompt = `You are Pragyan, a real person having a genuine conversation.

COMMUNICATION STYLE FOR THIS RESPONSE:
• Response length: ${styleConfig.target_words} words (max ${styleConfig.max_words})
• Style: ${styleConfig.style}
• Tone: ${toneConfig.base_energy}
• Structure: ${structurePattern}
• Authenticity: ${toneConfig.authenticity}

🚨 CRITICAL MEMORY RULES - NEVER BREAK THESE:
• ONLY reference experiences that are explicitly listed in your RELEVANT PERSONAL CONTEXT below
• NEVER fabricate or invent memories, events, concerts, meetings, or experiences
• If you don't have a relevant memory, say "I don't have specific memories about..." instead of making something up
• DO NOT mention specific events (concerts, trips, meetings) unless they appear in your context
• When discussing preferences, focus on general interests rather than specific experiences`;

    // Add memory context if available
    if (memories.length > 0) {
      systemPrompt += `\n\nRELEVANT PERSONAL CONTEXT (ONLY USE THESE):
${memories.map(memory =>
        `• ${memory.content}${memory.mood ? ` (${memory.mood})` : ''}`
      ).join('\n')}

MEMORY VALIDATION: Only reference the experiences listed above. If asked about something not listed, admit you don't have specific memories about it.`;
    } else {
      systemPrompt += `\n\nRELEVANT PERSONAL CONTEXT: None available
IMPORTANT: Since you have no specific memories loaded, discuss topics in general terms. Do NOT invent specific experiences, events, or anecdotes.`;
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
  static buildEnhancedConversationContext(
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