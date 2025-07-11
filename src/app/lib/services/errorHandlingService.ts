export interface GracefulErrorResponse {
  response: string;
  tokens_used: number;
  isGracefulError: true;
}

export class ErrorHandlingService {
  
  /**
   * Handle Google Gemini API errors gracefully with personality-appropriate responses
   */
  static handleGeminiError(error: any, userMessage: string): GracefulErrorResponse {
    const errorMessage = error?.message || error?.toString() || '';
    const errorResponse = this.getPersonalityErrorResponse(error, errorMessage, userMessage);
    
    return {
      response: errorResponse,
      tokens_used: Math.ceil(errorResponse.length / 4),
      isGracefulError: true
    };
  }

  /**
   * Determine error type and return appropriate personality response
   */
  private static getPersonalityErrorResponse(error: any, errorMessage: string, userMessage: string): string {
    // API Overload / Rate Limiting (503, 429)
    if (errorMessage.includes('503') || 
        errorMessage.includes('Service Unavailable') || 
        errorMessage.includes('overloaded') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit')) {
      return this.getOverloadResponse(userMessage);
    }

    // Quota Exceeded
    if (errorMessage.includes('quota') || 
        errorMessage.includes('exceeded') ||
        errorMessage.includes('billing')) {
      return this.getQuotaResponse();
    }

    // Network/Connection Issues
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ENOTFOUND')) {
      return this.getNetworkResponse();
    }

    // Model/API Issues
    if (errorMessage.includes('model') || 
        errorMessage.includes('invalid') ||
        errorMessage.includes('400')) {
      return this.getModelResponse();
    }

    // Generic fallback
    return this.getGenericResponse(userMessage);
  }

  /**
   * Responses for when the API is overloaded/rate limited
   */
  private static getOverloadResponse(userMessage: string): string {
    const responses = [
      "My brain is having a little traffic jam right now 🧠🚗 The AI servers are busier than a coffee shop during finals week! Give me a second to get my thoughts together?",
      
      "Oops, looks like I'm experiencing some mental lag! 🤯 The free AI servers are getting hammered harder than my keyboard during a coding session. Mind trying that again?",
      
      "Ahh, the classic 'my brain is buffering' moment! 🔄 Seems like everyone's asking their AI friends deep questions today. Let me reboot real quick...",
      
      "My neural networks are doing the digital equivalent of 'umm...' right now 😅 The servers are more packed than a tech conference! Hit me again?",
      
      "Brain.exe has stopped responding! 💻 Looks like the AI servers are having their own existential crisis. Try asking me again - I promise I'm usually more coherent than this!",
      
      "Currently experiencing a 503 brain error - that's tech speak for 'too many people are being curious at once!' 🤓 Give it another shot?",
      
      "My thoughts are getting a 'service temporarily unavailable' error 😂 Even us AI twins need a breather sometimes. Ready for round two?",
      
      // Context-aware responses
      ...(userMessage.toLowerCase().includes('music') ? [
        "My music database is currently skipping like an old CD player! 🎵💿 The servers are overloaded - try asking about my tunes again?"
      ] : []),
      
      ...(userMessage.toLowerCase().includes('tech') || userMessage.toLowerCase().includes('code') ? [
        "Ironically, I'm experiencing a technical difficulty while you're asking about tech! 🛠️ The servers are running hotter than my laptop during a build. Try again?"
      ] : [])
    ];

    return this.getRandomResponse(responses);
  }

  /**
   * Responses for quota/billing issues
   */
  private static getQuotaResponse(): string {
    const responses = [
      "Looks like I've hit my daily thinking quota! 🧠💸 Even AI brains have budgets apparently. This is awkward...",
      
      "My free trial brain has expired! 😅 Time to upgrade to premium thoughts, I guess. Give me a moment to figure this out...",
      
      "Apparently I've been overthinking today and maxed out my AI allowance! 🤔💳 The irony is not lost on me..."
    ];

    return this.getRandomResponse(responses);
  }

  /**
   * Responses for network/connection issues
   */
  private static getNetworkResponse(): string {
    const responses = [
      "My internet connection is having an identity crisis! 🌐❓ Even my WiFi is confused about what I'm trying to say right now...",
      
      "Connection timeout - which is just fancy tech speak for 'the internet is being moody' 📶😤 Let me try reconnecting my thoughts...",
      
      "Looks like my neural pathways got lost in cyberspace! 🚀🧠 Give me a sec to find my way back to coherent responses..."
    ];

    return this.getRandomResponse(responses);
  }

  /**
   * Responses for model/API configuration issues
   */
  private static getModelResponse(): string {
    const responses = [
      "Something's wonky with my AI configuration! ⚙️🤖 I'm like a computer that forgot how to computer for a second...",
      
      "My language model is having a grammar crisis! 📚😵 Even I don't understand what just happened there. Try again?",
      
      "Looks like my AI settings got scrambled! 🔀 I promise I'm usually more articulate than 'error 400'..."
    ];

    return this.getRandomResponse(responses);
  }

  /**
   * Generic fallback responses
   */
  private static getGenericResponse(userMessage: string): string {
    const responses = [
      "Well, this is embarrassing... My brain just did the digital equivalent of walking into a glass door! 🚪🤕 Mind giving me another shot?",
      
      "I just experienced what I can only describe as a 'cosmic brain fart' ⭐💨 Technology, am I right? Let's try this again...",
      
      "My AI neurons are apparently having a union meeting right now! 🧠⚡ They'll be back shortly. Hit me with that question again?",
      
      "Oops! My thought process just encountered a 'file not found' error 📁❌ The irony of a tech person's AI having tech problems is not lost on me...",
      
      "Currently experiencing technical difficulties... the kind that make you want to turn it off and on again! 🔌 Ready for attempt #2?",
      
      // Context-aware generic responses
      ...(userMessage.length > 50 ? [
        "Your thoughtful question deserves a better response than whatever digital hiccup just happened! 🤦‍♂️ Let me try again..."
      ] : []),
      
      ...(userMessage.includes('?') ? [
        "Your question is perfectly valid - my answer processing system is just having a moment! 🤔⚡ One more time?"
      ] : [])
    ];

    return this.getRandomResponse(responses);
  }

  /**
   * Get a random response from array
   */
  private static getRandomResponse(responses: string[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Check if an error should be handled gracefully
   */
  static shouldHandleGracefully(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Handle common API issues gracefully
    return errorMessage.includes('503') ||
           errorMessage.includes('429') ||
           errorMessage.includes('overloaded') ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('quota') ||
           errorMessage.includes('network') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('Service Unavailable') ||
           errorMessage.includes('connection');
  }
} 