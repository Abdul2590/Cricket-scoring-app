import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedGoogleUserProfile } from '../types';

// Storage key for user profile history (enables switching and viewing past accounts)
const STORAGE_KEY_USER_HISTORY = 'criclive_google_users_history_v1';

// Reuse existing Firebase app instance if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// In-memory token cache (never stored in localStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Event listeners for auth changes
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

export const subscribeToAuthChanges = (callback: AuthCallback) => {
  listeners.add(callback);
  // Immediate emit
  callback(auth.currentUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach((cb) => {
    try {
      cb(user, token);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
};

// Global onAuthStateChanged listener
onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    recordUserInHistory(user);
    notifyListeners(user, cachedAccessToken);
  } else {
    cachedAccessToken = null;
    notifyListeners(null, null);
  }
});

/**
 * Legacy initAuth support for components expecting (onSuccess, onFailure)
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return subscribeToAuthChanges((user, token) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google.
 * Uses prompt: 'select_account' by default so users can select an existing account or "Use another account".
 */
export const googleSignIn = async (options?: {
  selectAccount?: boolean;
  includeDriveScopes?: boolean;
}): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();

    // Default to 'select_account' so user can pick any account or switch accounts
    if (options?.selectAccount !== false) {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    if (options?.includeDriveScopes !== false) {
      DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;

    recordUserInHistory(result.user);
    notifyListeners(result.user, cachedAccessToken);

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user') {
      console.warn('Google sign-in popup was closed by user');
      return null;
    }
    if (error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Switch account: signs out current user and prompts Google account chooser popup.
 * This directly enables logging in as another user with Google!
 */
export const switchGoogleAccount = async (options?: {
  includeDriveScopes?: boolean;
}): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    // 1. Sign out current user first
    await signOut(auth);
    cachedAccessToken = null;
    notifyListeners(null, null);

    // 2. Open Google Auth popup explicitly with prompt: 'select_account'
    return await googleSignIn({
      selectAccount: true,
      includeDriveScopes: options?.includeDriveScopes !== false,
    });
  } catch (error) {
    console.error('Error switching Google account:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentCachedToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  notifyListeners(null, null);
};

// --------------------------------------------------------
// Recent Google Users Local History (Account Switcher feature)
// --------------------------------------------------------

export const getRecentUsers = (): SavedGoogleUserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedGoogleUserProfile[];
  } catch {
    return [];
  }
};

export const recordUserInHistory = (user: User) => {
  try {
    const existing = getRecentUsers();
    const updatedUser: SavedGoogleUserProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Google Scorer',
      email: user.email,
      photoURL: user.photoURL,
      lastLoginAt: Date.now(),
    };

    const filtered = existing.filter((u) => u.uid !== user.uid && u.email !== user.email);
    const combined = [updatedUser, ...filtered].slice(0, 8); // Keep top 8 recent users
    localStorage.setItem(STORAGE_KEY_USER_HISTORY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Failed to record user history:', e);
  }
};

export const removeUserFromHistory = (uidOrEmail: string) => {
  try {
    const existing = getRecentUsers();
    const filtered = existing.filter((u) => u.uid !== uidOrEmail && u.email !== uidOrEmail);
    localStorage.setItem(STORAGE_KEY_USER_HISTORY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove user from history:', e);
  }
};
