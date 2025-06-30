import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// O BLOCO DO SEU NOVO PROJETO VAI AQUI DENTRO
const firebaseConfig = {
  apiKey: "AIzaSyBWaylbmA6nnAMjTVBvLr9KvrFwlFJwQbM",
  authDomain: "gainflow-v2.firebaseapp.com",
  projectId: "gainflow-v2",
  storageBucket: "gainflow-v2.firebasestorage.app",
  messagingSenderId: "584157297919",
  appId: "1:584157297919:web:8b762c9b69dc3d8a8060ca"
};

// ==========================================================
// ESTAS LINHAS ABAIXO SÃO ESSENCIAIS E PROVAVELMENTE SUMIRAM
// ==========================================================

// Inicializa os serviços do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta os serviços para serem usados em outras partes do aplicativo
export { app, auth, db };