import { supabaseClient } from './supabase-client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  // Sign up new user
  static async signUp({ email, password, full_name }: SignUpData) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name || email.split('@')[0],
          },
        },
      });

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  // Sign in existing user
  static async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) {
        throw error;
      }
      return user;
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) {
        throw error;
      }
      return session;
    } catch (error: any) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  // Update password
  static async updatePassword(password: string) {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }

  // Subscribe to auth changes
  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      callback(session);
    });
  }
} 