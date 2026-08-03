import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { APP_CONFIG } from "./config.js";

const app = initializeApp(APP_CONFIG.firebase);
const auth = getAuth(app);
const db = getDatabase(app);
setPersistence(auth, browserLocalPersistence).catch(console.warn);

export const Firebase = {
  auth,
  db,
  onAuth: (callback) => onAuthStateChanged(auth, callback),
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signOut: () => firebaseSignOut(auth),
  async get(path, fallback = null) {
    try {
      const snap = await get(ref(db, path));
      return snap.exists() ? snap.val() : fallback;
    } catch (error) {
      if (/permission[_-]?denied/i.test(String(error?.code || error?.message || ""))) return fallback;
      throw error;
    }
  },
  set: (path, value) => set(ref(db, path), value),
  update: (path, value) => update(ref(db, path), value),
  multiUpdate: (updates) => update(ref(db), updates),
  newKey: (path) => push(ref(db, path)).key,
  remove: (path) => remove(ref(db, path)),
  async push(path, value) {
    const node = push(ref(db, path));
    await set(node, value);
    return node.key;
  },
  listen(path, callback) {
    return onValue(ref(db, path), (snap) => callback(snap.exists() ? snap.val() : null));
  },
  transaction(path, updater) {
    return runTransaction(ref(db, path), updater);
  }
};
