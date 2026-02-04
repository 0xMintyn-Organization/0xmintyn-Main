# EqualMint – Environment setup (local + production)

One setup for **localhost** and **production** so login from the marketing site and MVP share the same session (cookies).

---

## 1. Local: “Login on website → redirect to MVP” (full flow)

For **login on EqualMint (website) then open MVP and stay logged in**, the API must:

- Allow multiple origins (website + MVP) in CORS.
- Set cookies with **SameSite=None; Secure** (so the browser stores them on cross-origin login).
- Run over **HTTPS** (required for `Secure` cookies).

### Backend

1. **CORS** – set both origins (MVP + website):

   ```env
   CORS_ORIGINS=https://app.equalmint.com,https://equalmint.com
   ```

   With 2+ origins, the backend automatically uses cross-origin cookie options.

2. **HTTPS** – generate a self-signed cert and run with HTTPS:

   ```bash
   cd Backend
   npm run certs
   ```

   Then in `.env`:

   ```env
   USE_HTTPS=true
   ```

   Start the API:

   ```bash
   npm run dev:https
   ```

   API base: **https://api.equalmint.com**.

3. **Trust the self-signed cert** (fixes `ERR_CERT_AUTHORITY_INVALID` on login):

   - Open **https://api.equalmint.com** in the same browser (e.g. in a new tab).
   - You’ll see “Your connection is not private” (or similar). Click **Advanced** → **Proceed to localhost (unsafe)**.
   - After that, the MVP (localhost:3000) can call the API without certificate errors. You only need to do this once per browser.

4. **Frontend (MVP)** – point to the API over HTTPS:

   ```env
   NEXT_PUBLIC_SERVER_URI=https://api.equalmint.com/api/v1/
   NEXT_PUBLIC_MARKETING_URL=https://equalmint.com
   ```

5. **EqualMint (website)** – point to the same API and MVP:

   ```env
   VITE_APP_API_URL=https://api.equalmint.com/api/v1
   VITE_APP_DASHBOARD_URL=https://app.equalmint.com
   ```

Then: open the website at `https://equalmint.com`, log in → redirect to MVP at `https://app.equalmint.com` → you stay logged in.

---

## 2. Local: MVP only (no marketing site)

If you only use the MVP (no login from the website):

- You can keep the API on **HTTP**.
- Use a **single** origin in CORS (or leave default).
- No need for `USE_HTTPS` or `npm run certs`.

Example:

```env
# Backend – single origin or default
CORS_ORIGINS=https://app.equalmint.com
```

```env
# Frontend
NEXT_PUBLIC_SERVER_URI=https://api.equalmint.com/api/v1/
```

---

## 3. Production

- **Backend**: `NODE_ENV=production` (or set `COOKIE_SAME_SITE_NONE=true`). API over **HTTPS**.
- **CORS**: your live origins, e.g.  
  `CORS_ORIGINS=https://app.equalmint.com,https://equalmint.com,https://www.equalmint.com`
- **Frontend (MVP)**:  
  `NEXT_PUBLIC_SERVER_URI=https://app.equalmint.com/api/v1/`  
  `NEXT_PUBLIC_MARKETING_URL=https://equalmint.com`
- **EqualMint (website)**:  
  `VITE_APP_API_URL=https://app.equalmint.com/api/v1`  
  `VITE_APP_DASHBOARD_URL=https://app.equalmint.com`

No `USE_HTTPS` or local certs needed; your host already serves HTTPS.

---

## Summary

| Scenario              | CORS_ORIGINS              | API HTTPS      | Cookie behaviour        |
|-----------------------|---------------------------|----------------|--------------------------|
| Local (website + MVP) | 2+ origins                 | Yes (`USE_HTTPS=true`) | SameSite=None; Secure    |
| Local (MVP only)      | 1 origin or default       | No             | SameSite=Lax             |
| Production            | Live domains              | Yes (host)     | SameSite=None; Secure     |
