import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function canInit(): boolean {
  return Boolean(firebaseConfig.apiKey?.trim() && firebaseConfig.projectId?.trim());
}

export const app: FirebaseApp | null = canInit()
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

/** Browser-only — null during SSR. */
export const auth: Auth | null =
  typeof window !== "undefined" && app ? getAuth(app) : null;
