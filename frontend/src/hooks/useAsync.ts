import {useCallback, useEffect, useState} from 'react';
import {describeError} from '../api/client';

type AsyncState<T> = {
    data: T | null;
    error: string | null;
    loading: boolean;
    reload: () => void;
    setData: (data: T) => void;
};

/** Loads data when `deps` change; `reload()` fetches again after an action. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableLoad = useCallback(load, deps);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        stableLoad()
            .then((result) => active && setData(result))
            .catch((caught) => active && setError(describeError(caught)))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [stableLoad, version]);

    return {data, error, loading, reload: () => setVersion((value) => value + 1), setData};
}
