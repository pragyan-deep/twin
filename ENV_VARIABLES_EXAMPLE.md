# Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Google Gemini API Key (free - 15K embedding requests/day + 1.5K chat requests/day)
GOOGLE_API_KEY=your_google_api_key_here

# Mistral API Key (optional - for using Mistral models instead of Gemini)
# MISTRAL_API_KEY=your_mistral_api_key_here

# OpenAI API Key (no longer needed - fully replaced by Gemini)
# OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
# Get these from your Supabase project settings: https://supabase.com/dashboard/project/[your-project-id]/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Setup Instructions:

1. **Get Google Gemini API Key:**
   - Go to https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the API key

   **Or Get Mistral API Key (optional):**
   - Go to https://console.mistral.ai/api-keys/
   - Create a new API key
   - Copy the API key

2. **Get Supabase Credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project or create a new one
   - Go to Settings > API
   - Copy the Project URL and anon/public key

3. **Configure Environment:**
   - Create `.env.local` in your project root
   - Add the variables above with your actual values
   - The Supabase URL should look like: `https://xxxxxxxxxxxxx.supabase.co`
   - The anon key is safe to use in frontend code (it's public)

4. **Run Migrations:**
   ```bash
   supabase db push
   ```

5. **Start Development:**
   ```bash
   npm run dev
   ```

## Notes:
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- The anon key has Row Level Security (RLS) restrictions built-in
- Service role key is only needed for admin operations (optional for MVP)
- **Google Gemini provides:**
  - **15,000 FREE embedding requests per day** (text-embedding-004)
  - **1,500 FREE chat requests per day** (gemini-1.5-flash)
- **Mistral AI provides:**
  - Alternative to Gemini with competitive pricing
  - Models: mistral-small-latest, mistral-large-latest, etc.
- Embeddings now use 768 dimensions (down from 1536) for better performance
- **Completely free AI twin** - no OpenAI costs! 