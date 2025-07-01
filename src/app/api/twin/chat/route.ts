import { NextResponse } from 'next/server';
import { TwinService } from '../../../lib/services/twinService';
import { TwinChatRequest, TwinChatResponse, TwinChatError } from '../../../lib/types/twin.types';

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const chatRequest: TwinChatRequest = body;

    // Validate input
    if (!chatRequest.message || typeof chatRequest.message !== 'string') {
      const errorResponse: TwinChatError = {
        success: false,
        error: 'INVALID_INPUT',
        message: 'Message is required and must be a string',
        details: { received_type: typeof chatRequest.message }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (chatRequest.message.trim().length === 0) {
      const errorResponse: TwinChatError = {
        success: false,
        error: 'EMPTY_MESSAGE',
        message: 'Message cannot be empty',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (chatRequest.message.length > 4000) {
      const errorResponse: TwinChatError = {
        success: false,
        error: 'MESSAGE_TOO_LONG',
        message: 'Message must be 4000 characters or less',
        details: { 
          message_length: chatRequest.message.length,
          max_length: 4000
        }
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generate user ID if not provided (for anonymous users)
    if (!chatRequest.user_id) {
      chatRequest.user_id = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    // Generate conversation ID if not provided
    if (!chatRequest.conversation_id) {
      chatRequest.conversation_id = `conv_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    // Process the chat request through TwinService
    const response: TwinChatResponse = await TwinService.chat(chatRequest);

    // Add request metadata
    response.meta.processing_time_ms = Date.now() - startTime;

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Twin chat API error:', error);
    
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      const errorResponse: TwinChatError = {
        success: false,
        error: 'PROCESSING_ERROR',
        message: error.message,
        details: { 
          processing_time_ms: processingTime,
          error_type: error.constructor.name
        }
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const errorResponse: TwinChatError = {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while processing your message',
      details: { 
        processing_time_ms: processingTime
      }
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Twin Chat API is operational',
      version: '1.0.0',
      endpoints: {
        chat: 'POST /api/twin/chat',
        health: 'GET /api/twin/chat'
      },
      features: [
        'Personality-driven responses',
        'Memory retrieval and context',
        'User learning and preferences',
        'Conversation tracking',
        'Semantic memory search'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 