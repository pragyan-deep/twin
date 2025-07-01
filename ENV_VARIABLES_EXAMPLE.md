# Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# OpenAI API Key (existing)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
# Get these from your Supabase project settings: https://supabase.com/dashboard/project/[your-project-id]/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Setup Instructions:

1. **Get Supabase Credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project or create a new one
   - Go to Settings > API
   - Copy the Project URL and anon/public key

2. **Configure Environment:**
   - Create `.env.local` in your project root
   - Add the variables above with your actual values
   - The Supabase URL should look like: `https://xxxxxxxxxxxxx.supabase.co`
   - The anon key is safe to use in frontend code (it's public)

3. **Run Migrations:**
   ```bash
   supabase db push
   ```

4. **Start Development:**
   ```bash
   npm run dev
   ```

## Notes:
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- The anon key has Row Level Security (RLS) restrictions built-in
- Service role key is only needed for admin operations (optional for MVP) 