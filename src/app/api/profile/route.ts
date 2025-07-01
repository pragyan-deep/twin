import { NextResponse } from 'next/server';
import { ProfileService } from '../../lib/services/profileService';
import { supabaseClient } from '../../lib/supabase-client';
import { UpdateProfileRequest } from '../../lib/types/profile.types';

// GET /api/profile - Get current user's profile
export async function GET(request: Request) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await ProfileService.getProfile(user.id);
    
    if (!profile) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'PROFILE_NOT_FOUND', 
            message: 'User profile not found' 
          } 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { profile }
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to fetch profile' 
        } 
      },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: Request) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updateData: UpdateProfileRequest = body;

    // Validate input data
    const validation = ProfileService.validateProfileData(updateData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid profile data', 
            details: { validation_errors: validation.errors } 
          } 
        },
        { status: 400 }
      );
    }

    // Update profile
    const updatedProfile = await ProfileService.updateProfile(user.id, updateData);

    return NextResponse.json({
      success: true,
      data: { profile: updatedProfile }
    });

  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to update profile' 
        } 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/profile - Delete current user's profile
export async function DELETE(request: Request) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      );
    }

    // Delete profile
    await ProfileService.deleteProfile(user.id);

    return NextResponse.json({
      success: true,
      data: { message: 'Profile deleted successfully' }
    });

  } catch (error) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to delete profile' 
        } 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'METHOD_NOT_ALLOWED', 
        message: 'POST method not supported on this endpoint',
        details: { supported_methods: ['GET', 'PUT', 'DELETE'] }
      } 
    },
    { status: 405 }
  );
} 