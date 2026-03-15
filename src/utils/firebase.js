// ── Firebase Configuration ───────────────────────────────────────────────
// Replace the placeholder values below with your actual Firebase project config.
// Get these from: Firebase Console → Project Settings → General → Your Apps → Web App
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FB_API_KEY            || "YOUR_API_KEY",
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN        || "YOUR_PROJECT.firebaseapp.com",
  projectId:         import.meta.env.VITE_FB_PROJECT_ID         || "YOUR_PROJECT_ID",
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET     || "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_ID       || "YOUR_SENDER_ID",
  appId:             import.meta.env.VITE_FB_APP_ID             || "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore with offline persistence (works across multiple tabs)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export default app;
