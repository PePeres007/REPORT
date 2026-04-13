import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3XMc8t-wOrrriBjdaSu7POKfGbh9thb8",
  authDomain: "report-c3070.firebaseapp.com",
  projectId: "report-c3070",
  storageBucket: "report-c3070.firebasestorage.app",
  messagingSenderId: "1092143546861",
  appId: "1:1092143546861:web:29f582df4fb1940bed27e4",
  measurementId: "G-S4YG6BWHX3"
};

// Evita inicializar o app duas vezes
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Configura a autenticação para lembrar do usuário mesmo se fechar o app
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };

