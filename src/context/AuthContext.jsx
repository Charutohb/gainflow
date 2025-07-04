import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// 1. Cria o Contexto, que é como um "canal" global para os dados do usuário.
const AuthContext = createContext();

// 2. Cria um "hook" personalizado para facilitar o acesso a esses dados.
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Cria o "Provedor", o componente que gerencia e fornece os dados.
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // "onAuthStateChanged" é um "espião" do Firebase que nos avisa sobre mudanças de login.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se há um usuário, busca seu perfil no Firestore.
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Combina os dados do Auth (uid, email) com os do Firestore (nome, perfil).
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            ...userDocSnap.data(),
          });
        } else {
          // Caso o usuário exista no Auth mas não no Firestore.
          setCurrentUser(user);
        }
      } else {
        // Se não há usuário logado, define como nulo.
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Limpa o "espião" ao desmontar.
  }, []);

  const value = {
    currentUser,
  };

  // Só renderiza o aplicativo quando a verificação de login estiver completa.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
