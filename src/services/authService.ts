import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface PendingVerification {
  email: string;
  hashedCode: string;
  expiresAt: number;
  displayName: string;
  password: string;
}

const VERIFICATION_TTL_MS = 5 * 60 * 1000;

const pendingVerifications = new Map<string, PendingVerification>();

export function generateVerificationCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const code = String(num % 1_000_000).padStart(6, '0');
  return code;
}

export async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const array = Array.from(new Uint8Array(buffer));
  return array.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function requestSignUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ code: string }> {
  const code = generateVerificationCode();
  const hashed = await hashCode(code);
  pendingVerifications.set(email.toLowerCase(), {
    email: email.toLowerCase(),
    hashedCode: hashed,
    expiresAt: Date.now() + VERIFICATION_TTL_MS,
    displayName,
    password,
  });
  return { code };
}

export async function verifyCode(email: string, code: string): Promise<AuthResult> {
  const key = email.toLowerCase();
  const pending = pendingVerifications.get(key);

  if (!pending) {
    return { success: false, error: 'No pending verification for this email. Please sign up again.' };
  }

  if (Date.now() > pending.expiresAt) {
    pendingVerifications.delete(key);
    return { success: false, error: 'Verification code has expired. Please sign up again.' };
  }

  const hashed = await hashCode(code);
  if (hashed !== pending.hashedCode) {
    return { success: false, error: 'Invalid verification code. Please try again.' };
  }

  pendingVerifications.delete(key);

  try {
    if (!isFirebaseConfigured) {
      return { success: true, user: { uid: 'demo-' + Date.now(), email: pending.email, displayName: pending.displayName } as any };
    }
    const result = await createUserWithEmailAndPassword(auth, pending.email, pending.password);
    await updateProfile(result.user, { displayName: pending.displayName });
    return { success: true, user: result.user };
  } catch (e: any) {
    const msg =
      e.code === 'auth/email-already-in-use' ? 'An account with this email already exists'
      : e.code === 'auth/weak-password' ? 'Password should be at least 6 characters'
      : e.code === 'auth/invalid-email' ? 'Invalid email address'
      : e.message || 'Sign up failed';
    return { success: false, error: msg };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    if (!isFirebaseConfigured) {
      return { success: true, user: { uid: 'demo-user', email, displayName: 'Demo User' } as any };
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (e: any) {
    const msg =
      e.code === 'auth/user-not-found' ? 'No account found with this email'
      : e.code === 'auth/wrong-password' ? 'Incorrect password'
      : e.code === 'auth/invalid-email' ? 'Invalid email address'
      : e.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later'
      : e.message || 'Sign in failed';
    return { success: false, error: msg };
  }
}

export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured) {
    await firebaseSignOut(auth);
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
