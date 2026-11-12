# FindIn Authentication

The frontend now uses a backend-mediated OAuth authorization-code flow. The database is not required for the current milestone.

## Current behavior

- Login and signup use the same provider-based entry point.
- Google and GitHub buttons redirect to the selected provider for authentication and consent.
- The backend exchanges the authorization code and retrieves the verified provider profile.
- The profile is returned to the frontend for the current demo but is not persisted.
- No password field or password storage is used.
- The signed-in state includes a sign-out action.

## Provider setup

Create OAuth applications in the Google Cloud Console and GitHub Developer Settings. Configure these callback URLs:

```text
http://localhost:4000/api/auth/google/callback
http://localhost:4000/api/auth/github/callback
```

Copy the client IDs and secrets into `.env` using `.env.example`. Keep the secrets on the backend and never expose them as `VITE_` variables.

## Future session integration

After the database is ready, replace the profile redirect in `backend/src/modules/auth/auth.routes.ts` with a user upsert and secure FindIn session cookie. The current fragment response is intentionally temporary and should not be treated as a production session.
