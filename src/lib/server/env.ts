export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  );
}

export function hasFirebaseAdminEnv() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function hasGeminiEnv() {
  return Boolean(process.env.GEMINI_API_KEY);
}
