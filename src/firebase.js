import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAzrheo6aFCUaq7LB4BBC1vtjg9lfCDwPU",
  authDomain: "babel-pastries.firebaseapp.com",
  projectId: "babel-pastries",
  storageBucket: "babel-pastries.firebasestorage.app",
  messagingSenderId: "391551115236",
  appId: "1:391551115236:web:386d60728f251bddc9b1f1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);