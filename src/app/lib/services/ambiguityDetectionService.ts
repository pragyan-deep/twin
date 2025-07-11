// Ambiguity Detection Service
// Detects when user questions are too generic and need clarification

import { RetrievedMemory } from '../types/twin.types';

export type AmbiguityDetectionResult = {
  isAmbiguous: boolean;
  confidence: number;
  detectionMethod: string;
  clarificationNeeded: boolean;
  reasons: string[];
  suggestedDomains?: string[];
};

export type MemoryCategory = {
  name: string;
  memories: RetrievedMemory[];
  sampleMemory?: RetrievedMemory;
};

export type ClarificationResponse = {
  briefExamples: string[];
  clarificationQuestion: string;
  categories: string[];
};

/**
 * Ambiguity Detection Service
 * Handles detection of generic/ambiguous questions and provides clarification strategies
 */
export class AmbiguityDetectionService {
  
  /**
   * Keywords that indicate overly broad questions
   */
  private static readonly AMBIGUOUS_KEYWORDS = {
    overly_broad: ['like', 'enjoy', 'prefer', 'love', 'hate', 'think', 'feel', 'into'],
    vague_objects: ['things', 'stuff', 'anything', 'something', 'everything'],
    broad_categories: ['what', 'which', 'any', 'all'],
    generic_patterns: [
      /what do you (like|enjoy|prefer|love|hate)/,
      /what are you (into|interested in)/,
      /tell me (what|about) you (like|enjoy)/,
      /what (interests|excites) you/,
      /what do you think about/,
      /what are your (thoughts|opinions)/
    ]
  };

  /**
   * Knowledge domains with their associated keywords
   */
  private static readonly KNOWLEDGE_DOMAINS = {
    music: {
      keywords: ['music', 'song', 'band', 'artist', 'genre', 'album', 'playlist', 'sound', 'track'],
      tags: ['music', 'songs', 'audio']
    },
    technology: {
      keywords: ['technology', 'programming', 'code', 'framework', 'language', 'software', 'development', 'tech', 'coding'],
      tags: ['technology', 'programming', 'code', 'tech', 'development']
    },
    food: {
      keywords: ['food', 'eating', 'cooking', 'restaurant', 'cuisine', 'meal', 'recipe', 'taste'],
      tags: ['food', 'cooking', 'cuisine', 'meal']
    },
    movies: {
      keywords: ['movie', 'film', 'cinema', 'series', 'show', 'tv', 'entertainment', 'actor'],
      tags: ['movies', 'films', 'entertainment', 'tv']
    },
    activities: {
      keywords: ['hobby', 'activity', 'sport', 'exercise', 'game', 'fun', 'leisure', 'pastime'],
      tags: ['hobby', 'activity', 'sport', 'game']
    },
    books: {
      keywords: ['book', 'reading', 'novel', 'author', 'literature', 'story', 'write', 'writing'],
      tags: ['books', 'reading', 'literature', 'writing']
    },
    work: {
      keywords: ['work', 'job', 'career', 'project', 'business', 'professional', 'office'],
      tags: ['work', 'job', 'project', 'career']
    },
    travel: {
      keywords: ['travel', 'trip', 'vacation', 'place', 'country', 'city', 'visit'],
      tags: ['travel', 'trip', 'vacation', 'place']
    }
  };

  /**
   * Main ambiguity detection function using hybrid approach
   */
  static async detectAmbiguity(message: string): Promise<AmbiguityDetectionResult> {
    const reasons: string[] = [];
    let confidence = 0;
    const detectionMethod = 'hybrid';

    // 1. Fast keyword-based detection
    const keywordResult = this.detectKeywordAmbiguity(message);
    
    if (keywordResult.isAmbiguous) {
      reasons.push(...keywordResult.reasons);
      confidence += 0.4;

      // 2. Scope analysis - check if specific domain is mentioned
      const scopeResult = this.detectScopeAmbiguity(message);
      
      if (scopeResult.isAmbiguous) {
        reasons.push(...scopeResult.reasons);
        confidence += 0.3;

        // 3. Question specificity analysis
        const specificityResult = this.analyzeQuestionSpecificity(message);
        
        if (specificityResult.isAmbiguous) {
          reasons.push(...specificityResult.reasons);
          confidence += 0.3;
        }
      }
    }

    const isAmbiguous = confidence >= 0.5;
    const suggestedDomains = isAmbiguous ? this.getSuggestedDomains(message) : undefined;

    return {
      isAmbiguous,
      confidence: Math.min(confidence, 1.0),
      detectionMethod,
      clarificationNeeded: isAmbiguous,
      reasons,
      suggestedDomains
    };
  }

  /**
   * Detect ambiguity based on keyword patterns
   */
  private static detectKeywordAmbiguity(message: string): {
    isAmbiguous: boolean;
    reasons: string[];
  } {
    const lowerMessage = message.toLowerCase();
    const reasons: string[] = [];

    // Check for generic question patterns
    const hasGenericPattern = this.AMBIGUOUS_KEYWORDS.generic_patterns.some(
      pattern => pattern.test(lowerMessage)
    );

    if (hasGenericPattern) {
      reasons.push('generic_question_pattern');
    }

    // Check for vague objects
    const hasVagueObjects = this.AMBIGUOUS_KEYWORDS.vague_objects.some(
      word => lowerMessage.includes(word)
    );

    if (hasVagueObjects) {
      reasons.push('contains_vague_objects');
    }

    return {
      isAmbiguous: hasGenericPattern || hasVagueObjects,
      reasons
    };
  }

  /**
   * Detect ambiguity based on domain scope
   */
  private static detectScopeAmbiguity(message: string): {
    isAmbiguous: boolean;
    reasons: string[];
    mentionedDomains: string[];
  } {
    const lowerMessage = message.toLowerCase();
    const reasons: string[] = [];

    // Find mentioned domains
    const mentionedDomains = Object.keys(this.KNOWLEDGE_DOMAINS).filter(domain => {
      const domainConfig = this.KNOWLEDGE_DOMAINS[domain as keyof typeof this.KNOWLEDGE_DOMAINS];
      return domainConfig.keywords.some(keyword => lowerMessage.includes(keyword));
    });

    if (mentionedDomains.length === 0) {
      reasons.push('no_specific_domain_mentioned');
    } else if (mentionedDomains.length > 2) {
      reasons.push('too_many_domains_mentioned');
    }

    return {
      isAmbiguous: mentionedDomains.length === 0,
      reasons,
      mentionedDomains
    };
  }

  /**
   * Analyze question specificity
   */
  private static analyzeQuestionSpecificity(message: string): {
    isAmbiguous: boolean;
    specificityScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let specificityScore = 0;

    // Short questions are often ambiguous
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount <= 4) {
      reasons.push('very_short_question');
      specificityScore -= 0.4;
    } else if (wordCount <= 6) {
      reasons.push('short_question');
      specificityScore -= 0.2;
    }

    // Check for context clues
    const contextClues = [
      'recently', 'currently', 'for work', 'for fun', 'when coding',
      'in your free time', 'professionally', 'personally', 'these days'
    ];
    
    const hasContextClues = contextClues.some(clue => 
      message.toLowerCase().includes(clue)
    );

    if (hasContextClues) {
      specificityScore += 0.3;
    } else {
      reasons.push('no_context_clues');
    }

    // Check for specific modifiers
    const specificModifiers = [
      'favorite', 'best', 'most', 'least', 'preferred', 'top',
      'specific', 'particular', 'exactly', 'precisely'
    ];

    const hasSpecificModifiers = specificModifiers.some(modifier =>
      message.toLowerCase().includes(modifier)
    );

    if (hasSpecificModifiers) {
      specificityScore += 0.2;
    }

    return {
      isAmbiguous: specificityScore < 0,
      specificityScore,
      reasons
    };
  }

  /**
   * Get suggested domains for clarification
   */
  private static getSuggestedDomains(message: string): string[] {
    // Return most common domains that could be relevant
    return ['music', 'technology', 'activities', 'food', 'movies'];
  }

  /**
   * Generate clarification response for ambiguous questions
   */
  static generateClarificationResponse(
    ambiguityResult: AmbiguityDetectionResult,
    memories: RetrievedMemory[]
  ): ClarificationResponse {
    // Categorize memories by domain
    const categorizedMemories = this.categorizeMemoriesByDomain(memories);
    
    // Sample one memory from each category that has memories
    const availableCategories = Object.keys(categorizedMemories).filter(
      category => categorizedMemories[category].memories.length > 0
    );

    // Generate brief examples from different categories
    const briefExamples = availableCategories.slice(0, 3).map(category => {
      const memory = categorizedMemories[category].sampleMemory;
      return this.generateBriefExample(category, memory);
    }).filter(example => example.length > 0);

    // Generate clarification question
    const clarificationQuestion = this.generateClarificationQuestion(availableCategories);

    return {
      briefExamples,
      clarificationQuestion,
      categories: availableCategories
    };
  }

  /**
   * Categorize memories by domain
   */
  private static categorizeMemoriesByDomain(memories: RetrievedMemory[]): Record<string, MemoryCategory> {
    const categories: Record<string, MemoryCategory> = {};

    // Initialize categories
    Object.keys(this.KNOWLEDGE_DOMAINS).forEach(domain => {
      categories[domain] = {
        name: domain,
        memories: []
      };
    });

    // Categorize memories based on tags and content
    memories.forEach(memory => {
      const lowerContent = memory.content.toLowerCase();
      const memoryTags = memory.tags?.map(tag => tag.toLowerCase()) || [];

      Object.keys(this.KNOWLEDGE_DOMAINS).forEach(domain => {
        const domainConfig = this.KNOWLEDGE_DOMAINS[domain as keyof typeof this.KNOWLEDGE_DOMAINS];
        
        // Check if memory belongs to this domain
        const belongsToDomain = 
          domainConfig.keywords.some(keyword => lowerContent.includes(keyword)) ||
          domainConfig.tags.some(tag => memoryTags.includes(tag));

        if (belongsToDomain) {
          categories[domain].memories.push(memory);
        }
      });
    });

    // Set sample memory for each category (highest relevance score)
    Object.keys(categories).forEach(domain => {
      if (categories[domain].memories.length > 0) {
        categories[domain].sampleMemory = categories[domain].memories
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))[0];
      }
    });

    return categories;
  }

  /**
   * Generate brief example from a memory
   */
  private static generateBriefExample(category: string, memory?: RetrievedMemory): string {
    if (!memory) return '';

    const content = memory.content;
    
    // Extract key information based on category
    switch (category) {
      case 'music':
        return this.extractMusicExample(content);
      case 'technology':
        return this.extractTechExample(content);
      case 'activities':
        return this.extractActivityExample(content);
      default:
        // Generic extraction - first meaningful phrase
        const words = content.split(' ').slice(0, 8).join(' ');
        return words.length > 50 ? words.substring(0, 47) + '...' : words;
    }
  }

  /**
   * Extract music-related example
   */
  private static extractMusicExample(content: string): string {
    const musicKeywords = ['music', 'song', 'band', 'artist', 'album', 'genre'];
    const words = content.split(' ');
    
    // Find music-related phrases
    for (let i = 0; i < words.length; i++) {
      if (musicKeywords.some(keyword => words[i].toLowerCase().includes(keyword))) {
        const phrase = words.slice(Math.max(0, i - 2), i + 4).join(' ');
        return phrase.length > 40 ? phrase.substring(0, 37) + '...' : phrase;
      }
    }
    
    return content.substring(0, 40) + (content.length > 40 ? '...' : '');
  }

  /**
   * Extract technology-related example
   */
  private static extractTechExample(content: string): string {
    const techKeywords = ['programming', 'code', 'framework', 'language', 'development'];
    const words = content.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      if (techKeywords.some(keyword => words[i].toLowerCase().includes(keyword))) {
        const phrase = words.slice(Math.max(0, i - 2), i + 4).join(' ');
        return phrase.length > 40 ? phrase.substring(0, 37) + '...' : phrase;
      }
    }
    
    return content.substring(0, 40) + (content.length > 40 ? '...' : '');
  }

  /**
   * Extract activity-related example
   */
  private static extractActivityExample(content: string): string {
    return content.substring(0, 40) + (content.length > 40 ? '...' : '');
  }

  /**
   * Generate clarification question
   */
  private static generateClarificationQuestion(availableCategories: string[]): string {
    if (availableCategories.length === 0) {
      return "Could you be more specific about what you're interested in?";
    }

    if (availableCategories.length <= 3) {
      const categoryList = availableCategories.join(', ').replace(/,([^,]*)$/, ', or$1');
      return `What context were you thinking about - ${categoryList}?`;
    }

    // More than 3 categories, group them
    const examples = availableCategories.slice(0, 3).join(', ');
    return `What context were you thinking about - ${examples}, or something else?`;
  }

  /**
   * Check if a question needs clarification based on patterns
   */
  static needsClarification(message: string): boolean {
    const commonAmbiguousPatterns = [
      /^what do you like\??$/i,
      /^what are you into\??$/i,
      /^tell me what you like$/i,
      /^what interests you\??$/i,
      /^what do you enjoy\??$/i
    ];

    return commonAmbiguousPatterns.some(pattern => pattern.test(message.trim()));
  }
} 