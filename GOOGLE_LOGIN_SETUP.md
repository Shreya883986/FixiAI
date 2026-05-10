# Google OAuth Setup Guide for Snapcut AI

Your application is already configured with Google OAuth integration. Follow these steps to complete the setup.

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit [Google Cloud Console](https://console.cloud.google.com/)

### 1.2 Create a New Project
- Click the project dropdown at the top
- Click **NEW PROJECT**
- Enter project name: `snapcut-ai` (or similar)
- Click **CREATE**

### 1.3 Enable Google+ API
- In the left sidebar, click **APIs & Services** → **Library**
- Search for `Google+ API`
- Click on it and then click **ENABLE**

### 1.4 Create OAuth 2.0 Credentials
- Go to **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
- If prompted, configure the OAuth consent screen:
  - User Type: **External**
  - Click **CREATE**
  - App name: `Snapcut AI`
  - User support email: (your email)
  - Developer contact: (your email)
  - Click **SAVE AND CONTINUE** through all screens

### 1.5 Configure OAuth Client
- Application type: **Web application**
- Name: `Snapcut AI Web Client`
- **Authorized JavaScript origins** (Add):
  - `http://localhost:5173` (local development)
  - `https://snapcut-ai.vercel.app` (your production domain)

- **Authorized redirect URIs** (Add):
  ```
  https://txpsghsmfwejlttikigv.supabase.co/auth/v1/callback
  http://localhost:5173/auth/v1/callback
  https://snapcut-ai.vercel.app/auth/v1/callback
  ```

- Click **CREATE**
- Copy your **Client ID** and **Client Secret** (you'll need these next)

## Step 2: Enable Google Provider in Supabase

### 2.1 Access Supabase Dashboard
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your **snapcut-ai** project

### 2.2 Configure Google Provider
1. Go to **Authentication** → **Providers**
2. Look for **Google** in the provider list
3. Toggle **Google** to **ENABLED**
4. Paste your credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click **SAVE**

## Step 3: Test Google Login

### 3.1 Local Testing
1. Start your development server:
   ```bash
   cd snapcut-ai
   bun run dev
   ```

2. Navigate to `http://localhost:5173/login` or `/register`
3. Click the **"Continue with Google"** button
4. You should be redirected to Google's login page
5. After authentication, you'll be redirected back to your app

### 3.2 Production Testing
Once deployed, repeat the same steps on your production URL.

## Current Implementation Details

### Login Page (`src/routes/login.tsx`)
- Google sign-in button is already implemented
- Uses `supabase.auth.signInWithOAuth()` with provider `"google"`
- Redirects to `/app` after successful authentication

### Register Page (`src/routes/register.tsx`)
- Google sign-in button is already implemented
- Same OAuth flow as login page
- Allows users to create accounts or sign in with Google

### Auth Provider (`src/components/auth-provider.tsx`)
- Manages authentication state
- Automatically syncs with Supabase
- `useAuth()` hook available for checking logged-in status

## Environment Variables (Optional)

These are not required but can be useful:
```env
VITE_SUPABASE_URL=https://txpsghsmfwejlttikigv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Already configured in `src/integrations/supabase/client.ts` ✓

## Troubleshooting

### "Redirect URI mismatch"
- Ensure all callback URLs are added in **both**:
  1. Google Cloud Console (Authorized redirect URIs)
  2. Supabase Provider settings (if applicable)

### "Invalid Client ID"
- Copy-paste the credentials carefully
- Ensure no extra spaces

### "User cancelled login"
- Normal behavior - user closed the Google login dialog

### "Network error while connecting"
- Check if ad blockers/VPNs are blocking Supabase APIs
- Verify internet connection

## Security Notes

✅ Client credentials are properly configured  
✅ OAuth flow uses secure redirect  
✅ Authentication state is managed securely  
✅ Never expose service role keys in frontend code  

## Next Steps

1. Complete the steps above
2. Test Google login locally
3. Deploy to production
4. Update authorized URIs for your production domain in Google Cloud Console
5. Monitor authentication flows in Supabase dashboard

---

**Project Reference:**
- Supabase Project: `txpsghsmfwejlttikigv`
- Application: `Snapcut AI`
- Framework: Vite + React
