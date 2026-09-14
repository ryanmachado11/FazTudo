import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAccessToken, getSession, saveSession, subscribeSession } from '../lib/session';
import { ApiError, apiGet } from '../lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export function useAuth() {
  const token = useSyncExternalStore(subscribeSession, getAccessToken, () => null);
  const [state, setState] = useState<{ token: string | null; user: AuthUser | null; loading: boolean; error: string }>({
    token: null, user: null, loading: false, error: '',
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    const loadUser = async () => {
      setState({ token, user: null, loading: true, error: '' });
      try {
        const session = getSession();
        if (!session || session.accessToken !== token) return;
        const profile = await loadProfile(token);
        if (cancelled || getAccessToken() !== token) return;
        const merged = { ...session.user, ...profile } as AuthUser;
        saveSession({
          accessToken: token,
          user: merged,
        });
        setState({ token, user: merged, loading: false, error: '' });
      } catch (error) {
        if (cancelled || getAccessToken() !== token) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ token, user: null, loading: false, error: '' });
        } else {
          setState({ token, user: null, loading: false, error: error instanceof Error ? error.message : 'Não foi possível validar sua sessão.' });
        }
      }
    };

    loadUser();
    return () => { cancelled = true; };
  }, [retryKey, token]);

  const current = token && state.token === token ? state : { user: null, loading: Boolean(token), error: '' };
  return { ...current, retry: () => setRetryKey((current) => current + 1) };
}

// Share only requests in flight. Each mount still validates the current database user.
const pendingProfiles = new Map<string, Promise<AuthUser>>();
function loadProfile(token: string) {
  let pending = pendingProfiles.get(token);
  if (!pending) {
    pending = apiGet<AuthUser>('/api/auth/me').finally(() => pendingProfiles.delete(token));
    pendingProfiles.set(token, pending);
  }
  return pending;
}
