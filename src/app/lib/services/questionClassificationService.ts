import { QuestionType, CLASSIFICATION_PATTERNS } from '../config/twinConfig';
import { ModelGenerationService } from './modelGenerationService';

export class QuestionClassificationService {
  /**
   * Enhanced question classification with hybrid approach
   */
  static async classifyQuestion(message: string): Promise<QuestionType> {
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
      const classificationPrompt = `Classify this question into one category:
Question: "${message}"

Categories:
- casual: simple greetings, "what's up" type questions
- personal: asking about preferences, interests, personal info
- technical: coding, work, projects, how-to questions
- deep: philosophy, values, beliefs, complex topics
- specific: asking about recent events, specific memories

Answer with just the category name:`;

      const result = await ModelGenerationService.generateContent(classificationPrompt, {
        temperature: 0.1, // Low temperature for consistent classification
        maxOutputTokens: 10,
      }); // Uses Mistral by default

      const classification = result.text?.trim().toLowerCase();

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
} 