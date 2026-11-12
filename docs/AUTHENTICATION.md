# FindIn Authentication

The current frontend uses a mock identity-provider adapter so the authentication experience can be developed before the database and identity-provider project are configured.

## Current behavior

- Login and signup use the same provider-based entry point.
- Google and GitHub buttons simulate a successful redirect flow.
- A mock user and token are stored in `localStorage` under `findin.auth`.
- No password field or password storage is used.
- The signed-in state includes a sign-out action.

## Replacing the mock

Replace `signInWithProvider` in `frontend/src/features/auth/auth.service.ts` with the identity provider's redirect or SDK flow. Keep the return type as `AuthResult` so `AuthView` does not need to change.

The production flow should validate the provider callback on the backend, issue a FindIn session, and keep provider secrets on the server. The frontend should never store a client secret or treat a local mock token as an authenticated production session.
