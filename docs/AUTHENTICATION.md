# FindIn Authentication

The frontend uses a backend-mediated OAuth authorization-code flow and a signed session cookie.

## Current behavior

- Login and signup use the same provider-based entry point.
- Google and GitHub buttons redirect to the selected provider for authentication and consent.
- The backend exchanges the authorization code and retrieves the verified provider profile.
- The backend finds or creates the FindIn `User` by verified email, then sets the `findin_session` cookie
  (HttpOnly, SameSite=Lax, `Secure` in production, 14 days). It holds only the user id and an HMAC signature made
  with `SESSION_SECRET`, so it cannot be forged or edited.
- The frontend calls `GET /api/auth/me` to learn who is signed in; `POST /api/auth/logout` clears the cookie.
- No password field or password storage is used, and provider access tokens are never sent to the browser.
- New users are sent to `/welcome` to add their university and major.
- Local development only: `POST /api/auth/dev-login` signs in as a seeded account without OAuth keys. It returns
  404 unless `NODE_ENV=development`.

## Provider setup

Create OAuth applications in the Google Cloud Console and GitHub Developer Settings. Configure these callback URLs:

```text
http://localhost:4000/api/auth/google/callback
http://localhost:4000/api/auth/github/callback
```

Copy the client IDs and secrets into `.env` using `.env.example`. Keep the secrets on the backend and never expose them
as `VITE_` variables.

## Production notes

Set `SESSION_SECRET` to a long random value; the API refuses to start in production without one. Serve the frontend
and API from the same site (for example `/api` behind the same domain) so the session cookie is sent with API calls.
