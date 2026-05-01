// Firebase client. Lazy-initialized singletons for app, Firestore, Auth, and
// Cloud Storage. All accessors return `null` when env vars are missing or the
// `firebase` package isn't installed yet, so callers can fall through to the
// localStorage path in `@/lib/storage`.
//
// TODO before this can run live:
//   npm i firebase
//
// Required env vars (from a Firebase web app config):
//   NEXT_PUBLIC_FIREBASE_API_KEY
//   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID
//   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
//   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//   NEXT_PUBLIC_FIREBASE_APP_ID

import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getFirestore as fbGetFirestore, type Firestore } from "firebase/firestore";
import { getAuth as fbGetAuth, type Auth } from "firebase/auth";
import { getStorage as fbGetStorage, type FirebaseStorage } from "firebase/storage";

let cachedApp: FirebaseApp | null | undefined;
let cachedDb: Firestore | null | undefined;
let cachedAuth: Auth | null | undefined;
let cachedStorage: FirebaseStorage | null | undefined;

function readConfig(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * Returns the singleton Firebase app instance, or `null` when env vars
 * aren't set / the package isn't installed. Memoised across calls.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp !== undefined) return cachedApp;

  const config = readConfig();
  if (!config) {
    cachedApp = null;
    return cachedApp;
  }

  try {
    const existing = getApps();
    cachedApp = existing.length > 0 ? existing[0] : initializeApp(config);
  } catch (err) {
    console.warn("[firebase/client] init failed, falling back to local storage:", err);
    cachedApp = null;
  }

  return cachedApp;
}

/** Firestore client, or `null` when Firebase isn't configured. */
export function getFirestore(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;

  const app = getFirebaseApp();
  if (!app) {
    cachedDb = null;
    return cachedDb;
  }

  try {
    cachedDb = fbGetFirestore(app);
  } catch (err) {
    console.warn("[firebase/client] firestore init failed:", err);
    cachedDb = null;
  }

  return cachedDb;
}

/** Auth client, or `null` when Firebase isn't configured. */
export function getAuth(): Auth | null {
  if (cachedAuth !== undefined) return cachedAuth;

  const app = getFirebaseApp();
  if (!app) {
    cachedAuth = null;
    return cachedAuth;
  }

  try {
    cachedAuth = fbGetAuth(app);
  } catch (err) {
    console.warn("[firebase/client] auth init failed:", err);
    cachedAuth = null;
  }

  return cachedAuth;
}

/** Cloud Storage client, or `null` when Firebase isn't configured. */
export function getStorage(): FirebaseStorage | null {
  if (cachedStorage !== undefined) return cachedStorage;

  const app = getFirebaseApp();
  if (!app) {
    cachedStorage = null;
    return cachedStorage;
  }

  try {
    cachedStorage = fbGetStorage(app);
  } catch (err) {
    console.warn("[firebase/client] storage init failed:", err);
    cachedStorage = null;
  }

  return cachedStorage;
}
