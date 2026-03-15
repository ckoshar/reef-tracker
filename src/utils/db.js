// ── Database helper — Firestore (cloud sync) + localStorage fallback ─────
import { db as firestore } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

let _uid = null;

const DB = {
  /** Call this when the user signs in/out so we know where to read/write */
  setUser(uid) {
    _uid = uid;
  },

  /** Read a key. Firestore if signed in, localStorage otherwise. */
  async get(k) {
    // — Firestore path —
    if (_uid) {
      try {
        const snap = await getDoc(doc(firestore, "users", _uid, "data", k));
        if (snap.exists()) return snap.data().value;
      } catch (e) {
        console.warn("Firestore read failed, falling back to localStorage:", e);
      }
    }
    // — localStorage fallback —
    try {
      const v = localStorage.getItem("reef_" + k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },

  /** Write a key. Always writes localStorage (fast cache). Also writes Firestore if signed in. */
  async set(k, v) {
    // Always keep localStorage as a fast local cache
    try {
      localStorage.setItem("reef_" + k, JSON.stringify(v));
    } catch (e) {
      console.error("localStorage write failed:", e);
    }
    // — Firestore write —
    if (_uid) {
      try {
        await setDoc(doc(firestore, "users", _uid, "data", k), { value: v });
      } catch (e) {
        console.error("Firestore write failed:", e);
      }
    }
  },

  /** Migrate all localStorage data into Firestore (run once after first sign-in) */
  async migrateToCloud() {
    if (!_uid) return;
    const keys = [
      "tank", "params", "feed", "maint", "dose", "light",
      "equip", "report", "inventory", "settings", "journal",
      "livestock", "aiMemory",
    ];
    for (const k of keys) {
      try {
        const v = localStorage.getItem("reef_" + k);
        if (v) {
          const parsed = JSON.parse(v);
          await setDoc(doc(firestore, "users", _uid, "data", k), { value: parsed });
        }
      } catch (e) {
        console.error(`Migration failed for "${k}":`, e);
      }
    }
    // Also migrate the Gemini API key
    const geminiKey = localStorage.getItem("reef_geminiKey");
    if (geminiKey) {
      await setDoc(doc(firestore, "users", _uid, "data", "geminiKey"), { value: geminiKey });
    }
  },
};

export default DB;
