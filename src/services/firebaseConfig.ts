import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
// Unificamos tudo do auth em uma única linha, direto da raiz 'firebase/auth'
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3XMc8t-w0rrriBjdaSu7POKfGbh9thb8",
  authDomain: "report-c3070.firebaseapp.com",
  projectId: "report-c3070",
  storageBucket: "report-c3070.firebasestorage.app",
  messagingSenderId: "1092143546861",
  appId: "1:1092143546861:web:29f582df4fb1940bed27e4",
};
// ... seus imports e sua const firebaseConfig lá em cima ...

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    // @ts-ignore - Ignora o falso erro de tipagem do Firebase com o Expo
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };

