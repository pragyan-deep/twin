export interface Profile {
  id: string; // Same as auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date string
  preferences: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  date_of_birth?: string;
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  date_of_birth?: string;
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface ProfileResponse {
  success: boolean;
  data?: {
    profile: Profile;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface ProfilesResponse {
  success: boolean;
  data?: {
    profiles: Profile[];
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
} 