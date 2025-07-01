# User Profiles Setup Guide

This guide explains how to set up the user profiles feature in your Twin application.

## 📋 Overview

The user profiles system adds:
- **User profile table** with foreign key to `auth.users`
- **Automatic profile creation** when users sign up
- **Profile management API** endpoints
- **Avatar upload** with Supabase Storage
- **Extended user context** with profile data

## 🚀 Running the Migrations

### 1. Run the Profile Migration

```bash
# Navigate to your Supabase project
cd supabase

# Run the migration to create profiles table
supabase db push

# Or run specific migration files
supabase migration up 001_create_user_profiles.sql
supabase migration up 002_create_storage_buckets.sql
```

### 2. Verify the Migration

Check that the following were created:

#### Tables:
- `public.profiles` - User profile data
  - `id` (UUID, PK, FK to auth.users.id)
  - `full_name`, `avatar_url`, `bio`, `website`, `location`, `phone`
  - `date_of_birth`, `preferences`, `settings`
  - `created_at`, `updated_at`

#### Functions:
- `handle_new_user()` - Auto-creates profile on user signup
- `handle_updated_at()` - Updates timestamp on profile changes

#### Triggers:
- `on_auth_user_created` - Triggers profile creation
- `profiles_updated_at` - Updates timestamp

#### Storage:
- `avatars` bucket for profile images (5MB limit)

#### RLS Policies:
- Users can view/update their own profiles
- Public read access to avatar images

## 🔧 Environment Variables

Make sure you have these environment variables set:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## 🎯 How It Works

### 1. Automatic Profile Creation
When a user signs up, a profile is automatically created:

```sql
-- Trigger function automatically creates profile
INSERT INTO public.profiles (id, full_name, avatar_url)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
);
```

### 2. Profile Data Structure
```typescript
interface Profile {
  id: string;              // Same as auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### 3. API Endpoints

#### Get Current User Profile
```bash
GET /api/profile
Authorization: Bearer <user_token>
```

#### Update Profile
```bash
PUT /api/profile
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "full_name": "John Doe",
  "bio": "AI enthusiast",
  "website": "https://johndoe.com"
}
```

#### Delete Profile
```bash
DELETE /api/profile
Authorization: Bearer <user_token>
```

## 💻 Using in Your Code

### 1. Access Profile in Components
```typescript
import { useAuth } from './lib/contexts/AuthContext';

function MyComponent() {
  const { user, profile, refreshProfile } = useAuth();
  
  if (profile) {
    return <div>Hello, {profile.full_name}!</div>;
  }
  
  return <div>Loading profile...</div>;
}
```

### 2. Update Profile
```typescript
import { ProfileService } from './lib/services/profileService';

// Update current user's profile
const updatedProfile = await ProfileService.updateCurrentUserProfile({
  full_name: 'New Name',
  bio: 'Updated bio'
});

// Refresh profile in context
await refreshProfile();
```

### 3. Upload Avatar
```typescript
import { ProfileService } from './lib/services/profileService';

const handleAvatarUpload = async (file: File) => {
  const avatarUrl = await ProfileService.uploadAvatar(user.id, file);
  await refreshProfile(); // Refresh to show new avatar
};
```

## 🔒 Security

### Row Level Security (RLS)
- Users can only access their own profile data
- Avatar uploads are restricted to the user's own folder
- Public read access for avatar images

### Data Validation
- Server-side validation for all profile fields
- File type and size restrictions for avatars
- URL validation for website field

## 🧪 Testing

### 1. Test Profile Creation
1. Sign up a new user
2. Check that profile is automatically created
3. Verify profile data matches signup info

### 2. Test Profile Updates
1. Update profile via API
2. Verify changes are saved
3. Check `updated_at` timestamp

### 3. Test Avatar Upload
1. Upload an image file
2. Verify file is stored in Supabase Storage
3. Check profile `avatar_url` is updated

## 📊 Database Relationships

```
auth.users (Supabase Auth)
    ↓ (1:1)
public.profiles
    ↑ (1:many)
public.memories
```

- Each `auth.users` has exactly one `profiles` record
- Each `profiles` can have many `memories`
- Foreign key constraints ensure data integrity
- Cascade deletes maintain consistency

## 🛠️ Troubleshooting

### Profile Not Created on Signup
- Check if the trigger `on_auth_user_created` exists
- Verify the `handle_new_user()` function is working
- Check Supabase logs for errors

### RLS Policy Issues
- Ensure user is authenticated
- Check if policies are enabled on `profiles` table
- Verify user ID matches in policies

### Avatar Upload Fails
- Check if `avatars` bucket exists
- Verify storage policies are correct
- Ensure file size is under 5MB
- Check file type is allowed

## 🎉 You're Ready!

Your user profiles system is now set up and ready to use! Users will automatically get profiles when they sign up, and you can extend the system with additional features as needed. 