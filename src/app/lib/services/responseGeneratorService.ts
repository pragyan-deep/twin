import { QuestionType, COMMUNICATION_STYLE, GENERATION_CONFIG } from '../config/twinConfig';
import { ErrorHandlingService, GracefulErrorResponse } from './errorHandlingService';
import { ModelGenerationService } from './modelGenerationService';

type ModelProvider = 'gemini' | 'mistral';

interface GenerationResponse {
  response: string;
  tokens_used: number;
}

export class ResponseGeneratorService {
  /**
   * Generate enhanced twin response with question-type-aware configuration
   */
  static async generateEnhancedTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string,
    questionType: QuestionType,
    provider: ModelProvider = 'mistral'
  ): Promise<GenerationResponse | GracefulErrorResponse> {
    try {
      const generationConfig = this.buildGenerationConfig(questionType);

      console.log(systemPrompt, "systemPrompt")
      console.log(context, "context")
      console.log(userMessage, "userMessage")
      console.log(questionType, "questionType")
      console.log(provider, "provider")
      
      const result = await ModelGenerationService.generateWithModel(
        systemPrompt, 
        context, 
        userMessage, 
        generationConfig, 
        provider
      );

      return result;
    } catch (error) {
      return this.handleGenerationError(error, userMessage, provider);
    }
  }

  /**
   * Build generation configuration based on question type
   */
  private static buildGenerationConfig(questionType: QuestionType) {
    const styleConfig = COMMUNICATION_STYLE.response_length[questionType];
    const temperature = GENERATION_CONFIG.temperatures[questionType];
    
    return {
      temperature,
      topP: 0.95,
      maxTokens: Math.min(styleConfig.max_words * 2, 1000),
      topK: 64
    };
  }

  /**
   * Handle generation errors gracefully
   */
  private static handleGenerationError(
    error: any, 
    userMessage: string, 
    provider: ModelProvider
  ): GenerationResponse | GracefulErrorResponse {
    console.error(`Enhanced ${provider} generation error:`, error);
    
    // Handle API errors gracefully with personality
    if (ErrorHandlingService.shouldHandleGracefully(error)) {
      return ErrorHandlingService.handleGeminiError(error, userMessage);
    }
    
    // For unexpected errors, still throw
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  /**
   * Generate response using Google Gemini with Twin personality (legacy)
   */
  static async generateTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string
  ): Promise<{ response: string; tokens_used: number } | GracefulErrorResponse> {
    try {
      // Get the Gemini model (using Flash for speed and free tier)
      const model = ModelGenerationService.getGeminiModel({
        temperature: 0.8, // Slightly creative but consistent
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 1000,
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
      
      // Handle API errors gracefully with personality
      if (ErrorHandlingService.shouldHandleGracefully(error)) {
        return ErrorHandlingService.handleGeminiError(error, userMessage);
      }
      
      // For unexpected errors, still throw
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 