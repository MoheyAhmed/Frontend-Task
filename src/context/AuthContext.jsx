/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const STORAGE_KEY = 'ovarc.auth.user';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Control whether auth sessions are persisted between reloads.
  // Default: do NOT persist so the app starts with no profile shown.
  // Set VITE_AUTH_PERSIST=true to enable restoring/saving the session.
  const AUTH_PERSIST = String(import.meta.env.VITE_AUTH_PERSIST || '').toLowerCase() === 'true';

  useEffect(() => {
    if (!AUTH_PERSIST) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (storageError) {
      console.warn('Failed to restore cached user session', storageError);
    }
  }, [AUTH_PERSIST]);

  useEffect(() => {
    if (!AUTH_PERSIST) return;
    try {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (storageError) {
      console.warn('Failed to persist user session locally', storageError);
    }
  }, [user, AUTH_PERSIST]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
    if (status !== 'loading') {
      setStatus('idle');
    }
  }, [status]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    closeModal();
  }, [closeModal]);

  const signIn = useCallback(
    async ({ email, password }) => {
      setStatus('loading');
      setError(null);
      try {
        const response = await authService.login({ email, password });
        const authUser = {
          ...response.user,
          token: response.token,
        };
        setUser(authUser);
        setStatus('success');
        closeModal();
        return authUser;
      } catch (err) {
        const message = err.payload?.message ?? err.message ?? 'Unexpected error occurred';
        setError(message);
        setStatus('error');
        throw err;
      }
    },
    [closeModal]
  );

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      signIn,
      signOut,
      isModalOpen,
      openModal,
      closeModal,
      isAuthenticated: Boolean(user),
    }),
    [user, status, error, signIn, signOut, isModalOpen, openModal, closeModal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

