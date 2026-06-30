# Google Sign-In

## 1. Google Cloud Console

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth client ID** → Application type: **Web application**.
3. Add **Authorized redirect URI**:
   - Production: `https://mavash-events.vercel.app/api/auth/google/callback`
   - Local: `http://localhost:3000/api/auth/google/callback`
4. Copy **Client ID** and **Client secret**.

## 2. Vercel environment variables

| Variable | Value |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Client ID |
| `GOOGLE_CLIENT_SECRET` | Client secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same Client ID (shows the button in UI) |
| `NEXT_PUBLIC_SITE_URL` | `https://mavash-events.vercel.app` |

Redeploy after setting variables.

## 3. Apps Script

Deploy the updated `Code.gs` (includes `getOrCreateOAuthUser` action) and redeploy the Web App.

## Behavior

- **New user** with Google → account created automatically → session → dashboard (or `/dashboard/new` from register page).
- **Existing email/password user** → same email via Google logs into the existing account.
- **Google-only account** → password login shows: "חשבון זה מחובר ל-Google".
