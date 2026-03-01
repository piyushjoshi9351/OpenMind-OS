'use client';

import { initializeFirebase } from '@/firebase';

export const firebaseServices = initializeFirebase();

export const firebaseApp = firebaseServices.firebaseApp;
export const firebaseAuth = firebaseServices.auth;
export const firestoreDb = firebaseServices.firestore;
