import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

type ModelProvider = 'gemini' | 'mistral';

interface GenerationResponse {
  response: string;
  tokens_used: number;
}

interface ContentGenerationResponse {
  text: string;
  tokens_used?: number;
}

export class ModelGenerationService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  private static mistralClient = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || process.env.GOOGLE_API_KEY!, // Fallback to Google API key if Mistral key not set
  });

  /**
   * Unified content generation wrapper - abstracts away provider differences
   */
  static async generateContent(
    prompt: string,
    config: any,
    provider: ModelProvider = 'mistral'
  ): Promise<ContentGenerationResponse> {
    
    if (provider === 'mistral') {
      // Use Mistral API
      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const result = await this.mistralClient.chat.complete({
        model: 'mistral-small-latest',
        messages,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxOutputTokens || config.maxTokens || 1000,
        topP: config.topP || 0.95,
      });

      const response = this.extractMistralResponse(result);
      return {
        text: response,
        tokens_used: result.usage?.totalTokens
      };
    } else {
      // Use Gemini API
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: config
      });

      const result = await model.generateContent(prompt);
      return {
        text: result.response.text() || '',
        tokens_used: Math.ceil(prompt.length / 4) // Approximate
      };
    }
  }

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
   * Get Gemini model instance with configuration
   */
  static getGeminiModel(config: any) {
    return this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: config
    });
  }

  /**
   * Get Gemini embedding model instance
   */
  static getGeminiEmbeddingModel() {
    return this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  /**
   * Get Mistral client instance
   */
  static getMistralClient() {
    return this.mistralClient;
  }

  /**
   * Get model instance based on provider and configuration
   */
  static getModel(provider: ModelProvider, config: any) {
    if (provider === 'mistral') {
      // For Mistral, we return the client directly since it uses a different API pattern
      return this.mistralClient;
    } else {
      // For Gemini, return the configured model
      return this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: config
      });
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