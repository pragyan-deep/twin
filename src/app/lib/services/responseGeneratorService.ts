import { QuestionType, COMMUNICATION_STYLE, GENERATION_CONFIG } from '../config/twinConfig';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ErrorHandlingService, GracefulErrorResponse } from './errorHandlingService';

export class ResponseGeneratorService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

  /**
   * Generate enhanced twin response with question-type-aware configuration
   */
  static async generateEnhancedTwinResponse(
    systemPrompt: string,
    context: string,
    userMessage: string,
    questionType: QuestionType
  ): Promise<{ response: string; tokens_used: number } | GracefulErrorResponse> {
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
      
      // Handle API errors gracefully with personality
      if (ErrorHandlingService.shouldHandleGracefully(error)) {
        return ErrorHandlingService.handleGeminiError(error, userMessage);
      }
      
      // For unexpected errors, still throw
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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