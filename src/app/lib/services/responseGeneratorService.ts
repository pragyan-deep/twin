import { QuestionType, COMMUNICATION_STYLE, GENERATION_CONFIG } from '../config/twinConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";
import { ErrorHandlingService, GracefulErrorResponse } from './errorHandlingService';

type ModelProvider = 'gemini' | 'mistral';

interface GenerationResponse {
  response: string;
  tokens_used: number;
}

export class ResponseGeneratorService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  private static mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || process.env.GOOGLE_API_KEY!, // Fallback to Google API key if Mistral key not set
  });

  /**
   * Generate enhanced twin response with question-type-aware configuration
   */
  static async generateEnhancedTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string,
    questionType: QuestionType,
    provider: ModelProvider = 'gemini'
  ): Promise<GenerationResponse | GracefulErrorResponse> {
    try {
      const generationConfig = this.buildGenerationConfig(questionType);
      
      const result = provider === 'mistral' 
        ? await this.generateWithMistral(systemPrompt, context, userMessage, generationConfig)
        : await this.generateWithGemini(systemPrompt, context, userMessage, generationConfig);

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
   * Generate response using Mistral AI
   */
  private static async generateWithMistral(
    systemPrompt: string,
    context: string,
    userMessage: string,
    config: any
  ): Promise<GenerationResponse> {
    const messages = [
      {
        role: 'system' as const,
        content: `${systemPrompt}\n\n${context}`
      },
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    const result = await this.mistralClient.chat.complete({
      model: 'mistral-small-latest',
      messages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
    });

    const response = this.extractMistralResponse(result);
    const tokens_used = result.usage?.totalTokens || 
      this.calculateTokens(systemPrompt, userMessage, response);

    return { response, tokens_used };
  }

  /**
   * Generate response using Google Gemini
   */
  private static async generateWithGemini(
    systemPrompt: string,
    context: string,
    userMessage: string,
    config: any
  ): Promise<GenerationResponse> {
    const generationConfig = {
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxOutputTokens: config.maxTokens,
    };

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig
    });

    const fullPrompt = `${systemPrompt}\n\n${context}\n\nUser: ${userMessage}\n\nPragyan:`;
    const result = await model.generateContent(fullPrompt);
    
    const response = result.response.text() || '';
    const tokens_used = this.calculateTokens(systemPrompt, userMessage, response);

    return { response, tokens_used };
  }

  /**
   * Extract response text from Mistral result
   */
  private static extractMistralResponse(result: any): string {
    const messageContent = result.choices?.[0]?.message?.content || '';
    
    if (typeof messageContent === 'string') {
      return messageContent;
    }
    
    if (Array.isArray(messageContent)) {
      return messageContent.map(chunk => 
        'text' in chunk ? chunk.text : (chunk as any).content || ''
      ).join('');
    }
    
    return '';
  }

  /**
   * Calculate approximate token count
   */
  private static calculateTokens(systemPrompt: string, userMessage: string, response: string): number {
    return Math.ceil((systemPrompt.length + userMessage.length + response.length) / 4);
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
      
      // Handle API errors gracefully with personality
      if (ErrorHandlingService.shouldHandleGracefully(error)) {
        return ErrorHandlingService.handleGeminiError(error, userMessage);
      }
      
      // For unexpected errors, still throw
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 