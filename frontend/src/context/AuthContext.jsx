import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api, { extractApiError, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'guest'
  const navigate = useNavigate();

  const signOut = useCallback(
    (redirect = true) => {
      tokenStore.clear();
      setUser(null);
      setStatus('guest');
      if (redirect) navigate('/login', { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => signOut(true));
  }, [signOut]);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setStatus('guest');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (cancelled) return;
        setUser(data.user);
        setStatus('authed');
      } catch (err) {
        tokenStore.clear();
        if (!cancelled) setStatus('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      tokenStore.set(data.token);
      setUser(data.user);
      setStatus('authed');
      return data.user;
    } catch (err) {
      throw new Error(extractApiError(err, 'Unable to log in'));
    }
  }, []);

  const hasRole = useCallback(
    (...names) => {
      if (!user?.role?.name) return false;
      return names.includes(user.role.name);
    },
    [user]
  );

  const value = {
    user,
    status,
    isAuthed: status === 'authed',
    signIn,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
