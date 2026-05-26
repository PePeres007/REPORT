import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

class FirebaseService {
  private firestoreInstance: Firestore;
  private authInstance: Auth;
  private storageInstance: FirebaseStorage;

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyA3XMc8t-w0rrriBjdaSu7POKfGbh9thb8",
      authDomain: "report-c3070.firebaseapp.com",
      projectId: "report-c3070",
      storageBucket: "report-c3070.firebasestorage.app",
      messagingSenderId: "1092143546861",
      appId: "1:1092143546861:web:29f582df4fb1940bed27e4",
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    this.firestoreInstance = getFirestore(app);
    this.authInstance = getAuth(app);
    this.storageInstance = getStorage(app); 
  }

  public getFirestore(): Firestore {
    return this.firestoreInstance;
  }

  public getAuth(): Auth {
    return this.authInstance;
  }

  public getStorage(): FirebaseStorage {
    return this.storageInstance;
  }
}

const firebaseServiceInstance = new FirebaseService();

export const db = firebaseServiceInstance.getFirestore();
export const auth = firebaseServiceInstance.getAuth();
export const storage = firebaseServiceInstance.getStorage();