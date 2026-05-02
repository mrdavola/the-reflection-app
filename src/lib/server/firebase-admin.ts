import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { hasFirebaseAdminEnv } from "./env";

export function getFirebaseAdminApp() {
  if (!hasFirebaseAdminEnv()) return null;

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminBucket() {
  const app = getFirebaseAdminApp();
  return app && process.env.FIREBASE_STORAGE_BUCKET ? getStorage(app).bucket() : null;
}

export async function storeReflectionAudio(input: {
  sessionId: string;
  reflectionId: string;
  stepNumber: number;
  file: File;
  audioExpiresAt: string;
}) {
  const bucket = getAdminBucket();
  if (!bucket) return null;

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const path = `reflection-audio/${input.sessionId}/${input.reflectionId}/step-${input.stepNumber}.webm`;
  const storageFile = bucket.file(path);

  await storageFile.save(bytes, {
    contentType: input.file.type || "audio/webm",
    resumable: false,
    metadata: {
      metadata: {
        audioExpiresAt: input.audioExpiresAt,
      },
    },
  });

  return `gs://${bucket.name}/${path}`;
}
