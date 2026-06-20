import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  writeBatch
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../../firebase-applet-config.json";

// Initialize Firebase client
export const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Target the explicit custom databaseId provisioned by AI Studio
export const db = getFirestore(
  firebaseApp,
  config.firestoreDatabaseId || "(default)"
);

// Verify Connection as strictly dictated by the Firebase Integration guideline
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection initialized successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Firebase is offline. Please check network/config.");
    }
  }
}
testConnection();

// Generic helpers for syncing collections
export { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch };
