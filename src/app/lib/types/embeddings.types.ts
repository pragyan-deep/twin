export interface EmbeddingsRequest {
  text: string;
}

export interface EmbeddingsResponse {
  success: boolean;
  data: {
    text: string;
    embeddings: number[];
    model: string;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
    dimensions: number;
  };
}

export interface EmbeddingsError {
  error: string;
} 