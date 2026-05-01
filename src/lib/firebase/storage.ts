// Audio-blob upload helper for Firebase Cloud Storage.
//
// Files land under `audio/{path}`. When `getStorage()` returns null (env vars
// unset / package not installed), both helpers no-op silently so the calling
// code can stay agnostic.
//
// TODO before this can run live:
//   npm i firebase

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getStorage } from "./client";

/**
 * Upload an audio blob to `audio/{path}` and return a public download URL.
 * Returns an empty string when Firebase Storage isn't configured — callers
 * should treat that as "no upload happened" and keep the local blob URL.
 */
export async function uploadAudioBlob(blob: Blob, path: string): Promise<string> {
  const storage = getStorage();
  if (!storage) return "";

  try {
    const objectRef = ref(storage, `audio/${path}`);
    await uploadBytes(objectRef, blob, { contentType: blob.type || "audio/webm" });
    return await getDownloadURL(objectRef);
  } catch (err) {
    console.warn("[firebase/storage] uploadAudioBlob failed:", err);
    return "";
  }
}

/**
 * Best-effort delete by download URL. Silently no-ops when storage isn't
 * configured or the URL doesn't belong to this bucket.
 */
export async function deleteAudio(url: string): Promise<void> {
  const storage = getStorage();
  if (!storage || !url) return;

  try {
    // `ref(storage, url)` accepts gs:// or https:// download URLs from the
    // same project bucket. Throws for unrelated URLs — caught below.
    const objectRef = ref(storage, url);
    await deleteObject(objectRef);
  } catch (err) {
    console.warn("[firebase/storage] deleteAudio failed (best-effort):", err);
  }
}
