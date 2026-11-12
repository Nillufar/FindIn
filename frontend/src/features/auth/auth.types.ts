export type IdentityProvider = 'google' | 'github';

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    provider: IdentityProvider;
};

export type AuthResult = {
    user: AuthUser;
    accessToken: string;
};
