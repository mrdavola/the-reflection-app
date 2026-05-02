import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export function getFirebaseClientApp() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;

  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

export function getFirebaseClientServices() {
  const app = getFirebaseClientApp();

  if (!app) {
    return { app: null, auth: null, db: null, storage: null, googleProvider: null };
  }

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    googleProvider: new GoogleAuthProvider(),
  };
}
