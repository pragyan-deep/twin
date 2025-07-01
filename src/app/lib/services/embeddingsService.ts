import { EmbeddingsRequest, EmbeddingsResponse, EmbeddingsError } from '../types/embeddings.types';

export class EmbeddingsService {
  private static readonly API_ENDPOINT = '/api/embeddings';

  /**
   * Generate embeddings for the given text
   */
  static async generateEmbeddings(text: string): Promise<EmbeddingsResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (text.length > 8000) {
      throw new Error('Text is too long. Maximum length is 8000 characters.');
    }

    try {
      const request: EmbeddingsRequest = { text: text.trim() };

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: EmbeddingsError = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result: EmbeddingsResponse = await response.json();
      return result;

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find the most similar texts from a collection based on embeddings
   */
  static findMostSimilar(
    queryEmbedding: number[],
    textCollection: Array<{ text: string; embedding: number[] }>,
    topK: number = 5
  ): Array<{ text: string; similarity: number }> {
    const similarities = textCollection.map(item => ({
      text: item.text,
      similarity: this.calculateCosineSimilarity(queryEmbedding, item.embedding)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
} 