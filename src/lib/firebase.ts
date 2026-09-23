import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();

// Google Workspace Scopes
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
];

WORKSPACE_SCOPES.forEach(scope => {
  googleAuthProvider.addScope(scope);
});

// Prompt consent to ensure fresh tokens with all granted scopes
googleAuthProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;
// Cache the access token strictly in memory
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, accessToken: string, idToken: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        cachedIdToken = idToken;
        if (cachedAccessToken && onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken, idToken);
        } else if (!isSigningIn) {
          // If we have user but no access token, user needs to trigger popup sign-in
          if (onAuthSuccess) {
            onAuthSuccess(user, '', idToken);
          }
        }
      } catch (err) {
        console.error('Error refreshing token:', err);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      console.warn('Google Access token was not returned directly from credential. Workspace API calls may require user re-auth.');
    }

    cachedAccessToken = credential?.accessToken || null;
    const idToken = await result.user.getIdToken();
    cachedIdToken = idToken;

    return { 
      user: result.user, 
      accessToken: cachedAccessToken || '', 
      idToken 
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getIdToken = async (): Promise<string | null> => {
  if (cachedIdToken) return cachedIdToken;
  const currentUser = auth.currentUser;
  if (currentUser) {
    cachedIdToken = await currentUser.getIdToken();
    return cachedIdToken;
  }
  return null;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedIdToken = null;
};
