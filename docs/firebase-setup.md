# Firebase setup

The Reflection App ships with **localStorage persistence by default** — the
demo flows run end-to-end without any external service. This guide gives you
a one-flag-flip path to real persistence (Firestore), auth (Firebase Auth),
and audio storage (Cloud Storage) when you're ready.

Until the env vars below are set, the runtime path is unchanged: every
mutation goes through `src/lib/storage.ts` and stays on the device.

---

## 1. Install the SDK

The Firebase wrappers (`src/lib/firebase/*`) are written against the
official `firebase` package but it's **not yet installed**. Run:

```bash
npm i firebase
```

Once installed, the ambient module declarations in
`src/lib/firebase/types.d.ts` get shadowed by the real package types and
the wrappers become fully type-safe.

---

## 2. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `the-reflection-app`), accept the analytics defaults (or
   skip — analytics isn't used by the app).
3. Wait ~30 seconds for it to provision.

---

## 3. Enable the services

In the Firebase console for your new project:

1. **Build → Authentication → Get started**
   - Enable **Email/Password**
   - Enable **Google** (recommended — one-click sign-in for educators)
2. **Build → Firestore Database → Create database**
   - Start in **production mode**
   - Pick a region close to your users
3. **Build → Storage → Get started**
   - Start in **production mode**
   - Same region as Firestore

---

## 4. Copy the web app config

1. **Project settings (gear icon) → General → Your apps → Add app → Web (`</>`)**
2. Register the app (nickname `the-reflection-app`, no hosting needed —
   we use Vercel).
3. Firebase shows a `firebaseConfig` object that looks like:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef",
   };
   ```

4. Map those values into Vercel env vars:

   ```bash
   cd /Users/md/Refleckt

   # production
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

   # repeat for preview deployments
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY preview
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID preview
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID preview
   ```

   For local development, copy them into `.env.local` instead. `.env.local`
   is git-ignored.

`getFirebaseApp()`, `getFirestore()`, `getAuth()`, and `getStorage()` all
return `null` when these vars are absent — call sites should fall through
to the `store.xxx()` localStorage path.

---

## 5. Deploy security rules

Install the Firebase CLI once:

```bash
npm i -g firebase-tools
firebase login
```

Then from the repo root:

```bash
cd /Users/md/Refleckt
firebase use --add               # pick the project you just created
firebase deploy --only firestore:rules,storage
```

The deployed rules live in `firestore.rules` and `storage.rules`. They
already encode the spec's no-login student access path: anonymous users can
submit a reflection only when the matching activity has
`status == "assigned"` and the request's `groupId` matches the activity's
group.

---

## 6. Flip the runtime path (later, when ready)

`src/lib/firebase/queries.ts` mirrors the surface of `store.xxx()` in
`src/lib/storage.ts` exactly — same names, same shapes — so the swap is
mechanical. The 5-line edit looks like this (example for `createGroup`):

```ts
// src/lib/storage.ts — top of file
import { getFirestore, isFirebaseConfigured } from "@/lib/firebase/client";
import * as fb from "@/lib/firebase/queries";

// ... inside store.createGroup, before the localStorage write:
if (isFirebaseConfigured()) {
  const db = getFirestore();
  if (db) return fb.createGroup(db, input);
}
```

Repeat for each method on `store` you want to upgrade. Both paths can
coexist — start with one slice (e.g. `listReflections`) and migrate the
rest as you go. The localStorage store is intentionally **untouched** by
this scaffold so the current demo continues to work.

---

## 7. (Optional) Connect to local emulators

Firebase ships emulators for Firestore + Auth + Storage so you can develop
without touching production data:

```bash
firebase emulators:start
```

The wrappers in `src/lib/firebase/client.ts` don't auto-wire to emulators
yet — add a `connectFirestoreEmulator(...)` block at the bottom of
`getFirestore()` (and equivalents for Auth + Storage) when you need it.
