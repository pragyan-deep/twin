import { supabase } from '../supabase';
import { supabaseClient } from '../supabase-client';
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '../types/profile.types';
import type { User } from '@supabase/supabase-js';

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      return await this.getProfile(user.id);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      throw new Error('Failed to fetch current user profile');
    }
  }

  /**
   * Create a new profile (usually called automatically via trigger)
   */
  static async createProfile(userId: string, profileData: CreateProfileRequest): Promise<Profile> {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          preferences: profileData.preferences || {},
          settings: profileData.settings || {}
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile> {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Update current user's profile
   */
  static async updateCurrentUserProfile(updates: UpdateProfileRequest): Promise<Profile> {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      return await this.updateProfile(user.id, updates);
    } catch (error) {
      console.error('Error updating current user profile:', error);
      throw new Error('Failed to update current user profile');
    }
  }

  /**
   * Delete user profile
   */
  static async deleteProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferences: Record<string, any>): Promise<Profile> {
    try {
      // Get current profile to merge preferences
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      const updatedPreferences = {
        ...currentProfile.preferences,
        ...preferences
      };

      return await this.updateProfile(userId, { preferences: updatedPreferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(userId: string, settings: Record<string, any>): Promise<Profile> {
    try {
      // Get current profile to merge settings
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      const updatedSettings = {
        ...currentProfile.settings,
        ...settings
      };

      return await this.updateProfile(userId, { settings: updatedSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update user settings');
    }
  }

  /**
   * Upload and update avatar
   */
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabaseClient.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: data.publicUrl });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  /**
   * Search profiles (for admin or public profiles)
   */
  static async searchProfiles(query: string, limit: number = 10): Promise<Profile[]> {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw new Error('Failed to search profiles');
    }
  }

  /**
   * Get profile stats
   */
  static async getProfileStats(userId: string): Promise<{
    memories_count: number;
    profile_created: string;
    last_active: string;
  }> {
    try {
      // Get memories count
      const { count: memoriesCount } = await supabaseClient
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get profile info
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      return {
        memories_count: memoriesCount || 0,
        profile_created: profile.created_at,
        last_active: profile.updated_at
      };
    } catch (error) {
      console.error('Error getting profile stats:', error);
      throw new Error('Failed to get profile statistics');
    }
  }

  /**
   * Validate profile data
   */
  static validateProfileData(data: CreateProfileRequest | UpdateProfileRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate full name
    if (data.full_name !== undefined) {
      if (typeof data.full_name !== 'string') {
        errors.push('Full name must be a string');
      } else if (data.full_name.length > 100) {
        errors.push('Full name must be 100 characters or less');
      }
    }

    // Validate bio
    if (data.bio !== undefined) {
      if (typeof data.bio !== 'string') {
        errors.push('Bio must be a string');
      } else if (data.bio.length > 500) {
        errors.push('Bio must be 500 characters or less');
      }
    }

    // Validate website URL
    if (data.website !== undefined && data.website !== null) {
      try {
        new URL(data.website);
      } catch {
        errors.push('Website must be a valid URL');
      }
    }

    // Validate phone number (basic validation)
    if (data.phone !== undefined && data.phone !== null) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Phone number format is invalid');
      }
    }

    // Validate date of birth
    if (data.date_of_birth !== undefined && data.date_of_birth !== null) {
      const date = new Date(data.date_of_birth);
      if (isNaN(date.getTime())) {
        errors.push('Date of birth must be a valid date');
      } else if (date > new Date()) {
        errors.push('Date of birth cannot be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 