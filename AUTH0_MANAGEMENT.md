# Auth0 – How It’s Used and How to Manage It

This doc describes how Auth0 is integrated in the app and what you need to manage in the Auth0 dashboard and in code.

---

## 1. What Auth0 Does Here

- **Social / OAuth login** (Google, GitHub, Twitter, Discord, LinkedIn) via Auth0.
- **Backend** builds the Auth0 authorize URL, handles the OAuth callback, exchanges the code for tokens, gets user info from Auth0, then **finds or creates a user in your DB** and issues **your own JWT + cookies**.
- **Frontend** opens Auth0 in a popup, receives the redirect on `/auth0-success`, then passes the token to the parent window and logs the user in with your app’s session (Redux + cookies).

So: Auth0 is only for **social login**; after the callback your app uses **your own auth** (JWT + cookies), not Auth0 tokens for API calls.

---

## 2. Backend Configuration

### 2.1 Environment variables (`Backend/.env`)

```env
# Auth0 Configuration
AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=https://api.equalmint.com/api/v1/auth/callback
AUTH0_AUDIENCE=https://your-domain.us.auth0.com/api/v2/
```

- **AUTH0_DOMAIN** – Auth0 tenant domain (e.g. `dev-p8sn62kfrshlvrxb.us.auth0.com`).
- **AUTH0_CLIENT_ID** – Application **Client ID** from Auth0.
- **AUTH0_CLIENT_SECRET** – Application **Client Secret** (keep secret; server-only).
- **AUTH0_CALLBACK_URL** – Must **exactly** match the URL allowed in Auth0 (see below). Backend redirects Auth0 here after login.
- **AUTH0_AUDIENCE** – Optional; used if you call Auth0 APIs (e.g. Management API). Not required for basic social login.

For **production**, set:

- `AUTH0_CALLBACK_URL` to your real backend callback, e.g. `https://api.yourdomain.com/api/v1/auth/callback`.
- Ensure `FRONTEND_URL` (used in the redirect after callback) is your real frontend, e.g. `https://app.yourdomain.com`.

### 2.2 Config and routes

| File | Purpose |
|------|--------|
| `Backend/config/auth0.config.ts` | Reads env and exports `auth0Config` (domain, clientId, clientSecret, callbackURL, audience, scope) and `socialProviders` (google, github, twitter, discord, linkedin). |
| `Backend/controllers/auth0.controller.ts` | `getAuth0LoginUrl`, `handleAuth0Callback`, `linkSocialAccount`, `unlinkSocialAccount`. |
| `Backend/routes/auth0.route.ts` | Mounted under `/api/v1` in `app.ts`. |

### 2.3 API Endpoints (under `/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth0/login?provider=google` | No | Returns `{ success, authUrl }`. Frontend opens `authUrl` in a popup. |
| GET | `/auth/callback` | No | Auth0 redirects here with `?code=...&state=...`. Backend exchanges code, gets user, finds/creates user in DB, sets cookies, redirects to frontend `/auth0-success?token=...&userId=...`. |
| POST | `/auth0/link` | Yes | Body: `{ provider, accessToken }`. Links an Auth0 social account to the current user. |
| POST | `/auth0/unlink` | Yes | Body: `{ provider }`. Removes that social account from the current user. |

---

## 3. Auth0 Dashboard – What to Configure

### 3.1 Application (APIs / Applications)

1. **Applications → Applications** – Use one “Regular Web Application” (or the one that matches your backend).
2. **Settings**:
   - **Allowed Callback URLs**  
     Add the **exact** callback your backend uses, e.g.:
     - Local: `https://api.equalmint.com/api/v1/auth/callback` (if backend is HTTPS on 8000) or `http://localhost:8000/api/v1/auth/callback` (if HTTP).
     - Production: `https://api.yourdomain.com/api/v1/auth/callback`.
   - **Allowed Logout URLs** – Optional; add frontend URL if you use Auth0 logout.
   - **Allowed Web Origins** – Add your frontend origin(s), e.g. `https://app.equalmint.com`, `https://app.yourdomain.com` (needed if frontend talks to Auth0 from the browser; your flow is mostly backend-driven, but good to have).

### 3.2 Social connections

1. **Authentication → Social** – Enable the providers you want: Google, GitHub, Twitter, Discord, LinkedIn.
2. For each, configure the provider’s OAuth app (client ID/secret from Google, GitHub, etc.) in Auth0.
3. Your backend sends `state=<provider>` (e.g. `google`, `github`). The backend doesn’t send `connection`; Auth0 will use the default connection per provider. If you use multiple connections per provider, you may need to add `connection` to the authorize URL in `getAuth0LoginUrl` (see `socialProviders` in `auth0.config.ts`).

### 3.3 Optional: Auth0 audience and APIs

- **AUTH0_AUDIENCE** is only needed if you call Auth0’s Management API or other Auth0 APIs.
- For “login with Google/GitHub/etc. and then use our own JWT,” you can leave audience blank or set it later when you add those integrations.

---

## 4. Frontend Flow

1. User clicks a social button (e.g. “Google”) in **My Profile** (or wherever `SocialLoginButton` is used).
2. Frontend calls **GET** `/api/v1/auth0/login?provider=google` and gets `authUrl`.
3. Frontend opens `authUrl` in a **popup**.
4. User signs in on Auth0; Auth0 redirects to **GET** `/api/v1/auth/callback?code=...&state=...`.
5. Backend exchanges `code`, gets user from Auth0, finds/creates user in DB, sets **cookies** and redirects to **`FRONTEND_URL/auth0-success?token=...&userId=...`** (e.g. `https://app.equalmint.com/auth0-success?token=...&userId=...`).
6. **`/auth0-success`** page (in the popup):
   - If it’s in a popup: sends `postMessage` to opener with `{ type: 'AUTH0_SUCCESS', token, userId }`, then parent sends `CLOSE_POPUP` and closes the popup.
   - Parent window receives the message, stores token/user (e.g. Redux + localStorage) and treats the user as logged in.

So the **only** place that must be allowed as a “callback” in Auth0 is the **backend** URL (`AUTH0_CALLBACK_URL`). The frontend `/auth0-success` is your own page; no Auth0 config needed for it except that your app must be able to load it (same origin as the rest of the app).

---

## 5. User Creation (Auth0) and Your Registration Model

When a user signs in with Auth0 **for the first time**, the backend **creates** a user with:

- `role: 'user'`
- No `marketplace_role` set → your schema **default** is `'user'` (student/instructor style; no contributor/startup access)
- Placeholder fields: `dateOfBirth`, `nationality`, `age`, `contactNumber`, etc.

So:

- Auth0 users start as **normal “user”** with **marketplace_role defaulting to `'user'**.
- They can later use **“Become a contributor”** on the marketplace contributors page to set `marketplace_role` to `'contributor'` and add a contributor profile.

If you want Auth0 users to be able to choose “startup” or “contributor” at first login, you’d need an extra step (e.g. a post-login “Choose your role” screen and an API that sets `marketplace_role`), which is not implemented today.

---

## 6. Files to Touch When Managing Auth0

| Task | Where |
|------|--------|
| Change Auth0 domain, client, callback, audience | `Backend/.env` and Auth0 Dashboard → Application settings. |
| Add/remove social providers | Auth0 Dashboard → Social; optionally `Backend/config/auth0.config.ts` → `socialProviders` and frontend list (e.g. `SocialCommunity.tsx`). |
| Change callback path | `Backend/.env` → `AUTH0_CALLBACK_URL`, and **Allowed Callback URLs** in Auth0. |
| Change where user is sent after login | Backend `handleAuth0Callback`: `frontendUrl` and redirect to `/auth0-success?token=...`. Frontend `/auth0-success`: redirect or postMessage handling. |
| Link/unlink social to logged-in user | Already implemented: `POST /auth0/link`, `POST /auth0/unlink`; use from profile/settings UI. |

---

## 7. Quick Checklist

- [ ] **Backend `.env`**: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_CALLBACK_URL` set and correct for the environment.
- [ ] **Auth0 Dashboard**: Application type and **Allowed Callback URLs** include the exact `AUTH0_CALLBACK_URL` (and only the URLs you use).
- [ ] **Auth0 Dashboard**: Social connections enabled and configured (Google, GitHub, etc.) as needed.
- [ ] **Production**: `AUTH0_CALLBACK_URL` and `FRONTEND_URL` point to your real backend and frontend.
- [ ] **Auth0-created users**: Be aware they get default `marketplace_role` (e.g. `'user'`); use “Become a contributor” or a future “choose role” flow if you want them to act as contributors or startups.

This is how Auth0 is wired and how to manage it end to end.
