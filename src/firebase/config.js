import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// COLE SUAS CHAVES DO FIREBASE V2 AQUI
const firebaseConfig = {
    apiKey: "AIzaSyBWaylbmA6nnAMjTVBvLr9KvrFwlFJwQbM",
  authDomain: "gainflow-v2.firebaseapp.com",
  projectId: "gainflow-v2",
  storageBucket: "gainflow-v2.firebasestorage.app",
  messagingSenderId: "584157297919",
  appId: "1:584157297919:web:8b762c9b69dc3d8a8060ca"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };