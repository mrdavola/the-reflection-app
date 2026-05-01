// Ambient module declarations so typecheck passes without `firebase` installed.
// Once the user runs:
//
//   npm i firebase
//
// these declarations get shadowed by the real package types and the wrappers
// below start working with full type-safety.
//
// We intentionally type the surface as `any` so the wrappers don't need to
// know the real shape; the wrappers narrow at the use site.

declare module "firebase/app" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type FirebaseApp = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type FirebaseOptions = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function initializeApp(options: any, name?: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getApp(name?: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getApps(): any[];
}

declare module "firebase/firestore" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Firestore = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DocumentData = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type QueryDocumentSnapshot = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DocumentSnapshot = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type CollectionReference = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DocumentReference = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Query = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type WriteBatch = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Timestamp = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getFirestore(app?: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function collection(db: any, path: string, ...rest: string[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function doc(db: any, path: string, ...rest: string[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getDoc(ref: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getDocs(query: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function setDoc(ref: any, data: any, options?: any): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function updateDoc(ref: any, data: any): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function deleteDoc(ref: any): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function addDoc(ref: any, data: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function query(ref: any, ...constraints: any[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function where(field: string, op: string, value: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function orderBy(field: string, direction?: "asc" | "desc"): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function limit(n: number): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function writeBatch(db: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function serverTimestamp(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Timestamp: any;
}

declare module "firebase/auth" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Auth = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type User = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getAuth(app?: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function onAuthStateChanged(auth: any, cb: (user: any) => void): () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function signOut(auth: any): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const GoogleAuthProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
}

declare module "firebase/storage" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type FirebaseStorage = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type StorageReference = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getStorage(app?: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function ref(storage: any, path?: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function uploadBytes(ref: any, data: any, metadata?: any): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getDownloadURL(ref: any): Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function deleteObject(ref: any): Promise<void>;
}
