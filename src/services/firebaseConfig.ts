import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


import { Auth, getAuth, initializeAuth } from 'firebase/auth';

// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA3XMc8t-w0rrriBjdaSu7POKfGbh9thb8",
  authDomain: "report-c3070.firebaseapp.com",
  projectId: "report-c3070",
  storageBucket: "report-c3070.firebasestorage.app",
  messagingSenderId: "1092143546861",
  appId: "1:1092143546861:web:29f582df4fb1940bed27e4",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: Auth; 

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };

