import { NextResponse } from 'next/server';
import { createEmbeddings } from '../../lib/embeddings';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 8000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum length is 8000 characters.' },
        { status: 400 }
      );
    }

    // Generate embeddings
    const embeddingResponse = await createEmbeddings(text);
    
    const embeddings = embeddingResponse.data[0].embedding;
    const usage = embeddingResponse.usage;

    return NextResponse.json({
      success: true,
      data: {
        text,
        embeddings,
        model: embeddingResponse.model,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          total_tokens: usage.total_tokens
        },
        dimensions: embeddings.length
      }
    });

  } catch (error) {
    console.error('Embeddings API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 