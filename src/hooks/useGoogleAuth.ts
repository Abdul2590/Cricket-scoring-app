import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  auth,
  subscribeToAuthChanges, 
  googleSignIn, 
  switchGoogleAccount, 
  logout, 
  getRecentUsers,
  removeUserFromHistory,
  getCurrentCachedToken
} from '../services/firebaseAuth';
import { SavedGoogleUserProfile } from '../types';

export function useGoogleAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [token, setToken] = useState<string | null>(getCurrentCachedToken());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [recentUsers, setRecentUsers] = useState<SavedGoogleUserProfile[]>(() => getRecentUsers());
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((newUser, newToken) => {
      setUser(newUser);
      setToken(newToken);
      setIsAuthLoading(false);
      setRecentUsers(getRecentUsers());
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (options?: { includeDriveScopes?: boolean }) => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn({
        selectAccount: true,
        includeDriveScopes: options?.includeDriveScopes,
      });
      if (res) {
        setRecentUsers(getRecentUsers());
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in with Google';
      setAuthError(msg);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const switchAccount = async (options?: { includeDriveScopes?: boolean }) => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const res = await switchGoogleAccount({
        includeDriveScopes: options?.includeDriveScopes,
      });
      if (res) {
        setRecentUsers(getRecentUsers());
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to switch Google account';
      setAuthError(msg);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await logout();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign out');
    }
  };

  const forgetRecentUser = (uidOrEmail: string) => {
    removeUserFromHistory(uidOrEmail);
    setRecentUsers(getRecentUsers());
  };

  return {
    user,
    token,
    isAuthLoading,
    authError,
    recentUsers,
    signIn,
    switchAccount,
    signOut,
    forgetRecentUser,
    clearError: () => setAuthError(null),
  };
}
