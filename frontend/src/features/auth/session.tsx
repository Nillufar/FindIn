import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import {ApiError} from '../../api/client';
import {authApi, type SessionUser} from '../../api/findin';

type SessionContextValue = {
    user: SessionUser | null;
    loading: boolean;
    refresh: () => Promise<void>;
    signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setUser(await authApi.me());
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 401)) console.error(error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return <SessionContext.Provider value={{user, loading, refresh, signOut}}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
    const value = useContext(SessionContext);
    if (!value) throw new Error('useSession must be used inside SessionProvider');
    return value;
}

/** The signed-in user; only call inside pages that render after sign-in. */
export function useCurrentUser(): SessionUser {
    const {user} = useSession();
    if (!user) throw new Error('No signed-in user');
    return user;
}
