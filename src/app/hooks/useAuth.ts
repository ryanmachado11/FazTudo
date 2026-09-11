import { useEffect, useState } from 'react';
import { getCurrentUser, getSession, isLoggedIn, saveSession, clearSession } from '../lib/session';
import { ApiError, apiGet } from '../lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      setError('');
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const session = getSession();
        if (!session) {
          setUser(null);
          return;
        }
        const profile = await apiGet<{ id: string; name: string; email: string; role: string; avatarUrl?: string | null }>('/api/auth/me');
        const merged = { ...session.user, ...profile } as AuthUser;
        saveSession({
          accessToken: session.accessToken,
          user: merged,
        });
        setUser(merged);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          setUser(null);
        } else {
          setError(error instanceof Error ? error.message : 'Não foi possível validar sua sessão.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [retryKey]);

  return { user, loading, error, retry: () => setRetryKey((current) => current + 1) };
}
