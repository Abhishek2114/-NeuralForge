# Environment Variables Template

Copy the contents below to a new file named `.env.local` in your project root. Replace the placeholder values with your actual API keys and credentials.

```
# Google Gemini API Key - Replace with your actual API key
GEMINI_API_KEY=your_gemini_api_key

# Auth0 Configuration - Replace with your actual Auth0 credentials
NEXT_PUBLIC_AUTH0_DOMAIN=your_auth0_domain
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
NEXT_PUBLIC_AUTH0_AUDIENCE=your_auth0_audience

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
```

## Security Notes:
1. Make sure `.env.local` is included in your `.gitignore` file to prevent accidental commits
2. Revoke your previous API keys that were exposed in the source code:
   - Google Gemini API Key (previously in app/api/gemini/route.ts)
   - Auth0 credentials (previously in app/providers.tsx)
   - **Supabase anon key** (previously hardcoded in multiple components)
3. Generate new API keys and credentials for all services before deploying
4. Never hardcode API keys or credentials in your source code 