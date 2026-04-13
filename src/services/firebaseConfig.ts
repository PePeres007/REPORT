// arquivo: src/services/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // <-- Descomentaremos depois para as fotos!

const firebaseConfig = {
  apiKey: "AIzaSyDgyRfFVQkstLhoZvMEdLJKKme2f6SoZfg",
  authDomain: "report-463d6.firebaseapp.com",
  projectId: "report-463d6",
  storageBucket: "report-463d6.firebasestorage.app",
  messagingSenderId: "362404266188",
  appId: "1:362404266188:web:44fd3b3bdf2207c51d4269",
  measurementId: "G-GPGD8NX7WG"
};

// 1. Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// 2. Exporta os serviços para o resto do app usar
export const auth = getAuth(app);
export const db = getFirestore(app);