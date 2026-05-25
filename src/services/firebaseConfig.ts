import { getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from 'firebase/firestore';

class FirebaseService {
  private firestoreInstance: Firestore;

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyA3XMc8t-w0rrriBjdaSu7POKfGbh9thb8",
      authDomain: "report-c3070.firebaseapp.com",
      projectId: "report-c3070",
      storageBucket: "report-c3070.firebasestorage.app",
      messagingSenderId: "1092143546861",
      appId: "1:1092143546861:web:29f582df4fb1940bed27e4",
    };

    // Validação condicional para reaproveitar a instância caso o app já tenha sido inicializado
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    this.firestoreInstance = getFirestore(app);
  }

  public getFirestore(): Firestore {
    return this.firestoreInstance;
  }
}

const firebaseServiceInstance = new FirebaseService();
export const db = firebaseServiceInstance.getFirestore();