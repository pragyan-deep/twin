import { NextResponse } from 'next/server';
import { MemoryService } from '../../lib/services/memoryService';
import { DatabaseService } from '../../lib/services/databaseService';
import { CreateMemoryRequest, CreateMemoryResponse, Memory } from '../../lib/types/memory.types';

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Check database connection first
    const isDbHealthy = await DatabaseService.healthCheck();
    if (!isDbHealthy) {
      return NextResponse.json(
        MemoryService.createErrorResponse(
          'DATABASE_UNAVAILABLE',
          'Database connection failed. Please check your Supabase configuration.',
          { 
            hint: 'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local',
            timestamp: new Date().toISOString()
          }
        ),
        { status: 503 }
      );
    }

    const body = await request.json();
    const memoryRequest: CreateMemoryRequest = body;

    // Validate input using existing pattern
    const validation = MemoryService.validateCreateRequest(memoryRequest);
    if (!validation.isValid) {
      return NextResponse.json(
        MemoryService.createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid input provided',
          { validation_errors: validation.errors }
        ),
        { status: 400 }
      );
    }

    // Sanitize and normalize input data
    const sanitizedRequest = MemoryService.sanitizeMemoryData(memoryRequest);

    // Generate embedding using existing infrastructure
    let embeddingData;
    try {
      embeddingData = await MemoryService.generateMemoryEmbedding(sanitizedRequest);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return NextResponse.json(
        MemoryService.createErrorResponse(
          'EMBEDDING_FAILED',
          'Failed to generate embedding for memory content',
          { 
            reason: error instanceof Error ? error.message : 'Unknown embedding error',
            retry_recommended: true
          }
        ),
        { status: 502 }
      );
    }

    // Create memory object with embedding
    const memoryWithEmbedding = MemoryService.createMemoryObject(
      sanitizedRequest,
      embeddingData.embedding
    );

    // Generate AI enhancements (placeholder for future features)
    const enhancements = await MemoryService.enhanceMemoryData(sanitizedRequest);

    // Save to database using Supabase
    let savedMemory;
    try {
      savedMemory = await DatabaseService.saveMemory({
        id: memoryWithEmbedding.id,
        content: memoryWithEmbedding.content,
        embedding: embeddingData.embedding,
        type: memoryWithEmbedding.type,
        subject: memoryWithEmbedding.subject,
        user_id: memoryWithEmbedding.user_id,
        tags: memoryWithEmbedding.tags,
        visibility: memoryWithEmbedding.visibility,
        mood: memoryWithEmbedding.mood,
        metadata: memoryWithEmbedding.metadata
      });
    } catch (error) {
      console.error('Database save failed:', error);
      return NextResponse.json(
        MemoryService.createErrorResponse(
          'DATABASE_SAVE_FAILED',
          'Failed to save memory to database',
          { 
            reason: error instanceof Error ? error.message : 'Unknown database error',
            memory_id: memoryWithEmbedding.id,
            timestamp: new Date().toISOString()
          }
        ),
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Build response following existing patterns
    const response: CreateMemoryResponse = {
      success: true,
      data: {
        memory: {
          id: savedMemory.id,
          content: savedMemory.content,
          type: savedMemory.type,
          subject: savedMemory.subject,
          user_id: savedMemory.user_id,
          visibility: savedMemory.visibility,
          mood: savedMemory.mood,
          tags: savedMemory.tags,
          metadata: savedMemory.metadata,
          created_at: savedMemory.created_at,
          updated_at: savedMemory.updated_at
        },
        embedding: {
          dimensions: embeddingData.embedding.length,
          model: embeddingData.model,
          generated_at: new Date().toISOString()
        },
        processing: enhancements,
        usage: embeddingData.usage
      },
      meta: {
        processing_time_ms: processingTime,
        tokens_used: embeddingData.usage.total_tokens
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Memory API error:', error);
    
    // Follow existing error handling pattern
    if (error instanceof Error) {
      return NextResponse.json(
        MemoryService.createErrorResponse(
          'INTERNAL_ERROR',
          error.message,
          { 
            timestamp: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
          }
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(
      MemoryService.createErrorResponse(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while processing your memory',
        { 
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      ),
      { status: 500 }
    );
  }
}

// Rate limiting helper (to be implemented later)
async function checkRateLimit(requestInfo: { ip?: string; userId?: string }): Promise<boolean> {
  // TODO: Implement rate limiting
  // For now, always allow requests
  return true;
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    MemoryService.createErrorResponse(
      'METHOD_NOT_ALLOWED',
      'This endpoint only supports POST requests',
      { 
        supported_methods: ['POST'],
        hint: 'Use POST to create a new memory'
      }
    ),
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    MemoryService.createErrorResponse(
      'METHOD_NOT_ALLOWED',
      'This endpoint only supports POST requests',
      { 
        supported_methods: ['POST'],
        hint: 'Use POST to create a new memory'
      }
    ),
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    MemoryService.createErrorResponse(
      'METHOD_NOT_ALLOWED',
      'This endpoint only supports POST requests',
      { 
        supported_methods: ['POST'],
        hint: 'Use POST to create a new memory'
      }
    ),
    { status: 405 }
  );
} 