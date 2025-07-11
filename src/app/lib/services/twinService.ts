import { TwinChatRequest, TwinChatResponse, RetrievedMemory, UserMemoryContext } from '../types/twin.types';
import { QuestionType } from '../config/twinConfig';
import { AmbiguityDetectionService, AmbiguityDetectionResult } from './ambiguityDetectionService';
import { QuestionClassificationService } from './questionClassificationService';
import { MemoryRetrievalService } from './memoryRetrievalService';
import { PromptBuilderService } from './promptBuilderService';
import { ResponseGeneratorService } from './responseGeneratorService';
import { LearningService } from './learningService';
import { TwinUtilsService } from './twinUtilsService';
import { GracefulErrorResponse } from './errorHandlingService';

export class TwinService {
  /**
   * Enhanced chat method with question-type-aware architecture and ambiguity detection
   */
  static async chat(request: TwinChatRequest): Promise<TwinChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Classify the question type
      const questionType = await QuestionClassificationService.classifyQuestion(request.message);

      // 2. Check for ambiguity if it's a personal question
      let ambiguityResult: AmbiguityDetectionResult | null = null;
      if (questionType === 'personal') {
        ambiguityResult = await AmbiguityDetectionService.detectAmbiguity(request.message);
      }



      // 3. Retrieve relevant memories based on question type
      const memorySearchStart = Date.now();
      const relevantMemories = await MemoryRetrievalService.retrieveRelevantMemoriesEnhanced(
        request.message,
        questionType
      );
      const memorySearchTime = Date.now() - memorySearchStart;

      // 4. Get user context
      const userContext = request.user_id
        ? await MemoryRetrievalService.getUserContext(request.user_id)
        : null;

      // 5. Handle ambiguous questions with clarification
      if (ambiguityResult?.isAmbiguous && ambiguityResult.clarificationNeeded) {
        const clarificationResponse = await this.handleAmbiguousQuestion(
          ambiguityResult,
          relevantMemories,
          request,
          userContext
        );

        const processingTime = Date.now() - startTime;

        return {
          success: true,
          data: {
            response: clarificationResponse.response,
            conversation_id: request.conversation_id || 'default',
            memories_used: {
              count: relevantMemories.length,
              types: [...new Set(relevantMemories.map(m => m.type))],
              relevance_scores: relevantMemories.map(m => m.relevance_score)
            },
            personality: {
              tone: 'clarifying',
              context_applied: clarificationResponse.categories
            },
            learning: {
              new_memories_created: 0,
              user_insights_gained: ['ambiguous_question_pattern']
            }
          },
          meta: {
            processing_time_ms: processingTime,
            tokens_used: Math.ceil(clarificationResponse.response.length / 4),
            memory_search_time_ms: memorySearchTime
          }
        };
      }

      // 6. Build question-type-aware system prompt (normal flow)
      const systemPrompt = PromptBuilderService.buildEnhancedSystemPrompt(
        questionType,
        relevantMemories,
        userContext
      );

      // 7. Build question-type-aware conversation context
      const conversationContext = PromptBuilderService.buildEnhancedConversationContext(
        questionType,
        relevantMemories,
        userContext,
        request
      );

      // 8. Generate response with appropriate configuration
      const geminiResponse = await ResponseGeneratorService.generateEnhancedTwinResponse(
        systemPrompt,
        conversationContext,
        request.message,
        questionType,
        'mistral'
      );

      // 8.1. Handle graceful errors
      if ('isGracefulError' in geminiResponse) {
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
              tone: 'error_handling',
              context_applied: ['graceful_error_response']
            },
            learning: {
              new_memories_created: 0,
              user_insights_gained: ['api_error_encountered']
            }
          },
          meta: {
            processing_time_ms: processingTime,
            tokens_used: geminiResponse.tokens_used,
            memory_search_time_ms: memorySearchTime
          }
        };
      }

      // 9. Enhanced learning from interaction
      const learningResults = await LearningService.enhancedLearnFromInteraction(
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
            tone: TwinUtilsService.detectResponseTone(geminiResponse.response),
            context_applied: TwinUtilsService.getAppliedContext(relevantMemories)
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
   * Handle ambiguous questions by generating clarification responses
   */
  private static async handleAmbiguousQuestion(
    ambiguityResult: AmbiguityDetectionResult,
    memories: RetrievedMemory[],
    request: TwinChatRequest,
    userContext: UserMemoryContext | null
  ): Promise<{ response: string; categories: string[] }> {
    // Generate clarification response using the ambiguity service
    const clarification = AmbiguityDetectionService.generateClarificationResponse(
      ambiguityResult,
      memories
    );

    // Build a natural response that includes examples and asks for clarification
    let response = "I like quite a few things! ";

    // Add brief examples if available
    if (clarification.briefExamples.length > 0) {
      const examples = clarification.briefExamples.slice(0, 3);
      if (examples.length === 1) {
        response += `I'm into ${examples[0]}. `;
      } else if (examples.length === 2) {
        response += `I'm into ${examples[0]} and ${examples[1]}. `;
      } else {
        response += `I'm into ${examples[0]}, ${examples[1]}, and ${examples[2]}. `;
      }
    }

    // Add clarification question
    response += clarification.clarificationQuestion;

    return {
      response,
      categories: clarification.categories
    };
  }

  /**
   * @deprecated Use the new chat() method instead. This method will be removed in a future version.
   */
  static async chatDeprecated(request: TwinChatRequest): Promise<TwinChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Retrieve relevant memories using vector search
      const memorySearchStart = Date.now();
      const relevantMemories = await MemoryRetrievalService.retrieveRelevantMemories(request.message);
      const memorySearchTime = Date.now() - memorySearchStart;

      // 2. Get user context if available
      const userContext = request.user_id
        ? await MemoryRetrievalService.getUserContext(request.user_id)
        : null;

      // 3. Build the system prompt with personality and context
      const systemPrompt = PromptBuilderService.buildSystemPrompt(relevantMemories, userContext);

      // 4. Build the conversation context
      const conversationContext = PromptBuilderService.buildConversationContext(
        relevantMemories,
        userContext,
        request
      );

      // 5. Generate response using Google Gemini
      const geminiResponse = await ResponseGeneratorService.generateTwinResponse(
        systemPrompt,
        conversationContext,
        request.message
      );

      // 5.1. Handle graceful errors
      if ('isGracefulError' in geminiResponse) {
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
              tone: 'error_handling',
              context_applied: ['graceful_error_response']
            },
            learning: {
              new_memories_created: 0,
              user_insights_gained: ['api_error_encountered']
            }
          },
          meta: {
            processing_time_ms: processingTime,
            tokens_used: geminiResponse.tokens_used,
            memory_search_time_ms: memorySearchTime
          }
        };
      }

      // 6. Learn from the interaction (store user insights)
      const learningResults = await LearningService.learnFromInteraction(
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
            tone: TwinUtilsService.detectResponseTone(geminiResponse.response),
            context_applied: TwinUtilsService.getAppliedContext(relevantMemories)
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
} 