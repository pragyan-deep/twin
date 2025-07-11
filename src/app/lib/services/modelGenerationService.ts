import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

type ModelProvider = 'gemini' | 'mistral';

interface GenerationResponse {
  response: string;
  tokens_used: number;
}

export class ModelGenerationService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  private static mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || process.env.GOOGLE_API_KEY!, // Fallback to Google API key if Mistral key not set
  });

  /**
   * Generate response using specified model provider
   */
  static async generateWithModel(
    systemPrompt: string,
    context: string,
    userMessage: string,
    config: any,
    provider: ModelProvider = 'mistral'
  ): Promise<GenerationResponse> {
    if (provider === 'mistral') {
      return this.generateWithMistral(systemPrompt, context, userMessage, config);
    } else {
      return this.generateWithGemini(systemPrompt, context, userMessage, config);
    }
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
} 