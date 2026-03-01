'use client';

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

export async function initAuthPersistence() {
  await setPersistence(firebaseAuth, browserLocalPersistence);
}

export async function loginWithEmail(email: string, password: string) {
  await initAuthPersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  await initAuthPersistence();
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function loginWithGoogle() {
  await initAuthPersistence();
  return signInWithPopup(firebaseAuth, googleProvider);
}

export async function logoutUser() {
  await signOut(firebaseAuth);
}

export async function validateSecureToken(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult(true);
  const expiresAt = new Date(tokenResult.expirationTime).getTime();
  return expiresAt > Date.now();
}

export async function getUserRole(user: User): Promise<'admin' | 'user'> {
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin ? 'admin' : 'user';
}

export async function updateUserDisplayName(user: User, displayName: string) {
  const sanitizedName = displayName.trim();
  if (!sanitizedName) {
    return;
  }
  await updateProfile(user, { displayName: sanitizedName });
}

export async function updateUserPhotoUrl(user: User, photoUrl: string) {
  const sanitizedUrl = photoUrl.trim();
  if (!sanitizedUrl) {
    return;
  }
  await updateProfile(user, { photoURL: sanitizedUrl });
}
