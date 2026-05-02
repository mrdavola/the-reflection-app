import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.log(`Audio retention skipped. Missing env: ${missing.join(", ")}`);
  process.exit(0);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = getStorage().bucket();
const [files] = await bucket.getFiles({ prefix: "reflection-audio/" });
const now = Date.now();
let deleted = 0;

for (const file of files) {
  const [metadata] = await file.getMetadata();
  const expiresAt = metadata.metadata?.audioExpiresAt;

  if (expiresAt && Date.parse(expiresAt) < now) {
    await file.delete();
    deleted += 1;
  }
}

console.log(`Audio retention complete. Deleted ${deleted} expired files.`);
